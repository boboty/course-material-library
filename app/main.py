from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

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

web_dist = Path(__file__).resolve().parent.parent / "web" / "dist"
if web_dist.is_dir():
    app.mount("/assets", StaticFiles(directory=web_dist / "assets"), name="assets")

    @app.middleware("http")
    async def spa_fallback(request: Request, call_next):  # type: ignore[no-untyped-def]
        response = await call_next(request)
        path = request.url.path
        if (request.method == "GET" and response.status_code == 404
                and request.scope.get("route") is None
                and path != "/api" and not path.startswith(("/api/", "/assets/"))):
            return FileResponse(web_dist / "index.html")
        return response
