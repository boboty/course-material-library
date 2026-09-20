import os
from collections.abc import AsyncIterator, Iterator
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.db.session import get_session
from app.main import app
from app.models.material import Material

TEST_DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL", "postgresql+asyncpg://benyan:benyan_local@localhost:5432/benyan_test"
)
assert TEST_DATABASE_URL.endswith("/benyan_test")


@pytest.fixture
def client() -> Iterator[TestClient]:
    engine = create_async_engine(TEST_DATABASE_URL)
    maker = async_sessionmaker(engine, expire_on_commit=False)

    async def test_session() -> AsyncIterator[AsyncSession]:
        async with maker() as session:
            yield session

    app.dependency_overrides[get_session] = test_session
    with TestClient(app) as result:
        yield result
    app.dependency_overrides.clear()
    import asyncio
    asyncio.run(engine.dispose())


def test_create_search_detail_and_pagination(client: TestClient) -> None:
    marker = uuid4().hex
    for number in range(2):
        response = client.post("/api/v1/materials", json={
            "title": f"虚构素材 {marker} {number}", "type": "故事", "body": "虚构正文",
        })
        assert response.status_code == 201
        assert response.json()["status"] == "草稿"
    result = client.get("/api/v1/materials", params={"q": marker, "page_size": 1})
    assert result.status_code == 200
    assert result.json()["total"] == 2
    assert len(result.json()["items"]) == 1
    material_id = result.json()["items"][0]["id"]
    assert client.get(f"/api/v1/materials/{material_id}").json()["id"] == material_id
    assert len(client.get("/api/v1/materials", params={"q": marker, "page": 2,
                                                       "page_size": 1}).json()["items"]) == 1


def test_duplicate_title_is_allowed(client: TestClient) -> None:
    payload = {"title": f"虚构同名 {uuid4().hex}", "type": "Demo", "body": "虚构正文"}
    assert client.post("/api/v1/materials", json=payload).status_code == 201
    assert client.post("/api/v1/materials", json=payload).status_code == 201
    assert client.get("/api/v1/materials", params={"q": payload["title"]}).json()["total"] == 2


@pytest.mark.parametrize("payload", [
    {"title": "仅标题"},
    {"title": "标题", "body": "正文"},
    {"title": "标题", "type": "故事"},
    {"title": "  ", "type": "故事", "body": "正文"},
    {"title": "标题", "type": "无效", "body": "正文"},
    {"title": "标题", "type": "故事", "body": "   "},
    {"title": "标题", "type": "故事", "body": "正文", "status": "可用"},
])
def test_quick_create_rejects_invalid_input(client: TestClient, payload: dict[str, str]) -> None:
    response = client.post("/api/v1/materials", json=payload)
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "VALIDATION_ERROR"


def test_not_found_and_invalid_page(client: TestClient) -> None:
    assert client.get(f"/api/v1/materials/{uuid4()}").status_code == 404
    assert client.get("/api/v1/materials?page=0").status_code == 422
    assert client.get("/api/v1/materials?page_size=101").status_code == 422


def test_database_allows_title_only_draft_but_not_incomplete_non_draft() -> None:
    import asyncio
    asyncio.run(_check_database_constraints())


async def _check_database_constraints() -> None:
    engine = create_async_engine(TEST_DATABASE_URL)
    try:
        async with engine.connect() as conn:
            trans = await conn.begin()
            try:
                material = Material(title="虚构现场速记", status="草稿")
                async with AsyncSession(bind=conn) as session:
                    session.add(material)
                    await session.flush()
                    assert (await conn.execute(text(
                        "select type, body from materials where id = :id"), {"id": material.id}
                    )).one() == (None, None)
                await trans.rollback()
            except Exception:
                await trans.rollback()
                raise
        async with engine.connect() as conn:
            trans = await conn.begin()
            try:
                with pytest.raises(IntegrityError):
                    await conn.execute(text(
                        "insert into materials (id, title, status) values (:id, '虚构素材', '可用')"
                    ), {"id": uuid4()})
            finally:
                await trans.rollback()
    finally:
        await engine.dispose()
