from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from tests.helpers import create_audience_type, create_customer, create_industry, unique_name


def test_create_read_and_update_customer(client: TestClient) -> None:
    industry = create_industry(client)
    name = unique_name("虚构客户")
    response = client.post("/api/v1/customers", json={
        "name": f"  {name}  ",
        "short_name": "虚构简称",
        "industry_id": industry["id"],
        "group_name": "虚构集团",
        "notes": "虚构备注",
    })
    assert response.status_code == 201, response.text
    created = response.json()
    assert created["name"] == name  # 输入先 trim
    assert created["short_name"] == "虚构简称"
    assert created["group_name"] == "虚构集团"
    assert created["notes"] == "虚构备注"
    assert created["industry"]["id"] == industry["id"]
    assert created["industry"]["name"] == industry["name"]

    fetched = client.get(f"/api/v1/customers/{created['id']}")
    assert fetched.status_code == 200
    assert fetched.json() == created

    updated = client.put(f"/api/v1/customers/{created['id']}", json={
        "name": name,
        "short_name": "虚构新简称",
        "industry_id": None,
        "group_name": None,
        "notes": "  ",
    })
    assert updated.status_code == 200, updated.text
    assert updated.json()["short_name"] == "虚构新简称"
    assert updated.json()["industry_id"] is None
    assert updated.json()["industry"] is None
    assert updated.json()["group_name"] is None
    assert updated.json()["notes"] is None  # 空白被规范化为 NULL

    assert client.get(f"/api/v1/customers/{created['id']}").json() == updated.json()


def test_customer_optional_fields_may_be_omitted(client: TestClient) -> None:
    customer = create_customer(client)
    opened = client.get(f"/api/v1/customers/{customer['id']}").json()
    assert opened["short_name"] is None
    assert opened["industry_id"] is None
    assert opened["industry"] is None
    assert opened["group_name"] is None
    assert opened["notes"] is None


def test_customer_list_search_and_pagination(client: TestClient) -> None:
    marker = uuid4().hex[:10]
    for index in range(2):
        create_customer(client, name=f"虚构客户 {marker} {index}")
    result = client.get("/api/v1/customers", params={"q": marker, "page_size": 1})
    assert result.status_code == 200
    assert result.json()["total"] == 2
    assert len(result.json()["items"]) == 1
    second = client.get("/api/v1/customers", params={"q": marker, "page": 2, "page_size": 1})
    assert len(second.json()["items"]) == 1
    assert client.get("/api/v1/customers?page=0").status_code == 422
    assert client.get("/api/v1/customers?page_size=101").status_code == 422


def test_duplicate_customer_name_returns_business_conflict(client: TestClient) -> None:
    name = unique_name("虚构重复客户")
    assert create_customer(client, name=name)["name"] == name

    duplicate = client.post("/api/v1/customers", json={"name": name})
    assert duplicate.status_code == 409, duplicate.text
    body = duplicate.json()["error"]
    assert body["code"] == "CONFLICT"
    assert name in body["message"]
    assert body["request_id"] == duplicate.headers["x-request-id"]

    # 前导/尾随空白 trim 后属于同一标准名称
    padded = client.post("/api/v1/customers", json={"name": f"  {name}  "})
    assert padded.status_code == 409


def test_customer_update_rejects_name_of_another_customer(client: TestClient) -> None:
    first = create_customer(client)
    second = create_customer(client)
    conflict = client.put(f"/api/v1/customers/{second['id']}", json={"name": first["name"]})
    assert conflict.status_code == 409, conflict.text
    assert conflict.json()["error"]["code"] == "CONFLICT"

    # 保持自身名称可以正常保存
    keep = client.put(f"/api/v1/customers/{second['id']}", json={"name": second["name"]})
    assert keep.status_code == 200, keep.text


@pytest.mark.parametrize("payload", [
    {},
    {"name": ""},
    {"name": "   "},
    {"name": "虚构客户", "unknown_field": "x"},
    {"name": "虚构客户", "industry_id": "not-a-uuid"},
])
def test_customer_rejects_invalid_input(client: TestClient, payload: dict[str, str]) -> None:
    response = client.post("/api/v1/customers", json=payload)
    assert response.status_code == 422, response.text
    assert response.json()["error"]["code"] == "VALIDATION_ERROR"


def test_customer_with_unknown_industry_is_rejected(client: TestClient) -> None:
    response = client.post("/api/v1/customers",
                           json={"name": unique_name("虚构客户"), "industry_id": str(uuid4())})
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "INDUSTRY_NOT_FOUND"


def test_unknown_customer_returns_not_found(client: TestClient) -> None:
    assert client.get(f"/api/v1/customers/{uuid4()}").status_code == 404
    assert client.put(f"/api/v1/customers/{uuid4()}", json={"name": "虚构"}).status_code == 404


def test_customer_name_and_short_name_search(client: TestClient) -> None:
    marker = uuid4().hex[:10]
    customer = create_customer(client, name=f"虚构客户 {marker}")

    def with_short_name(short_name: str) -> None:
        response = client.put(f"/api/v1/customers/{customer['id']}",
                              json={"name": customer["name"], "short_name": short_name})
        assert response.status_code == 200, response.text

    with_short_name(f"简称{marker}")
    by_short_name = client.get("/api/v1/customers", params={"q": f"简称{marker}"})
    assert by_short_name.json()["total"] == 1
    by_name = client.get("/api/v1/customers", params={"q": f"虚构客户 {marker}"})
    assert by_name.json()["total"] == 1
    by_partial = client.get("/api/v1/customers", params={"q": marker})
    assert by_partial.json()["total"] == 1


def test_vocabularies_are_maintainable_and_unique(client: TestClient) -> None:
    industry = create_industry(client)
    audience = create_audience_type(client)
    assert client.get("/api/v1/industries", params={"q": industry["name"]}).json()["total"] == 1
    assert client.get("/api/v1/audience-types",
                      params={"q": audience["name"]}).json()["total"] == 1
    assert client.post("/api/v1/industries",
                       json={"name": industry["name"]}).status_code == 409
    assert client.post("/api/v1/audience-types",
                       json={"name": audience["name"]}).status_code == 409
    assert client.post("/api/v1/industries", json={"name": "   "}).status_code == 422
    assert client.post("/api/v1/audience-types", json={"name": "x", "extra": 1}).status_code == 422


def test_customer_industry_survives_and_is_readable_after_reopen(client: TestClient) -> None:
    industry = create_industry(client, name=unique_name("虚构行业"))
    customer = create_customer(client, industry_id=industry["id"])
    reopened = client.get(f"/api/v1/customers/{customer['id']}").json()
    assert reopened["industry_id"] == industry["id"]
    assert reopened["industry"]["name"] == industry["name"]


def test_conflict_error_shape_keeps_request_id(client: TestClient) -> None:
    name = unique_name("虚构冲突客户")
    create_customer(client, name=name)
    response = client.post("/api/v1/customers", json={"name": name})
    assert response.json()["error"]["request_id"] == response.headers["x-request-id"]


def test_customer_detail_is_reachable_by_id(client: TestClient) -> None:
    customer = create_customer(client)
    response = client.get(f"/api/v1/customers/{customer['id']}")
    assert response.status_code == 200
    assert response.json()["id"] == customer["id"]
    assert response.json()["name"] == customer["name"]
