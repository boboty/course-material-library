from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError
from app.db.session import get_session
from app.models.vocabulary import AudienceType, Industry
from app.schemas.course import VocabularyCreate, VocabularyPage, VocabularyRead

DbSession = Annotated[AsyncSession, Depends(get_session)]

industries_router = APIRouter(prefix="/industries", tags=["industries"])
audience_types_router = APIRouter(prefix="/audience-types", tags=["audience-types"])


async def _industry_name_taken(session: AsyncSession, name: str, exclude: UUID | None) -> bool:
    query = select(Industry.id).where(Industry.name == name)
    if exclude is not None:
        query = query.where(Industry.id != exclude)
    return await session.scalar(query) is not None


async def _audience_type_name_taken(session: AsyncSession, name: str) -> bool:
    query = select(AudienceType.id).where(AudienceType.name == name)
    return await session.scalar(query) is not None


@industries_router.get("", response_model=VocabularyPage)
async def list_industries(session: DbSession,
                          q: Annotated[str | None, Query(max_length=100)] = None,
                          page: Annotated[int, Query(ge=1)] = 1,
                          page_size: Annotated[int, Query(ge=1, le=100)] = 100) -> VocabularyPage:
    where = []
    if q and q.strip():
        where.append(Industry.name.ilike(f"%{q.strip()}%"))
    total = await session.scalar(select(func.count()).select_from(Industry).where(*where))
    rows = await session.scalars(select(Industry).where(*where).order_by(Industry.name.asc())
                                 .offset((page - 1) * page_size).limit(page_size))
    return VocabularyPage(items=[VocabularyRead.model_validate(row) for row in rows],
                          page=page, page_size=page_size, total=total or 0)


@industries_router.post("", response_model=VocabularyRead, status_code=201)
async def create_industry(payload: VocabularyCreate, session: DbSession) -> Industry:
    if await _industry_name_taken(session, payload.name, None):
        raise ConflictError(f"行业“{payload.name}”已存在")
    industry = Industry(name=payload.name)
    session.add(industry)
    try:
        await session.commit()
    except IntegrityError as exc:
        await session.rollback()
        raise ConflictError(f"行业“{payload.name}”已存在") from exc
    await session.refresh(industry)
    return industry


@audience_types_router.get("", response_model=VocabularyPage)
async def list_audience_types(
        session: DbSession,
        q: Annotated[str | None, Query(max_length=100)] = None,
        page: Annotated[int, Query(ge=1)] = 1,
        page_size: Annotated[int, Query(ge=1, le=100)] = 100) -> VocabularyPage:
    where = []
    if q and q.strip():
        where.append(AudienceType.name.ilike(f"%{q.strip()}%"))
    total = await session.scalar(select(func.count()).select_from(AudienceType).where(*where))
    rows = await session.scalars(select(AudienceType).where(*where)
                                 .order_by(AudienceType.name.asc())
                                 .offset((page - 1) * page_size).limit(page_size))
    return VocabularyPage(items=[VocabularyRead.model_validate(row) for row in rows],
                          page=page, page_size=page_size, total=total or 0)


@audience_types_router.post("", response_model=VocabularyRead, status_code=201)
async def create_audience_type(payload: VocabularyCreate, session: DbSession) -> AudienceType:
    if await _audience_type_name_taken(session, payload.name):
        raise ConflictError(f"人群类型“{payload.name}”已存在")
    audience_type = AudienceType(name=payload.name)
    session.add(audience_type)
    try:
        await session.commit()
    except IntegrityError as exc:
        await session.rollback()
        raise ConflictError(f"人群类型“{payload.name}”已存在") from exc
    await session.refresh(audience_type)
    return audience_type
