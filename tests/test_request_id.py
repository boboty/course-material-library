from fastapi.testclient import TestClient

from app.main import app


def test_inherits_valid_request_id() -> None:
    with TestClient(app) as client:
        response = client.get("/api/v1/health", headers={"X-Request-ID": "req_custom-1"})
    assert response.headers["x-request-id"] == "req_custom-1"


def test_replaces_invalid_request_id() -> None:
    with TestClient(app) as client:
        response = client.get("/api/v1/health", headers={"X-Request-ID": "invalid id"})
    assert response.headers["x-request-id"].startswith("req_")


def test_replaces_boundary_request_ids() -> None:
    for invalid_id in ("", "a" * 129, "bad!id"):
        with TestClient(app) as client:
            response = client.get("/api/v1/health", headers={"X-Request-ID": invalid_id})
        assert response.headers["x-request-id"].startswith("req_")
        assert response.headers["x-request-id"] != invalid_id
