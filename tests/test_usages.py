import asyncio
from typing import TypedDict
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.pool import NullPool

from app.models.usage import Usage
from app.schemas.usage import UsageCreate
from tests.conftest import TEST_DATABASE_URL
from tests.helpers import create_material, create_session_for, unique_name


class UsageMaterial(TypedDict):
    id: str
    title: str
    type: str | None
    body: str | None
    status: str
    created_at: str
    updated_at: str


class UsagePayload(TypedDict):
    id: str
    session_id: str
    material_id: str
    status: str
    effect: str
    reaction: str | None
    material: UsageMaterial
    created_at: str
    updated_at: str


def plan(client: TestClient, session_id: str, material_id: str) -> UsagePayload:
    response = client.post(f"/api/v1/sessions/{session_id}/usages",
                           json={"material_id": material_id})
    assert response.status_code == 201, response.text
    return response.json()


def list_usages(client: TestClient, session_id: str) -> list[UsagePayload]:
    response = client.get(f"/api/v1/sessions/{session_id}/usages")
    assert response.status_code == 200, response.text
    return response.json()


# 验收 1：新场次没有计划素材时，使用记录为空
def test_new_session_has_no_planned_materials(client: TestClient) -> None:
    session = create_session_for(client)
    assert list_usages(client, session["id"]) == []


# 验收 2 + 3：加入素材生成“计划 + 未评”，刷新后仍能完整读回
def test_planned_material_creates_planned_unrated_usage(client: TestClient) -> None:
    session = create_session_for(client)
    material = create_material(client)
    created = plan(client, session["id"], material["id"])

    assert created["status"] == "计划"
    assert created["effect"] == "未评"
    assert created["reaction"] is None
    assert created["session_id"] == session["id"]
    assert created["material_id"] == material["id"]
    assert created["material"]["title"] == material["title"]
    assert created["material"]["type"] == "故事"
    assert created["material"]["status"] == "草稿"
    assert created["created_at"] and created["updated_at"]

    # 重新请求（等价于刷新页面）后仍完整读回
    reopened = list_usages(client, session["id"])
    assert len(reopened) == 1
    assert reopened[0] == created


# 验收 4：同一场次可以计划多个不同素材
def test_session_can_plan_multiple_materials(client: TestClient) -> None:
    session = create_session_for(client)
    first = create_material(client, title=unique_name("虚构素材"))
    second = create_material(client, title=unique_name("虚构素材"), material_type="案例")
    plan(client, session["id"], first["id"])
    plan(client, session["id"], second["id"])

    usages = list_usages(client, session["id"])
    assert {item["material_id"] for item in usages} == {first["id"], second["id"]}
    assert [item["status"] for item in usages] == ["计划", "计划"]
    assert [item["effect"] for item in usages] == ["未评", "未评"]


# 验收 5：同一素材不能在同一场次产生两条使用记录
def test_same_material_cannot_be_planned_twice_in_one_session(client: TestClient) -> None:
    session = create_session_for(client)
    material = create_material(client)
    plan(client, session["id"], material["id"])

    duplicate = client.post(f"/api/v1/sessions/{session['id']}/usages",
                            json={"material_id": material["id"]})
    assert duplicate.status_code == 409, duplicate.text
    body = duplicate.json()["error"]
    assert body["code"] == "CONFLICT"
    assert body["request_id"] == duplicate.headers["x-request-id"]
    assert "duplicate" not in duplicate.text.lower()
    assert len(list_usages(client, session["id"])) == 1


# 验收 6：同一个素材可以被不同场次分别计划
def test_same_material_can_be_planned_by_different_sessions(client: TestClient) -> None:
    material = create_material(client)
    first_session = create_session_for(client)
    second_session = create_session_for(client)
    first_usage = plan(client, first_session["id"], material["id"])
    second_usage = plan(client, second_session["id"], material["id"])

    assert first_usage["id"] != second_usage["id"]
    assert len(list_usages(client, first_session["id"])) == 1
    assert len(list_usages(client, second_session["id"])) == 1


# 验收 7：撤销计划后使用记录消失，不变成“未用”
def test_removing_plan_deletes_usage_instead_of_marking_unused(client: TestClient) -> None:
    session = create_session_for(client)
    material = create_material(client)
    usage = plan(client, session["id"], material["id"])

    removed = client.delete(f"/api/v1/sessions/{session['id']}/usages/{usage['id']}")
    assert removed.status_code == 204, removed.text
    assert list_usages(client, session["id"]) == []

    # 数据库中没有残留记录，更没有“未用”状态
    assert asyncio.run(_usage_states(usage["id"])) is None


# 验收 8：未知场次、未知素材、错误归属的删除都有明确失败响应
def test_unknown_session_and_material_are_rejected(client: TestClient) -> None:
    material = create_material(client)
    unknown_session = uuid4()

    assert client.get(f"/api/v1/sessions/{unknown_session}/usages").status_code == 404
    assert client.post(f"/api/v1/sessions/{unknown_session}/usages",
                       json={"material_id": material["id"]}).status_code == 404

    session = create_session_for(client)
    missing_material = client.post(f"/api/v1/sessions/{session['id']}/usages",
                                   json={"material_id": str(uuid4())})
    assert missing_material.status_code == 404
    assert missing_material.json()["error"]["code"] == "NOT_FOUND"


def test_deleting_unknown_or_foreign_usage_is_rejected(client: TestClient) -> None:
    first_session = create_session_for(client)
    second_session = create_session_for(client)
    material = create_material(client)
    usage = plan(client, first_session["id"], material["id"])

    # 使用记录真实存在，但不属于该场次
    foreign = client.delete(f"/api/v1/sessions/{second_session['id']}/usages/{usage['id']}")
    assert foreign.status_code == 404
    assert foreign.json()["error"]["code"] == "NOT_FOUND"
    assert len(list_usages(client, first_session["id"])) == 1

    assert client.delete(
        f"/api/v1/sessions/{first_session['id']}/usages/{uuid4()}").status_code == 404
    assert client.delete(f"/api/v1/sessions/{uuid4()}/usages/{uuid4()}").status_code == 404


def test_removing_once_then_again_is_not_found(client: TestClient) -> None:
    session = create_session_for(client)
    material = create_material(client)
    usage = plan(client, session["id"], material["id"])
    path = f"/api/v1/sessions/{session['id']}/usages/{usage['id']}"
    assert client.delete(path).status_code == 204
    again = client.delete(path)
    assert again.status_code == 404


# 验收 9：草稿素材允许被计划（V1 快速录入素材全是草稿）
def test_draft_material_can_be_planned(client: TestClient) -> None:
    session = create_session_for(client)
    material = create_material(client, title=unique_name("虚构草稿素材"))
    assert client.get(f"/api/v1/materials/{material['id']}").json()["status"] == "草稿"

    usage = plan(client, session["id"], material["id"])
    assert usage["status"] == "计划"
    assert usage["material"]["status"] == "草稿"


# 验收 11：POST 不接受状态 / 效果 / 现场反应，客户端不能提前写入
@pytest.mark.parametrize("payload", [
    {"material_id": "not-a-uuid"},
    {},
    {"material_id": None},
    {"material_id": "00000000-0000-0000-0000-000000000000", "status": "已用"},
    {"material_id": "00000000-0000-0000-0000-000000000000", "effect": "好"},
    {"material_id": "00000000-0000-0000-0000-000000000000", "reaction": "虚构现场反应"},
    {"material_id": "00000000-0000-0000-0000-000000000000", "status": "未用"},
])
def test_usage_create_payload_rejects_task4_fields(client: TestClient,
                                                    payload: dict[str, object]) -> None:
    session = create_session_for(client)
    response = client.post(f"/api/v1/sessions/{session['id']}/usages", json=payload)
    assert response.status_code == 422, response.text
    assert response.json()["error"]["code"] == "VALIDATION_ERROR"
    assert list_usages(client, session["id"]) == []


def test_usage_create_schema_only_accepts_material_id() -> None:
    assert set(UsageCreate.model_fields.keys()) == {"material_id"}


def test_responses_do_not_expose_task4_capability(client: TestClient) -> None:
    """响应体中的状态与效果只能由服务端产生，且当前固定为“计划 + 未评”。"""
    session = create_session_for(client)
    material = create_material(client)
    plan(client, session["id"], material["id"])
    statuses = {item["status"] for item in list_usages(client, session["id"])}
    effects = {item["effect"] for item in list_usages(client, session["id"])}
    assert statuses == {"计划"}
    assert effects == {"未评"}
    assert "未用" not in statuses
    assert "已用" not in statuses
    assert "好" not in effects and "差" not in effects


def test_no_usage_update_or_effect_routes_exist(client: TestClient) -> None:
    from app.main import app

    usage_paths = {getattr(route, "path", "") for route in app.routes}
    assert not any(path.endswith("/usages/{usage_id}") and path !=
                   "/api/v1/sessions/{session_id}/usages/{usage_id}" for path in usage_paths)
    for path in usage_paths:
        if "/usages" in path:
            permitted = {method for route in app.routes
                         if getattr(route, "path", "") == path
                         for method in getattr(route, "methods", set())}
            assert not ({"PUT", "PATCH"} & permitted), f"{path} 暴露了 Task 4 的更新能力"


def test_usage_model_has_no_task4_columns() -> None:
    assert set(Usage.__table__.columns.keys()) == {
        "id", "session_id", "material_id", "status", "effect", "reaction",
        "created_at", "updated_at",
    }


# 数据库级约束：状态与效果合法值、同一场次同一素材唯一、外键真实存在
def test_database_enforces_usage_constraints() -> None:
    asyncio.run(_check_usage_constraints())


async def _check_usage_constraints() -> None:
    engine = create_async_engine(TEST_DATABASE_URL, poolclass=NullPool)
    insert = ("insert into usages (id, session_id, material_id, status, effect) "
              "values (:id, :session, :material, :status, :effect)")
    try:
        for status, effect in (("已讲", "未评"), ("计划", "一般"), ("计划", ""), ("", "未评")):
            async with engine.connect() as conn:
                trans = await conn.begin()
                try:
                    with pytest.raises(IntegrityError):
                        await conn.execute(text(insert), {
                            "id": uuid4(), "session": uuid4(), "material": uuid4(),
                            "status": status, "effect": effect,
                        })
                finally:
                    await trans.rollback()

        # 外键：不存在的场次或素材
        for session_id, material_id in ((uuid4(), uuid4()),):
            async with engine.connect() as conn:
                trans = await conn.begin()
                try:
                    with pytest.raises(IntegrityError):
                        await conn.execute(text(insert), {
                            "id": uuid4(), "session": session_id, "material": material_id,
                            "status": "计划", "effect": "未评",
                        })
                finally:
                    await trans.rollback()
    finally:
        await engine.dispose()


def test_database_rejects_duplicate_session_material_pair(client: TestClient) -> None:
    """并发下绕过接口预检查时，唯一约束仍然生效。"""
    session = create_session_for(client)
    material = create_material(client)
    plan(client, session["id"], material["id"])
    assert asyncio.run(_insert_raw_usage(session["id"], material["id"])) == "conflict"


async def _insert_raw_usage(session_id: str, material_id: str) -> str:
    from uuid import UUID

    engine = create_async_engine(TEST_DATABASE_URL, poolclass=NullPool)
    try:
        async with engine.connect() as conn:
            trans = await conn.begin()
            try:
                await conn.execute(
                    text("insert into usages (id, session_id, material_id) "
                         "values (:id, :session, :material)"),
                    {"id": uuid4(), "session": UUID(session_id), "material": UUID(material_id)})
            except IntegrityError:
                return "conflict"
            finally:
                await trans.rollback()
        return "inserted"
    finally:
        await engine.dispose()


async def _usage_states(usage_id: str) -> tuple[str, ...] | None:
    from uuid import UUID

    engine = create_async_engine(TEST_DATABASE_URL, poolclass=NullPool)
    try:
        async with engine.connect() as conn:
            row = await conn.execute(
                text("select status, effect from usages where id = :id"), {"id": UUID(usage_id)})
            found = row.one_or_none()
            return None if found is None else (found[0], found[1])
    finally:
        await engine.dispose()
