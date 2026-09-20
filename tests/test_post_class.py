from uuid import uuid4

from fastapi.testclient import TestClient

from tests.helpers import create_material, create_session_for, unique_name


def test_post_class_save_is_atomic_and_revisable(client: TestClient) -> None:
    teaching = create_session_for(client)
    a = create_material(client, title=unique_name("虚构 A"))
    b = create_material(client, title=unique_name("虚构 B"))
    c = create_material(client, title=unique_name("虚构 C"))
    path = f"/api/v1/sessions/{teaching['id']}"
    planned = [client.post(f"{path}/usages", json={"material_id": material["id"]}).json()
               for material in (a, b)]
    assert [row["status"] for row in client.get(f"{path}/usages").json()] == ["计划", "计划"]

    payload = {"usages": [
        {"id": planned[0]["id"], "status": "已用", "effect": "好", "reaction": "虚构现场反应"},
        {"id": planned[1]["id"], "status": "未用", "effect": "未评", "reaction": None},
    ], "existing_materials": [{"material_id": c["id"], "effect": "好",
                             "reaction": "  虚构临时已有素材反应  "}],
        "new_materials": [{"title": unique_name("虚构 D"), "effect": "差",
                           "reaction": "  虚构新素材反应  "}]}
    bad = {**payload, "usages": [payload["usages"][0], {"id": str(uuid4()),
           "status": "已用", "effect": "未评"}]}
    assert client.put(f"{path}/post-class", json=bad).status_code == 422
    assert [row["status"] for row in client.get(f"{path}/usages").json()] == ["计划", "计划"]

    response = client.put(f"{path}/post-class", json=payload)
    assert response.status_code == 200, response.text
    saved = response.json()
    assert len(saved) == 4
    by_material = {row["material_id"]: row for row in saved}
    assert (by_material[a["id"]]["status"], by_material[a["id"]]["effect"],
            by_material[a["id"]]["reaction"]) == ("已用", "好", "虚构现场反应")
    assert (by_material[b["id"]]["status"], by_material[b["id"]]["effect"],
            by_material[b["id"]]["reaction"]) == ("未用", "未评", None)
    assert (by_material[c["id"]]["status"], by_material[c["id"]]["effect"],
            by_material[c["id"]]["reaction"]) == ("已用", "好", "虚构临时已有素材反应")
    draft = next(row for row in saved if row["material_id"] not in {a["id"], b["id"], c["id"]})
    assert draft["material"]["type"] is None
    assert draft["material"]["body"] is None
    assert draft["material"]["status"] == "草稿"
    assert (draft["status"], draft["effect"], draft["reaction"]) == (
        "已用", "差", "虚构新素材反应")

    assert client.put(f"{path}/post-class", json={
        "usages": [{"id": row["id"], "status": row["status"],
                    "effect": row["effect"], "reaction": row["reaction"]} for row in saved],
        "existing_materials": [{"material_id": c["id"]}],
    }).status_code == 409
    correction = {"usages": [{"id": row["id"], "status": ("未用" if row["id"] == saved[0]["id"]
                                         else row["status"]),
                              "effect": "未评", "reaction": None} for row in saved]}
    assert client.put(f"{path}/post-class", json=correction).status_code == 200
    assert next(row for row in client.get(f"{path}/usages").json()
                if row["material_id"] == a["id"])["reaction"] is None


def test_post_class_rejects_invalid_without_writes(client: TestClient) -> None:
    teaching = create_session_for(client)
    material = create_material(client)
    path = f"/api/v1/sessions/{teaching['id']}"
    usage = client.post(f"{path}/usages", json={"material_id": material["id"]}).json()
    base = {"usages": [{"id": usage["id"], "status": "已用", "effect": "未评"}]}
    assert client.put(f"{path}/post-class", json={**base,
        "new_materials": [{"title": "   "}]}).status_code == 422
    assert client.put(f"{path}/post-class", json={"usages": [{
        "id": usage["id"], "status": "未用", "effect": "好",
        "reaction": "不合法"}]}).status_code == 422
    assert client.put(f"{path}/post-class", json={**base,
        "existing_materials": [{"material_id": str(uuid4())}]}).status_code == 404
    assert client.get(f"{path}/usages").json()[0]["status"] == "计划"
    normalized = client.put(f"{path}/post-class", json={"usages": [{
        "id": usage["id"], "status": "已用", "effect": "未评", "reaction": "   "
    }], "existing_materials": [{"material_id": create_material(client)["id"],
                              "reaction": "   "}],
        "new_materials": [{"title": unique_name("虚构空反应"), "reaction": "   "}]})
    assert normalized.status_code == 200, normalized.text
    assert all(row["reaction"] is None for row in normalized.json())
    unused = client.put(f"{path}/post-class", json={"usages": [
        {"id": row["id"], "status": "未用", "effect": "未评", "reaction": "   "}
        for row in normalized.json()
    ]})
    assert unused.status_code == 200, unused.text
    assert all((row["status"], row["effect"], row["reaction"]) ==
               ("未用", "未评", None) for row in unused.json())


def test_default_save_and_foreign_usage_rejection(client: TestClient) -> None:
    first = create_session_for(client)
    second = create_session_for(client)
    a = create_material(client)
    b = create_material(client)
    first_path = f"/api/v1/sessions/{first['id']}"
    first_usages = [client.post(f"{first_path}/usages",
                                json={"material_id": material["id"]}).json()
                    for material in (a, b)]
    foreign = client.post(f"/api/v1/sessions/{second['id']}/usages",
                          json={"material_id": a["id"]}).json()
    rejected = client.put(f"{first_path}/post-class", json={"usages": [
        {"id": first_usages[0]["id"], "status": "已用"},
        {"id": foreign["id"], "status": "已用"},
    ]})
    assert rejected.status_code == 422
    assert all(row["status"] == "计划" for row in client.get(f"{first_path}/usages").json())

    saved = client.put(f"{first_path}/post-class", json={"usages": [
        {"id": row["id"], "status": "已用"} for row in first_usages
    ]})
    assert saved.status_code == 200, saved.text
    assert all((row["status"], row["effect"], row["reaction"]) ==
               ("已用", "未评", None) for row in saved.json())
