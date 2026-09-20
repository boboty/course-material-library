"""Task 2 / Task 3 测试共用工厂：全部使用虚构、可重复执行的名称与内容。"""

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


def create_material(client: TestClient, title: str | None = None,
                    material_type: str = "故事") -> dict[str, str]:
    response = client.post("/api/v1/materials", json={
        "title": title or unique_name("虚构素材"),
        "type": material_type,
        "body": "虚构素材正文。",
    })
    assert response.status_code == 201, response.text
    return {"id": response.json()["id"], "title": response.json()["title"]}


def create_session_for(client: TestClient) -> dict[str, str]:
    """创建一个自足场次（客户、课程、人群类型均为虚构新建），返回场次 id。"""
    response = client.post("/api/v1/sessions", json={
        "customer_id": create_customer(client)["id"],
        "course_id": create_course(client)["id"],
        "session_date": "2026-06-01",
        "audience_type_ids": [create_audience_type(client)["id"]],
        "duration": "一天",
    })
    assert response.status_code == 201, response.text
    return {"id": response.json()["id"]}
