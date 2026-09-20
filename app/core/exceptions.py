from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError
from starlette.exceptions import HTTPException


class ApplicationError(Exception):
    def __init__(self, code: str, message: str, status_code: int = 400) -> None:
        self.code = code
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class ConflictError(ApplicationError):
    """业务冲突（例如标准名称重复），必须返回明确错误而不是数据库 500。"""

    def __init__(self, message: str, code: str = "CONFLICT") -> None:
        super().__init__(code, message, 409)


def error_response(request: Request, code: str, message: str, status_code: int) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={"error": {"code": code, "message": message,
                           "request_id": request.state.request_id}},
    )


def install_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(ApplicationError)
    async def application_error(request: Request, exc: ApplicationError) -> JSONResponse:
        return error_response(request, exc.code, exc.message, exc.status_code)

    @app.exception_handler(HTTPException)
    async def http_error(request: Request, exc: HTTPException) -> JSONResponse:
        if exc.status_code == 404:
            return error_response(request, "NOT_FOUND", "Resource not found", 404)
        message = exc.detail if isinstance(exc.detail, str) else "Request failed"
        return error_response(request, f"HTTP_{exc.status_code}", message, exc.status_code)

    @app.exception_handler(RequestValidationError)
    async def validation_error(request: Request, exc: RequestValidationError) -> JSONResponse:
        return error_response(request, "VALIDATION_ERROR", "Invalid request", 422)

    @app.exception_handler(IntegrityError)
    async def integrity_error(request: Request, exc: IntegrityError) -> JSONResponse:
        """兜底：唯一约束等并发冲突返回 409，不向客户端暴露数据库细节。"""
        return error_response(request, "CONFLICT", "Conflicting record", 409)
