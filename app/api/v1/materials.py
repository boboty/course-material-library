from typing import Annotated, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ApplicationError
from app.db.session import get_session
from app.models.material import Material
from app.schemas.material import MaterialCreate, MaterialPage, MaterialRead, MaterialUpdate

DbSession = Annotated[AsyncSession, Depends(get_session)]

router = APIRouter(prefix="/materials", tags=["materials"])

MaterialStatusFilter = Literal["草稿", "可用", "主力", "待更新", "退役"]
MaterialTypeFilter = Literal["故事", "案例", "Demo", "金句", "段子", "行业素材"]


@router.post("", response_model=MaterialRead, status_code=201)
async def create_material(payload: MaterialCreate, session: DbSession) -> Material:
    material = Material(title=payload.title, type=payload.type, body=payload.body, status="草稿")
    session.add(material)
    await session.commit()
    await session.refresh(material)
    return material


@router.get("", response_model=MaterialPage)
async def list_materials(session: DbSession,
                         q: Annotated[str | None, Query(max_length=255)] = None,
                         title: Annotated[str | None, Query(max_length=255)] = None,
                         material_type: Annotated[
                             MaterialTypeFilter | None, Query(alias="type")
                         ] = None,
                         status: Annotated[MaterialStatusFilter | None, Query()] = None,
                         page: Annotated[int, Query(ge=1)] = 1,
                         page_size: Annotated[int, Query(ge=1, le=100)] = 20) -> MaterialPage:
    where = []
    if q and q.strip():
        search = f"%{q.strip()}%"
        where.append(or_(Material.title.ilike(search), Material.body.ilike(search)))
    if title is not None:
        where.append(Material.title == title)
    if material_type is not None:
        where.append(Material.type == material_type)
    if status is not None:
        where.append(Material.status == status)
    total = await session.scalar(select(func.count()).select_from(Material).where(*where))
    rows = await session.scalars(select(Material).where(*where)
                                 .order_by(Material.created_at.desc(), Material.id.desc())
                                 .offset((page - 1) * page_size).limit(page_size))
    return MaterialPage(items=[MaterialRead.model_validate(row) for row in rows],
                        page=page, page_size=page_size, total=total or 0)


@router.get("/{material_id}", response_model=MaterialRead)
async def get_material(material_id: UUID, session: DbSession) -> Material:
    material = await session.get(Material, material_id)
    if material is None:
        raise HTTPException(status_code=404)
    return material


@router.put("/{material_id}", response_model=MaterialRead)
async def update_material(material_id: UUID, payload: MaterialUpdate,
                          session: DbSession) -> Material:
    material = await session.get(Material, material_id)
    if material is None:
        raise HTTPException(status_code=404)
    if payload.status != "草稿" and (payload.type is None or payload.body is None):
        raise ApplicationError("MATERIAL_INCOMPLETE", "非草稿素材必须填写类型和正文", 422)
    material.title = payload.title
    material.type = payload.type
    material.body = payload.body
    material.status = payload.status
    await session.commit()
    await session.refresh(material)
    return material
