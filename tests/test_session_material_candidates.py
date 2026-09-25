from fastapi.testclient import TestClient

from tests.helpers import (
    create_audience_type,
    create_course,
    create_customer,
    create_material,
    unique_name,
)


def create_teaching_session(client: TestClient, customer_id: str, session_date: str,
                            audience_name: str | None = None) -> tuple[str, str, str]:
    course = create_course(client)
    audience = create_audience_type(client, audience_name)
    response = client.post("/api/v1/sessions", json={
        "customer_id": customer_id,
        "course_id": course["id"],
        "session_date": session_date,
        "audience_type_ids": [audience["id"]],
        "duration": "一天",
    })
    assert response.status_code == 201, response.text
    return response.json()["id"], course["name"], audience["name"]


def record_usage(client: TestClient, session_id: str, material_id: str, status: str) -> None:
    planned = client.post(f"/api/v1/sessions/{session_id}/usages",
                          json={"material_id": material_id})
    assert planned.status_code == 201, planned.text
    if status == "计划":
        return
    saved = client.put(f"/api/v1/sessions/{session_id}/post-class", json={"usages": [{
        "id": planned.json()["id"], "status": status, "effect": "未评",
    }]})
    assert saved.status_code == 200, saved.text


def candidate(client: TestClient, session_id: str, material_id: str) -> dict:
    response = client.get(f"/api/v1/sessions/{session_id}/material-candidates")
    assert response.status_code == 200, response.text
    return next(item for item in response.json() if item["id"] == material_id)


def test_repeat_warning_uses_family_and_same_customer_precedes_group(client: TestClient) -> None:
    group = unique_name("虚构集团")
    current_customer = client.post("/api/v1/customers", json={
        "name": unique_name("虚构客户"), "group_name": group,
    }).json()
    peer_customer = client.post("/api/v1/customers", json={
        "name": unique_name("虚构客户"), "group_name": group,
    }).json()
    root = create_material(client)
    variant = create_material(client)
    linked = client.put(f"/api/v1/materials/{variant['id']}", json={
        "title": variant["title"], "type": "故事", "body": "虚构素材正文。",
        "status": "草稿", "source_material_id": root["id"],
    })
    assert linked.status_code == 200, linked.text

    same_session, same_course, same_audience = create_teaching_session(
        client, current_customer["id"], "2026-04-10", "同客户人群")
    group_session, _group_course, _group_audience = create_teaching_session(
        client, peer_customer["id"], "2026-05-10", "集团人群")
    target_session, _target_course, _target_audience = create_teaching_session(
        client, current_customer["id"], "2026-06-10")
    record_usage(client, same_session, root["id"], "已用")
    record_usage(client, group_session, variant["id"], "已用")

    warning = candidate(client, target_session, variant["id"])["repeat_usage"]
    assert warning == {
        "level": "same_customer",
        "session_date": "2026-04-10",
        "course_name": same_course,
        "audience_types": [same_audience],
        "customer_name": current_customer["name"],
    }
    # 命中同客户提醒不影响加入计划。
    joined = client.post(f"/api/v1/sessions/{target_session}/usages",
                         json={"material_id": variant["id"]})
    assert joined.status_code == 201, joined.text


def test_repeat_warning_uses_latest_actual_group_usage_only(client: TestClient) -> None:
    group = unique_name("虚构集团")
    current_customer = client.post("/api/v1/customers", json={
        "name": unique_name("虚构客户"), "group_name": group,
    }).json()
    peer = client.post("/api/v1/customers", json={
        "name": unique_name("虚构客户"), "group_name": group,
    }).json()
    no_group = create_customer(client)
    material = create_material(client)
    earlier, _, _ = create_teaching_session(client, peer["id"], "2026-01-10")
    latest, latest_course, latest_audience = create_teaching_session(
        client, peer["id"], "2026-03-15", "最近使用人群")
    planned_only, _, _ = create_teaching_session(client, peer["id"], "2026-04-20")
    unused_session, _, _ = create_teaching_session(client, peer["id"], "2026-05-20")
    target, _, _ = create_teaching_session(client, current_customer["id"], "2026-06-20")
    no_group_target, _, _ = create_teaching_session(client, no_group["id"], "2026-06-21")
    record_usage(client, earlier, material["id"], "已用")
    record_usage(client, latest, material["id"], "已用")
    record_usage(client, planned_only, material["id"], "计划")
    record_usage(client, unused_session, material["id"], "未用")

    warning = candidate(client, target, material["id"])["repeat_usage"]
    assert warning == {
        "level": "same_group",
        "session_date": "2026-03-15",
        "course_name": latest_course,
        "audience_types": [latest_audience],
        "customer_name": peer["name"],
    }
    assert candidate(client, no_group_target, material["id"])["repeat_usage"] is None


def test_repeat_warning_is_absent_without_actual_history_and_search_still_works(
    client: TestClient,
) -> None:
    customer = create_customer(client)
    session_id, _, _ = create_teaching_session(client, customer["id"], "2026-07-01")
    material = create_material(client)
    response = client.get(f"/api/v1/sessions/{session_id}/material-candidates",
                          params={"q": material["title"]})
    assert response.status_code == 200, response.text
    assert len(response.json()) == 1
    assert response.json()[0]["repeat_usage"] is None
    missing = client.get(
        "/api/v1/sessions/00000000-0000-0000-0000-000000000001/material-candidates"
    )
    assert missing.status_code == 404
