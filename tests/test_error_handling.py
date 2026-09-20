from fastapi import Depends
from fastapi.testclient import TestClient

from app.core.exceptions import ApplicationError
from app.main import app


def test_not_found() -> None:
    with TestClient(app) as client:
        response = client.get("/api/v1/not-found")
    assert response.status_code == 404
    assert response.json() == {"error": {"code": "NOT_FOUND", "message": "Resource not found",
                                           "request_id": response.headers["x-request-id"]}}


def test_validation_error() -> None:
    def required_integer(value: int) -> int:
        return value

    @app.get("/_test_validation")
    def endpoint(value: int = Depends(required_integer)) -> dict[str, int]:
        return {"value": value}

    with TestClient(app) as client:
        response = client.get("/_test_validation?value=bad")
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "VALIDATION_ERROR"
    assert response.json()["error"]["request_id"] == response.headers["x-request-id"]


def test_application_error() -> None:
    @app.get("/_test_application_error")
    def endpoint() -> None:
        raise ApplicationError("TASK_NOT_FOUND", "Task not found", 404)

    with TestClient(app) as client:
        response = client.get("/_test_application_error")
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "TASK_NOT_FOUND"
    assert response.json()["error"]["request_id"] == response.headers["x-request-id"]


def test_unexpected_error_hides_details() -> None:
    @app.get("/_test_unexpected_error")
    def endpoint() -> None:
        raise RuntimeError("secret internal detail")

    with TestClient(app, raise_server_exceptions=False) as client:
        response = client.get("/_test_unexpected_error")
    assert response.status_code == 500
    assert response.json() == {"error": {
        "code": "INTERNAL_ERROR",
        "message": "Internal server error",
        "request_id": response.headers["x-request-id"],
    }}
    assert "secret internal detail" not in response.text
