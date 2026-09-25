import asyncio
import logging
import os
from collections.abc import AsyncIterator, Iterator
from uuid import UUID, uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from app.db.session import get_session
from app.main import app
from app.models.material import MATERIAL_STATUSES, Material
from tests.helpers import create_course

TEST_DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL", "postgresql+asyncpg://benyan:benyan_local@localhost:5432/benyan_test"
)
assert TEST_DATABASE_URL.endswith("/benyan_test")


def test_material_course_associations_replace_atomically(client: TestClient) -> None:
    first = create_course(client)
    second = create_course(client)
    created = client.post("/api/v1/materials", json={
        "title": f"虚构课程关联 {uuid4().hex}", "type": "故事", "body": "虚构正文",
    })
    assert created.status_code == 201
    material_id = created.json()["id"]
    assert created.json()["courses"] == []
    url = f"/api/v1/materials/{material_id}"
    base = {"title": created.json()["title"], "type": "故事",
            "body": "虚构正文", "status": "草稿"}

    one = client.put(url, json={**base, "course_ids": [first["id"]]})
    assert one.status_code == 200
    assert [course["id"] for course in one.json()["courses"]] == [first["id"]]
    two = client.put(url, json={**base, "course_ids": [first["id"], second["id"]]})
    assert two.status_code == 200
    assert {course["id"] for course in two.json()["courses"]} == {first["id"], second["id"]}

    unchanged = client.put(url, json={**base, "title": f"已编辑 {uuid4().hex}"})
    assert unchanged.status_code == 200
    assert {course["id"] for course in unchanged.json()["courses"]} == {
        first["id"], second["id"]}
    for invalid in ([first["id"], str(uuid4())], [first["id"], first["id"]], ["bad-id"]):
        rejected = client.put(url, json={**base, "course_ids": invalid})
        assert rejected.status_code == 422
        assert len(client.get(url).json()["courses"]) == 2

    stopped = client.put(f"/api/v1/courses/{first['id']}", json={
        "name": first["name"], "status": "停用",
    })
    assert stopped.status_code == 200
    assert any(course["status"] == "停用" for course in client.get(url).json()["courses"])
    cleared = client.put(url, json={**base, "course_ids": []})
    assert cleared.status_code == 200
    assert cleared.json()["courses"] == []


def test_course_filter_combines_with_existing_filters_and_pagination(client: TestClient) -> None:
    marker = uuid4().hex
    first = create_course(client)
    second = create_course(client)
    inactive = client.put(f"/api/v1/courses/{second['id']}", json={
        "name": second["name"], "status": "停用",
    }).json()
    ids: list[str] = []
    for index in range(3):
        created = client.post("/api/v1/materials", json={
            "title": f"虚构课程筛选 {marker} {index}",
            "type": "Demo" if index < 2 else "故事",
            "body": f"虚构课程正文 {marker}",
        }).json()
        ids.append(created["id"])
        course_ids = [first["id"]]
        if index == 0:
            course_ids.append(inactive["id"])
        assert client.put(f"/api/v1/materials/{created['id']}", json={
            "title": created["title"], "type": created["type"],
            "body": created["body"], "status": "可用" if index < 2 else "草稿",
            "course_ids": course_ids,
        }).status_code == 200

    default = client.get("/api/v1/materials", params={"q": marker})
    assert default.status_code == 200
    assert default.json()["total"] == 3
    assert {item["id"] for item in default.json()["items"]} == set(ids)

    page_params = {"q": marker, "course_id": first["id"], "page_size": 1}
    first_page = client.get("/api/v1/materials", params=page_params).json()
    second_page = client.get("/api/v1/materials", params={**page_params, "page": 2}).json()
    assert first_page["total"] == second_page["total"] == 3
    assert len(first_page["items"]) == len(second_page["items"]) == 1
    assert first_page["items"][0]["id"] != second_page["items"][0]["id"]
    assert {first_page["items"][0]["id"], second_page["items"][0]["id"]} <= set(ids)

    stopped_course = client.get("/api/v1/materials", params={
        "q": marker, "course_id": inactive["id"],
    }).json()
    assert stopped_course["total"] == 1
    assert stopped_course["items"][0]["id"] == ids[0]
    for filters, expected_ids in (
        ({"q": marker, "course_id": first["id"], "type": "Demo"}, {ids[0], ids[1]}),
        ({"q": marker, "course_id": first["id"], "status": "草稿"}, {ids[2]}),
        ({"q": marker, "course_id": first["id"], "type": "Demo", "status": "可用"},
         {ids[0], ids[1]}),
    ):
        filtered = client.get("/api/v1/materials", params=filters).json()
        assert filtered["total"] == len(expected_ids)
        assert {item["id"] for item in filtered["items"]} == expected_ids


def test_course_filter_rejects_invalid_and_missing_ids(client: TestClient) -> None:
    for course_id, status_code, error_code in (
        ("invalid", 422, "VALIDATION_ERROR"),
        (str(uuid4()), 404, "NOT_FOUND"),
    ):
        response = client.get("/api/v1/materials", params={"course_id": course_id})
        assert response.status_code == status_code
        assert response.json()["error"]["code"] == error_code


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


def test_status_filter_combines_with_search_and_pagination(client: TestClient) -> None:
    marker = uuid4().hex
    ids: dict[str, str] = {}
    for status in MATERIAL_STATUSES:
        response = client.post("/api/v1/materials", json={
            "title": f"虚构筛选 {marker} {status}", "type": "故事", "body": "虚构正文",
        })
        assert response.status_code == 201
        ids[status] = response.json()["id"]

    async def set_statuses() -> None:
        engine = create_async_engine(TEST_DATABASE_URL)
        try:
            async with engine.begin() as conn:
                for status, material_id in ids.items():
                    statement = (update(Material)
                                 .where(Material.id == UUID(material_id))
                                 .values(status=status))
                    await conn.execute(statement)
        finally:
            await engine.dispose()

    asyncio.run(set_statuses())
    base = client.get("/api/v1/materials", params={"q": marker})
    assert base.status_code == 200
    assert base.json()["total"] == len(MATERIAL_STATUSES)
    for status in MATERIAL_STATUSES:
        result = client.get("/api/v1/materials", params={"q": marker, "status": status})
        assert result.status_code == 200
        assert result.json()["total"] == 1
        assert result.json()["items"][0]["id"] == ids[status]

    combined = client.get("/api/v1/materials", params={"q": f"{marker} 草稿", "status": "可用"})
    assert combined.json()["total"] == 0
    second_page = client.get("/api/v1/materials", params={"q": marker, "status": "草稿", "page": 2})
    assert second_page.json()["total"] == 1
    assert second_page.json()["items"] == []
    assert client.get("/api/v1/materials", params={"q": marker}).json()["total"] == 5


def test_invalid_status_filter_is_rejected(client: TestClient) -> None:
    for status in ("未知", "", "草稿,可用"):
        response = client.get("/api/v1/materials", params={"status": status})
        assert response.status_code == 422
        assert response.json()["error"]["code"] == "VALIDATION_ERROR"


def test_type_filter_and_title_or_body_search_combine_with_status_and_pagination(
    client: TestClient,
) -> None:
    marker = uuid4().hex
    ids: dict[str, str] = {}
    for material_type in ("故事", "案例", "Demo", "金句", "段子", "行业素材"):
        response = client.post("/api/v1/materials", json={
            "title": f"虚构类型 {marker} {material_type}", "type": material_type,
            "body": f"正文关键词 {marker} {material_type}",
        })
        assert response.status_code == 201
        ids[material_type] = response.json()["id"]

    # 正文为空时可正常列表，并且正文关键词只命中标题。
    empty_body = client.put(f"/api/v1/materials/{ids['故事']}", json={
        "title": f"标题关键词 {marker}", "type": "故事", "body": None, "status": "草稿",
    })
    assert empty_body.status_code == 200
    assert client.get("/api/v1/materials", params={"type": "故事"}).status_code == 200

    title_hits = client.get("/api/v1/materials", params={"q": "标题关键词", "type": "故事"})
    assert title_hits.status_code == 200
    assert title_hits.json()["total"] == 1
    assert title_hits.json()["items"][0]["body"] is None

    body_hits = client.get("/api/v1/materials", params={
        "q": f"正文关键词 {marker}", "type": "案例",
    })
    assert body_hits.status_code == 200
    assert body_hits.json()["total"] == 1
    assert body_hits.json()["items"][0]["type"] == "案例"

    # 标题或正文命中同一条素材时 total 仍按记录计数，不重复。
    either = client.get("/api/v1/materials", params={"q": marker})
    assert either.status_code == 200
    assert either.json()["total"] == 6

    for material_type, material_id in ids.items():
        result = client.get("/api/v1/materials", params={"type": material_type, "q": marker})
        assert result.status_code == 200
        assert result.json()["total"] == 1
        assert result.json()["items"][0]["id"] == material_id

    # 搜索、类型、状态三项同时影响 total 与分页。
    filtered_ids = []
    for number in range(3):
        response = client.post("/api/v1/materials", json={
            "title": f"组合筛选 {marker} {number}", "type": "Demo",
            "body": f"组合正文 {marker} {number}",
        })
        assert response.status_code == 201
        material_id = response.json()["id"]
        filtered_ids.append(material_id)
        updated = client.put(f"/api/v1/materials/{material_id}", json={
            "title": f"组合筛选 {marker} {number}", "type": "Demo",
            "body": f"组合正文 {marker} {number}", "status": "可用",
        })
        assert updated.status_code == 200

    params = {"q": f"组合正文 {marker}", "type": "Demo", "status": "可用", "page_size": 1}
    first = client.get("/api/v1/materials", params=params)
    second = client.get("/api/v1/materials", params={**params, "page": 2})
    outside = client.get("/api/v1/materials", params={**params, "type": "故事"})
    assert first.json()["total"] == second.json()["total"] == 3
    assert len(first.json()["items"]) == len(second.json()["items"]) == 1
    assert first.json()["items"][0]["id"] != second.json()["items"][0]["id"]
    assert outside.json()["total"] == 0
    assert all(material_id in filtered_ids for material_id in
               [first.json()["items"][0]["id"], second.json()["items"][0]["id"]])


def test_invalid_type_filter_is_rejected(client: TestClient) -> None:
    for material_type in ("未知", "", "故事,案例"):
        response = client.get("/api/v1/materials", params={"type": material_type})
        assert response.status_code == 422
        assert response.json()["error"]["code"] == "VALIDATION_ERROR"


def test_supplemental_fields_can_be_saved_updated_and_cleared(
    client: TestClient, caplog: pytest.LogCaptureFixture, monkeypatch: pytest.MonkeyPatch,
) -> None:
    marker = uuid4().hex
    monkeypatch.setattr(logging.getLogger("app"), "propagate", True)
    caplog.set_level(logging.INFO, logger="app")
    created = client.post("/api/v1/materials", json={
        "title": f"虚构补充字段 {marker}", "type": "故事", "body": "虚构正文",
    })
    assert created.status_code == 201
    material_id = created.json()["id"]
    assert created.json()["supporting_judgment"] is None
    assert created.json()["speaking_notes"] is None
    assert created.json()["source_note"] is None

    fields = {
        "supporting_judgment": " 支撑虚构判断。 ",
        "speaking_notes": " 先提问，再总结。 ",
        "source_note": f"虚构内部来源 {marker}",
    }
    base = {"title": f"虚构补充字段 {marker}", "type": "故事",
            "body": "虚构正文", "status": "草稿"}
    saved = client.put(f"/api/v1/materials/{material_id}", json={**base, **fields})
    assert saved.status_code == 200
    assert {name: saved.json()[name] for name in fields} == {
        "supporting_judgment": "支撑虚构判断。",
        "speaking_notes": "先提问，再总结。",
        "source_note": f"虚构内部来源 {marker}",
    }

    current = {name: saved.json()[name] for name in fields}
    for name, value in (("supporting_judgment", "更新后的判断。"),
                        ("speaking_notes", "更新后的讲法。"),
                        ("source_note", "更新后的内部来源。")):
        current[name] = value
        updated = client.put(f"/api/v1/materials/{material_id}", json={**base, name: value})
        assert updated.status_code == 200
        assert updated.json()[name] == value
        assert {field: updated.json()[field] for field in fields} == current

    for name in fields:
        current[name] = "   "
        cleared = client.put(f"/api/v1/materials/{material_id}", json={**base, **current})
        assert cleared.status_code == 200
        assert cleared.json()[name] is None

    detail = client.get(f"/api/v1/materials/{material_id}")
    assert detail.status_code == 200
    assert all(detail.json()[name] is None for name in fields)
    listed = client.get("/api/v1/materials", params={"q": marker})
    assert listed.status_code == 200
    assert listed.json()["items"][0]["source_note"] is None
    assert f"虚构内部来源 {marker}" not in caplog.text


def test_markdown_import_creates_trimmed_drafts_atomically_and_allows_duplicate_titles(
    client: TestClient,
) -> None:
    title = f"虚构导入标题 {uuid4().hex}"
    markdown = (
        f"\n##  {title}  \n\n  中文正文第一行  \n第二行。  "
        "\n\n## English title\n\nEnglish body.\n"
    )
    response = client.post("/api/v1/materials/import", json={"markdown": markdown})
    assert response.status_code == 201
    assert response.json() == {"count": 2}

    listed = client.get("/api/v1/materials", params={"q": title})
    assert listed.status_code == 200
    imported = listed.json()["items"]
    assert len(imported) == 1
    assert imported[0]["title"] == title
    assert imported[0]["body"] == "中文正文第一行  \n第二行。"
    assert imported[0]["type"] is None
    assert imported[0]["status"] == "草稿"

    duplicate = client.post("/api/v1/materials/import", json={
        "markdown": f"## {title}\n\n另一条虚构正文",
    })
    assert duplicate.status_code == 201
    assert duplicate.json() == {"count": 1}
    exact = client.get("/api/v1/materials", params={"title": title})
    assert exact.json()["total"] == 2


def test_invalid_markdown_import_returns_explicit_error_without_partial_writes(
    client: TestClient,
) -> None:
    marker = uuid4().hex
    malformed = [
        ("", "请粘贴 Markdown 内容"),
        (f"## 虚构标题 {marker}\n\n正文\n##   \n\n另一段正文", "缺少素材标题"),
        (f"## 虚构标题 {marker}\n\n## 第二标题\n\n正文", "正文不能为空"),
        (f"## 虚构标题 {marker}\n\n正文\n### 非法标题\n\n更多内容", "格式错误"),
        (f"前置文字 {marker}\n\n## 标题\n\n正文", "第一个"),
        (f"## 虚构标题 {marker}\n\n   ", "正文不能为空"),
    ]
    for markdown, message in malformed:
        response = client.post("/api/v1/materials/import", json={"markdown": markdown})
        assert response.status_code == 422
        assert response.json()["error"]["code"] == "MARKDOWN_IMPORT_INVALID"
        assert message in response.json()["error"]["message"]
        assert client.get("/api/v1/materials", params={"q": marker}).json()["total"] == 0


def test_markdown_import_database_failure_rolls_back_all_items(client: TestClient) -> None:
    import asyncio

    suffix = uuid4().hex
    function_name = f"test_import_failure_{suffix}"
    trigger_name = f"test_import_failure_trigger_{suffix}"
    failing_title = f"FORCE_IMPORT_FAILURE_{suffix}"

    async def install_failure_trigger() -> None:
        engine = create_async_engine(TEST_DATABASE_URL, poolclass=NullPool)
        try:
            async with engine.begin() as conn:
                await conn.execute(text(
                    f"CREATE FUNCTION {function_name}() RETURNS trigger LANGUAGE plpgsql "
                    f"AS $$ BEGIN IF NEW.title = '{failing_title}' THEN "
                    "RAISE EXCEPTION 'forced import failure'; END IF; RETURN NEW; END $$"
                ))
                await conn.execute(text(
                    f"CREATE TRIGGER {trigger_name} BEFORE INSERT ON materials "
                    f"FOR EACH ROW EXECUTE FUNCTION {function_name}()"
                ))
        finally:
            await engine.dispose()

    async def remove_failure_trigger() -> None:
        engine = create_async_engine(TEST_DATABASE_URL, poolclass=NullPool)
        try:
            async with engine.begin() as conn:
                await conn.execute(text(f"DROP TRIGGER IF EXISTS {trigger_name} ON materials"))
                await conn.execute(text(f"DROP FUNCTION IF EXISTS {function_name}()"))
        finally:
            await engine.dispose()

    asyncio.run(install_failure_trigger())
    try:
        markdown = (
            f"## 先写入的虚构标题 {suffix}\n\n第一段正文\n\n"
            f"## {failing_title}\n\n触发失败的虚构正文"
        )
        response = client.post("/api/v1/materials/import", json={"markdown": markdown})
        assert response.status_code == 500
        assert response.json()["error"]["code"] == "MATERIAL_IMPORT_FAILED"
        assert client.get("/api/v1/materials", params={"q": suffix}).json()["total"] == 0
    finally:
        asyncio.run(remove_failure_trigger())


def test_exact_title_finds_match_beyond_fuzzy_first_page(client: TestClient) -> None:
    title = f"虚构同标题 {uuid4().hex}"
    payload = {"title": title, "type": "故事", "body": "虚构正文"}
    first = client.post("/api/v1/materials", json=payload)
    assert first.status_code == 201
    for number in range(21):
        response = client.post("/api/v1/materials", json={
            **payload, "title": f"{title} 扩展 {number}",
        })
        assert response.status_code == 201

    fuzzy = client.get("/api/v1/materials", params={"q": title})
    assert fuzzy.json()["total"] == 22
    assert all(item["id"] != first.json()["id"] for item in fuzzy.json()["items"])

    exact = client.get("/api/v1/materials", params={"title": title, "page_size": 1})
    assert exact.status_code == 200
    assert exact.json()["total"] == 1
    assert exact.json()["items"][0]["id"] == first.json()["id"]


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


def test_exact_title_query_does_not_normalize_or_fuzzy_match(client: TestClient) -> None:
    title = f"虚构精确标题 Case {uuid4().hex}"
    created = client.post("/api/v1/materials",
                          json={"title": title, "type": "故事", "body": "虚构正文"})
    assert created.status_code == 201
    assert client.get("/api/v1/materials", params={"title": title}).json()["total"] == 1
    for variant in (title.lower(), f"{title} ", f" {title}", title[:-1], f"{title}x"):
        result = client.get("/api/v1/materials", params={"title": variant})
        assert result.status_code == 200
        assert result.json()["total"] == 0


def _create(client: TestClient, title: str) -> str:
    response = client.post("/api/v1/materials",
                           json={"title": title, "type": "故事", "body": "虚构正文"})
    assert response.status_code == 201
    return response.json()["id"]


def test_update_basic_fields_and_status(client: TestClient) -> None:
    material_id = _create(client, f"虚构编辑 {uuid4().hex}")
    new_title = f"  虚构新标题 {uuid4().hex}  "
    response = client.put(f"/api/v1/materials/{material_id}", json={
        "title": new_title, "type": "案例", "body": " 新正文 ", "status": "主力",
    })
    assert response.status_code == 200
    body = response.json()
    assert (body["title"], body["type"], body["body"], body["status"]) == (
        new_title.strip(), "案例", "新正文", "主力")
    detail = client.get(f"/api/v1/materials/{material_id}").json()
    assert detail["title"] == new_title.strip() and detail["status"] == "主力"
    for status in MATERIAL_STATUSES:
        assert client.put(f"/api/v1/materials/{material_id}", json={
            "title": "虚构", "type": "Demo", "body": "正文", "status": status,
        }).json()["status"] == status


def test_update_draft_allows_incomplete_content(client: TestClient) -> None:
    material_id = _create(client, f"虚构草稿 {uuid4().hex}")
    response = client.put(f"/api/v1/materials/{material_id}", json={
        "title": "虚构草稿", "type": None, "body": "   ", "status": "草稿",
    })
    assert response.status_code == 200
    assert response.json()["type"] is None and response.json()["body"] is None


@pytest.mark.parametrize("patch", [
    {"type": None}, {"body": None}, {"body": "  "}, {"type": None, "body": None},
])
def test_update_non_draft_requires_type_and_body(client: TestClient,
                                                 patch: dict[str, object]) -> None:
    material_id = _create(client, f"虚构不完整 {uuid4().hex}")
    before = client.get(f"/api/v1/materials/{material_id}").json()
    payload = {"title": "虚构", "type": "故事", "body": "正文", "status": "可用", **patch}
    response = client.put(f"/api/v1/materials/{material_id}", json=payload)
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "MATERIAL_INCOMPLETE"
    assert client.get(f"/api/v1/materials/{material_id}").json() == before


@pytest.mark.parametrize("patch", [
    {"title": ""}, {"title": "   "}, {"title": "x" * 256}, {"type": "小说"}, {"status": "归档"},
    {"status": None}, {"status": ""}, {"unexpected_field": "多余字段"},
])
def test_update_rejects_invalid_payload(client: TestClient, patch: dict[str, object]) -> None:
    material_id = _create(client, f"虚构非法 {uuid4().hex}")
    before = client.get(f"/api/v1/materials/{material_id}").json()
    payload = {"title": "虚构", "type": "故事", "body": "正文", "status": "可用", **patch}
    assert client.put(f"/api/v1/materials/{material_id}", json=payload).status_code == 422
    assert client.get(f"/api/v1/materials/{material_id}").json() == before


def test_update_to_existing_title_is_allowed(client: TestClient) -> None:
    title = f"虚构同标题 {uuid4().hex}"
    _create(client, title)
    other = _create(client, f"虚构另一条 {uuid4().hex}")
    response = client.put(f"/api/v1/materials/{other}", json={
        "title": title, "type": "故事", "body": "正文", "status": "可用",
    })
    assert response.status_code == 200
    assert client.get("/api/v1/materials", params={"title": title}).json()["total"] == 2


def test_update_missing_material_returns_404(client: TestClient) -> None:
    response = client.put(f"/api/v1/materials/{uuid4()}", json={
        "title": "虚构", "type": "故事", "body": "正文", "status": "可用",
    })
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "NOT_FOUND"
