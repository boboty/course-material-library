"""Task 2 测试共用工厂：全部使用虚构、可重复执行的名称。"""

from uuid import uuid4

from fastapi.testclient import TestClient


def unique_name(prefix: str) -> str:
    return f"{prefix} {uuid4().hex[:12]}"


def create_industry(client: TestClient, name: str | None = None) -> dict[str, str]:
    response = client.post("/api/v1/industries", json={"name": name or unique_name("虚构行业")})
    assert response.status_code == 201, response.text
    return {"id": response.json()["id"], "name": response.json()["name"]}


def create_audience_type(client: TestClient, name: str | None = None) -> dict[str, str]:
    response = client.post("/api/v1/audience-types",
                           json={"name": name or unique_name("虚构人群")})
    assert response.status_code == 201, response.text
    return {"id": response.json()["id"], "name": response.json()["name"]}


def create_customer(client: TestClient, name: str | None = None,
                    industry_id: str | None = None) -> dict[str, str]:
    payload: dict[str, str] = {"name": name or unique_name("虚构客户")}
    if industry_id is not None:
        payload["industry_id"] = industry_id
    response = client.post("/api/v1/customers", json=payload)
    assert response.status_code == 201, response.text
    return {"id": response.json()["id"], "name": response.json()["name"]}


def create_course(client: TestClient, name: str | None = None) -> dict[str, str]:
    response = client.post("/api/v1/courses", json={"name": name or unique_name("虚构课程")})
    assert response.status_code == 201, response.text
    return {"id": response.json()["id"], "name": response.json()["name"]}
