from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from tests.helpers import create_course, unique_name


def test_create_course_defaults_to_enabled(client: TestClient) -> None:
    name = unique_name("虚构课程")
    response = client.post("/api/v1/courses", json={"name": f"  {name}  ", "alias": "虚构别名"})
    assert response.status_code == 201, response.text
    created = response.json()
    assert created["name"] == name
    assert created["alias"] == "虚构别名"
    assert created["status"] == "启用"  # 新建课程默认启用


def test_course_can_be_updated_to_disabled_without_losing_history(client: TestClient) -> None:
    course = create_course(client)
    updated = client.put(f"/api/v1/courses/{course['id']}", json={
        "name": course["name"], "alias": None, "status": "停用",
    })
    assert updated.status_code == 200, updated.text
    assert updated.json()["status"] == "停用"
    assert updated.json()["alias"] is None

    reopened = client.get(f"/api/v1/courses/{course['id']}")
    assert reopened.status_code == 200
    assert reopened.json()["status"] == "停用"

    # 停用只影响默认可选范围，实体与历史读取不受影响
    enabled = client.get("/api/v1/courses", params={"q": course["name"], "status": "启用"})
    assert enabled.json()["total"] == 0
    disabled = client.get("/api/v1/courses", params={"q": course["name"], "status": "停用"})
    assert disabled.json()["total"] == 1
    everything = client.get("/api/v1/courses", params={"q": course["name"]})
    assert everything.json()["total"] == 1


def test_course_list_search_pagination_and_not_found(client: TestClient) -> None:
    marker = uuid4().hex[:10]
    for index in range(2):
        create_course(client, name=f"虚构课程 {marker} {index}")
    result = client.get("/api/v1/courses", params={"q": marker, "page_size": 1})
    assert result.json()["total"] == 2
    assert len(result.json()["items"]) == 1

    aliased = create_course(client)
    alias = f"别名{marker}"
    client.put(f"/api/v1/courses/{aliased['id']}",
               json={"name": aliased["name"], "alias": alias, "status": "启用"})
    assert client.get("/api/v1/courses", params={"q": alias}).json()["total"] == 1

    assert client.get(f"/api/v1/courses/{uuid4()}").status_code == 404
    assert client.put(f"/api/v1/courses/{uuid4()}",
                      json={"name": "虚构", "status": "启用"}).status_code == 404


@pytest.mark.parametrize("payload", [
    {},
    {"name": ""},
    {"name": "   "},
    {"name": "虚构课程", "status": "草稿"},
    {"name": "虚构课程", "status": "启用", "extra": True},
])
def test_course_rejects_invalid_input(client: TestClient, payload: dict[str, object]) -> None:
    response = client.post("/api/v1/courses", json=payload)
    assert response.status_code == 422, response.text
    assert response.json()["error"]["code"] == "VALIDATION_ERROR"


def test_course_list_rejects_unknown_status_filter(client: TestClient) -> None:
    response = client.get("/api/v1/courses", params={"status": "草稿"})
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "VALIDATION_ERROR"


def test_course_names_may_repeat(client: TestClient) -> None:
    """产品定义未要求课程名称唯一；重复课程名允许保存。"""
    name = unique_name("虚构同名课程")
    first = client.post("/api/v1/courses", json={"name": name})
    second = client.post("/api/v1/courses", json={"name": name})
    assert first.status_code == 201
    assert second.status_code == 201
    assert client.get("/api/v1/courses", params={"q": name}).json()["total"] == 2
