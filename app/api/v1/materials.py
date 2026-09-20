from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.models.material import Material
from app.schemas.material import MaterialCreate, MaterialPage, MaterialRead

DbSession = Annotated[AsyncSession, Depends(get_session)]

router = APIRouter(prefix="/materials", tags=["materials"])


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
                         page: Annotated[int, Query(ge=1)] = 1,
                         page_size: Annotated[int, Query(ge=1, le=100)] = 20) -> MaterialPage:
    predicate = Material.title.ilike(f"%{q.strip()}%") if q and q.strip() else None
    where = [predicate] if predicate is not None else []
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
