import asyncio
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from app.db.session import get_session
from app.main import app
from app.models.customer import Customer
from app.models.session import Session
from tests.conftest import TEST_DATABASE_URL
from tests.helpers import (
    create_audience_type,
    create_course,
    create_customer,
    create_industry,
    unique_name,
)

DURATIONS = ("半天", "一天", "两天", "其他")


def build_payload(client: TestClient, **overrides: object) -> dict[str, object]:
    payload: dict[str, object] = {
        "customer_id": create_customer(client)["id"],
        "course_id": create_course(client)["id"],
        "session_date": "2026-03-09",
        "audience_type_ids": [create_audience_type(client)["id"]],
        "audience_description": "虚构人群描述：来自三个虚构部门的一线主管。",
        "duration": "一天",
        "notes": "虚构场次备注",
    }
    payload.update(overrides)
    return payload


def test_create_session_and_read_back_every_field(client: TestClient) -> None:
    industry = create_industry(client)
    customer = create_customer(client, industry_id=industry["id"])
    course = create_course(client)
    first_audience = create_audience_type(client, name=unique_name("虚构人群"))
    second_audience = create_audience_type(client, name=unique_name("虚构人群"))

    response = client.post("/api/v1/sessions", json={
        "customer_id": customer["id"],
        "course_id": course["id"],
        "session_date": "2026-03-09",
        "audience_type_ids": [second_audience["id"], first_audience["id"]],
        "audience_description": "虚构人群描述：\n一线主管 20 人，含两名新任经理。",
        "duration": "两天",
        "notes": "虚构备注：需提前准备投影。",
    })
    assert response.status_code == 201, response.text
    created = response.json()

    # 重新打开场次，完整读回全部信息
    reopened = client.get(f"/api/v1/sessions/{created['id']}")
    assert reopened.status_code == 200
    session = reopened.json()
    assert session["session_date"] == "2026-03-09"
    assert session["duration"] == "两天"
    assert session["audience_description"] == "虚构人群描述：\n一线主管 20 人，含两名新任经理。"
    assert session["notes"] == "虚构备注：需提前准备投影。"

    # 客户实体引用，含行业
    assert session["customer"]["id"] == customer["id"]
    assert session["customer"]["name"] == customer["name"]

    # 多选人群类型全部保留，并按名称排序读回
    returned_ids = [item["id"] for item in session["audience_types"]]
    assert len(returned_ids) == 2
    assert sorted(returned_ids) == sorted([first_audience["id"], second_audience["id"]])
    returned_names = [item["name"] for item in session["audience_types"]]
    assert returned_names == sorted(returned_names)

    # 一门主课程
    assert session["course"]["id"] == course["id"]
    assert session["course"]["name"] == course["name"]
    assert session["course"]["status"] == "启用"


def test_session_course_status_follows_latest_entity_state(client: TestClient) -> None:
    payload = build_payload(client)
    session = client.post("/api/v1/sessions", json=payload).json()
    course_id = str(payload["course_id"])
    client.put(f"/api/v1/courses/{course_id}",
               json={"name": f"虚构改名课程 {uuid4().hex[:8]}", "status": "停用"})

    reopened = client.get(f"/api/v1/sessions/{session['id']}").json()
    assert reopened["course"]["status"] == "停用"
    assert reopened["course"]["name"].startswith("虚构改名课程")


def test_customer_rename_is_reflected_in_session(client: TestClient) -> None:
    payload = build_payload(client)
    session = client.post("/api/v1/sessions", json=payload).json()
    customer_id = str(payload["customer_id"])
    new_name = unique_name("虚构改名客户")
    client.put(f"/api/v1/customers/{customer_id}", json={"name": new_name})

    reopened = client.get(f"/api/v1/sessions/{session['id']}").json()
    assert reopened["customer"]["name"] == new_name


@pytest.mark.parametrize("duration", DURATIONS)
def test_every_documented_duration_is_accepted(client: TestClient, duration: str) -> None:
    response = client.post("/api/v1/sessions", json=build_payload(client, duration=duration))
    assert response.status_code == 201, response.text
    assert response.json()["duration"] == duration


def test_session_list_is_paginated_and_ordered_by_date(client: TestClient) -> None:
    customer = create_customer(client)
    course = create_course(client)
    audience = create_audience_type(client)
    for day in ("2026-01-05", "2026-02-05", "2026-03-05"):
        created = client.post("/api/v1/sessions", json={
            "customer_id": customer["id"],
            "course_id": course["id"],
            "session_date": day,
            "audience_type_ids": [audience["id"]],
            "duration": "半天",
        })
        assert created.status_code == 201, created.text

    page = client.get("/api/v1/sessions", params={"page": 1, "page_size": 2})
    assert page.status_code == 200
    assert page.json()["total"] >= 3
    assert len(page.json()["items"]) == 2
    assert page.json()["page"] == 1
    assert page.json()["page_size"] == 2
    assert client.get("/api/v1/sessions?page_size=101").status_code == 422

    created_ids = {
        item["id"] for item in client.get("/api/v1/sessions",
                                          params={"page_size": 100}).json()["items"]
    }
    dated = client.get("/api/v1/sessions", params={"page_size": 100}).json()["items"]
    dates = [item["session_date"] for item in dated if item["id"] in created_ids]
    assert dates == sorted(dates, reverse=True)  # 按开始日期倒序


@pytest.mark.parametrize("overrides", [
    {"audience_type_ids": []},
    {"audience_type_ids": ["not-a-uuid"]},
    {"duration": "三天"},
    {"duration": ""},
    {"session_date": "2026-13-40"},
    {"session_date": None},
    {"customer_id": None},
    {"course_id": None},
    {"audience_type_ids": None},
    {"customer_id": "550e8400-e29b-41d4-a716-446655440000", "unexpected": 1},
])
def test_session_rejects_invalid_input(client: TestClient,
                                       overrides: dict[str, object]) -> None:
    payload = build_payload(client)
    payload.update(overrides)
    response = client.post("/api/v1/sessions", json=payload)
    assert response.status_code == 422, response.text
    assert response.json()["error"]["code"] == "VALIDATION_ERROR"


def test_session_requires_an_existing_customer(client: TestClient) -> None:
    payload = build_payload(client, customer_id=str(uuid4()))
    response = client.post("/api/v1/sessions", json=payload)
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "CUSTOMER_NOT_FOUND"


def test_session_requires_an_existing_course(client: TestClient) -> None:
    payload = build_payload(client, course_id=str(uuid4()))
    response = client.post("/api/v1/sessions", json=payload)
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "COURSE_NOT_FOUND"


def test_session_requires_existing_audience_types(client: TestClient) -> None:
    payload = build_payload(client, audience_type_ids=[str(uuid4())])
    response = client.post("/api/v1/sessions", json=payload)
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "AUDIENCE_TYPE_NOT_FOUND"


def test_duplicate_audience_type_ids_are_saved_once(client: TestClient) -> None:
    audience = create_audience_type(client)
    payload = build_payload(client, audience_type_ids=[audience["id"], audience["id"]])
    response = client.post("/api/v1/sessions", json=payload)
    assert response.status_code == 201, response.text
    assert len(response.json()["audience_types"]) == 1


def test_unknown_session_returns_not_found(client: TestClient) -> None:
    assert client.get(f"/api/v1/sessions/{uuid4()}").status_code == 404


def test_audience_description_and_notes_are_independent(client: TestClient) -> None:
    payload = build_payload(client, audience_description="虚构听众构成说明", notes="虚构其他备注")
    session = client.post("/api/v1/sessions", json=payload).json()
    assert session["audience_description"] == "虚构听众构成说明"
    assert session["notes"] == "虚构其他备注"

    without_optional = build_payload(client, audience_description=None, notes=None)
    minimal = client.post("/api/v1/sessions", json=without_optional)
    assert minimal.status_code == 201, minimal.text
    assert minimal.json()["audience_description"] is None
    assert minimal.json()["notes"] is None


def test_session_date_is_start_date_for_multi_day_duration(client: TestClient) -> None:
    session = client.post("/api/v1/sessions",
                          json=build_payload(client, session_date="2026-05-01",
                                            duration="两天")).json()
    reopened = client.get(f"/api/v1/sessions/{session['id']}").json()
    assert reopened["session_date"] == "2026-05-01"
    assert "duration_note" not in reopened
    assert "end_date" not in reopened


def test_database_enforces_session_foreign_keys() -> None:
    asyncio.run(_check_session_foreign_keys())


async def _check_session_foreign_keys() -> None:
    engine = create_async_engine(TEST_DATABASE_URL)
    try:
        async with engine.connect() as conn:
            trans = await conn.begin()
            try:
                with pytest.raises(IntegrityError):
                    await conn.execute(text(
                        "insert into sessions (id, customer_id, course_id, session_date, duration) "
                        "values (:id, :customer, :course, '2026-01-01', '一天')"
                    ), {"id": uuid4(), "customer": uuid4(), "course": uuid4()})
            finally:
                await trans.rollback()

        async with engine.connect() as conn:
            trans = await conn.begin()
            try:
                with pytest.raises(IntegrityError):
                    await conn.execute(text(
                        "insert into sessions (id, customer_id, course_id, session_date, duration) "
                        "values (:id, :customer, :course, '2026-01-01', '三天')"
                    ), {"id": uuid4(), "customer": uuid4(), "course": uuid4()})
            finally:
                await trans.rollback()
    finally:
        await engine.dispose()


def test_database_enforces_customer_unique_name() -> None:
    asyncio.run(_check_customer_unique_name())


async def _check_customer_unique_name() -> None:
    engine = create_async_engine(TEST_DATABASE_URL)
    name = unique_name("虚构唯一客户")
    try:
        async with engine.connect() as conn:
            trans = await conn.begin()
            try:
                await conn.execute(text("insert into customers (id, name) values (:id, :name)"),
                                   {"id": uuid4(), "name": name})
                with pytest.raises(IntegrityError):
                    await conn.execute(
                        text("insert into customers (id, name) values (:id, :name)"),
                        {"id": uuid4(), "name": name})
            finally:
                await trans.rollback()
    finally:
        await engine.dispose()


def test_concurrent_duplicate_customer_names_hit_one_unique_violation() -> None:
    """并发写入同一标准名称时恰好一个事务违反唯一约束，进程不会死锁。"""
    asyncio.run(_check_concurrent_customer_conflict())


async def _check_concurrent_customer_conflict() -> None:
    engine = create_async_engine(TEST_DATABASE_URL, poolclass=NullPool)
    name = unique_name("虚构并发客户")
    try:
        async def insert() -> str:
            async with AsyncSession(bind=engine) as session:
                session.add(_customer(name))
                try:
                    await session.commit()
                    return "committed"
                except IntegrityError:
                    await session.rollback()
                    return "conflict"

        results = await asyncio.wait_for(
            asyncio.gather(insert(), insert()), timeout=15
        )
        assert sorted(results) == ["committed", "conflict"], results
    finally:
        await engine.dispose()


def _customer(name: str) -> Customer:
    return Customer(name=name)


def test_duplicate_name_reaching_database_returns_business_conflict(client: TestClient) -> None:
    """并发下绕过接口预检查时，唯一约束仍必须转成业务冲突 409，而不是数据库 500。"""
    name = unique_name("虚构兜底客户")
    create_customer(client, name=name)

    engine = create_async_engine(TEST_DATABASE_URL, poolclass=NullPool)
    maker = async_sessionmaker(engine, expire_on_commit=False)

    async def session_without(_missing: str | None = None):  # 保持与 get_session 相同的依赖签名
        async with maker() as session:
            yield session

    app.dependency_overrides[get_session] = session_without
    try:
        with TestClient(app) as fallback_client:
            response = fallback_client.post("/api/v1/customers", json={"name": name})
    finally:
        app.dependency_overrides.clear()
        asyncio.run(engine.dispose())

    assert response.status_code == 409, response.text
    body = response.json()["error"]
    assert body["code"] == "CONFLICT"
    assert body["request_id"] == response.headers["x-request-id"]
    assert "duplicate" not in response.text.lower()


def test_session_model_has_no_task3_fields() -> None:
    """Task 2 边界：不提前引入计划素材 / 使用记录 / 素材家族字段。"""
    assert set(Session.__table__.columns.keys()) == {
        "id", "customer_id", "course_id", "session_date", "audience_description",
        "duration", "notes", "created_at", "updated_at",
    }
    assert set(Customer.__table__.columns.keys()) == {
        "id", "name", "short_name", "industry_id", "group_name", "notes",
        "created_at", "updated_at",
    }
