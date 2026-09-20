import json
import logging

from app.core.logging import JsonFormatter, request_id_context


def test_json_formatter_includes_business_extra_without_internal_fields() -> None:
    record = logging.getLogger("app").makeRecord(
        "app", logging.INFO, __file__, 12, "external_call", (), None,
        extra={
            "provider": "openai",
            "operation": "responses.create",
            "duration_ms": 120,
            "result": "success",
            "retry_count": 0,
            "input_tokens": 120,
            "output_tokens": 45,
            "token_count": 165,
            "token_usage": {"total": 165},
        },
    )
    token = request_id_context.set("req_logging_test")
    try:
        entry = json.loads(JsonFormatter().format(record))
    finally:
        request_id_context.reset(token)

    assert entry["request_id"] == "req_logging_test"
    assert entry["event"] == "external_call"
    for key, value in {
        "provider": "openai", "operation": "responses.create", "duration_ms": 120,
        "result": "success", "retry_count": 0,
        "input_tokens": 120, "output_tokens": 45, "token_count": 165,
        "token_usage": {"total": 165},
    }.items():
        assert entry[key] == value
    assert not {"name", "msg", "args", "pathname", "levelname", "created"} & entry.keys()


def test_json_formatter_redacts_sensitive_extra() -> None:
    record = logging.getLogger("app").makeRecord(
        "app", logging.INFO, __file__, 12, "external_call", (), None,
        extra={
            "access_token": "private-access",
            "refresh_token": "private-refresh",
            "api_key": "private-key",
            "authorization": "private-auth",
            "provider": "openai",
        },
    )
    entry = json.loads(JsonFormatter().format(record))
    for key in ("access_token", "refresh_token", "api_key", "authorization"):
        assert entry[key] == "[REDACTED]"
    assert "private" not in json.dumps(entry)
