from fastapi import FastAPI

from app.api.router import api_router
from app.core.config import settings
from app.core.exceptions import install_exception_handlers
from app.core.logging import configure_logging
from app.core.middleware import RequestContextMiddleware

configure_logging(settings.log_json)
app = FastAPI(title=settings.service_name)
app.add_middleware(RequestContextMiddleware)
install_exception_handlers(app)
app.include_router(api_router, prefix="/api/v1")
