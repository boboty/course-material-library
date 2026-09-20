from fastapi import APIRouter

from app.api.v1.courses import router as courses_router
from app.api.v1.customers import router as customers_router
from app.api.v1.health import router as health_router
from app.api.v1.materials import router as materials_router
from app.api.v1.sessions import router as sessions_router
from app.api.v1.usages import router as usages_router
from app.api.v1.vocabularies import audience_types_router, industries_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(materials_router)
api_router.include_router(customers_router)
api_router.include_router(courses_router)
api_router.include_router(industries_router)
api_router.include_router(audience_types_router)
# usages 路径挂在 sessions 之下，需先于 sessions 的 /{session_id} 注册
api_router.include_router(usages_router)
api_router.include_router(sessions_router)
