import json
import logging
from contextvars import ContextVar
from datetime import UTC, datetime

from app.core.config import settings

request_id_context: ContextVar[str] = ContextVar("request_id", default="-")
LOG_RECORD_FIELDS = frozenset(logging.makeLogRecord({}).__dict__) | {"message", "asctime"}
BASE_FIELDS = frozenset({"timestamp", "level", "service", "event", "request_id", "exception"})
SENSITIVE_FIELDS = frozenset({
    "password", "secret", "client_secret", "token", "access_token", "refresh_token",
    "api_key", "authorization", "cookie",
})


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        entry: dict[str, object] = {
            "timestamp": datetime.fromtimestamp(record.created, UTC).isoformat(),
            "level": record.levelname,
            "service": settings.service_name,
            "event": record.getMessage(),
            "request_id": request_id_context.get(),
        }
        for key, value in record.__dict__.items():
            if key in LOG_RECORD_FIELDS or key in BASE_FIELDS:
                continue
            if key.lower() in SENSITIVE_FIELDS:
                entry[key] = "[REDACTED]"
            else:
                entry[key] = value
        if record.exc_info:
            entry["exception"] = self.formatException(record.exc_info)
        return json.dumps(
            entry, ensure_ascii=False, default=lambda value: f"<{type(value).__name__}>"
        )


def configure_logging(json_output: bool) -> None:
    handler = logging.StreamHandler()
    handler.setFormatter(JsonFormatter() if json_output else logging.Formatter(
        "%(levelname)s %(name)s %(message)s"
    ))
    logger = logging.getLogger("app")
    logger.handlers = [handler]
    logger.setLevel(logging.INFO)
    logger.propagate = False
