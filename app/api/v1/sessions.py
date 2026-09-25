from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import ApplicationError
from app.db.session import get_session
from app.models.course import Course
from app.models.customer import Customer
from app.models.material import Material
from app.models.session import Session
from app.models.usage import Usage
from app.models.vocabulary import AudienceType
from app.schemas.material import MaterialRead
from app.schemas.session import (
    RepeatUsageRead,
    SessionCreate,
    SessionMaterialCandidateRead,
    SessionPage,
    SessionRead,
)

DbSession = Annotated[AsyncSession, Depends(get_session)]

router = APIRouter(prefix="/sessions", tags=["sessions"])


async def _require(session: AsyncSession, model: type[Customer] | type[Course] | type[AudienceType],
                   identifier: UUID, code: str, message: str) -> None:
    if await session.get(model, identifier) is None:
        raise ApplicationError(code, message, 404)


@router.get("", response_model=SessionPage)
async def list_sessions(session: DbSession,
                        page: Annotated[int, Query(ge=1)] = 1,
                        page_size: Annotated[int, Query(ge=1, le=100)] = 20) -> SessionPage:
    total = await session.scalar(select(func.count()).select_from(Session))
    rows = await session.scalars(select(Session)
                                 .order_by(Session.session_date.desc(), Session.id.desc())
                                 .offset((page - 1) * page_size).limit(page_size))
    return SessionPage(items=[SessionRead.model_validate(row) for row in rows],
                       page=page, page_size=page_size, total=total or 0)


@router.post("", response_model=SessionRead, status_code=201)
async def create_session(payload: SessionCreate, session: DbSession) -> Session:
    await _require(session, Customer, payload.customer_id, "CUSTOMER_NOT_FOUND", "客户不存在")
    await _require(session, Course, payload.course_id, "COURSE_NOT_FOUND", "课程不存在")
    audience_types: list[AudienceType] = []
    for audience_type_id in payload.audience_type_ids:
        audience_type = await session.get(AudienceType, audience_type_id)
        if audience_type is None:
            raise ApplicationError("AUDIENCE_TYPE_NOT_FOUND", "人群类型不存在", 404)
        audience_types.append(audience_type)

    teaching_session = Session(
        customer_id=payload.customer_id,
        course_id=payload.course_id,
        session_date=payload.session_date,
        audience_description=payload.audience_description,
        duration=payload.duration,
        notes=payload.notes,
        audience_types=audience_types,
    )
    session.add(teaching_session)
    await session.commit()
    await session.refresh(teaching_session)
    return teaching_session


@router.get("/{session_id}/material-candidates",
            response_model=list[SessionMaterialCandidateRead])
async def list_material_candidates(session_id: UUID, session: DbSession,
                                  q: Annotated[str | None, Query(max_length=255)] = None
                                  ) -> list[SessionMaterialCandidateRead]:
    teaching_session = await session.get(
        Session, session_id, options=[selectinload(Session.audience_types)]
    )
    if teaching_session is None:
        raise HTTPException(status_code=404)
    customer = await session.get(Customer, teaching_session.customer_id)
    if customer is None:
        raise HTTPException(status_code=404)

    material_query = select(Material)
    if q and q.strip():
        search = f"%{q.strip()}%"
        matching_tags = func.unnest(Material.tags).column_valued("material_tag")
        tag_matches = select(1).where(matching_tags.ilike(search)).correlate(Material).exists()
        material_query = material_query.where(or_(
            Material.title.ilike(search), Material.body.ilike(search), tag_matches,
        ))
    materials = list((await session.scalars(
        material_query.order_by(Material.created_at.desc(), Material.id.desc())
    )).all())
    if not materials:
        return []

    family_roots = {material.source_material_id or material.id for material in materials}
    match_conditions = [Customer.id == customer.id]
    if customer.group_name:
        match_conditions.append(and_(Customer.group_name == customer.group_name,
                                     Customer.id != customer.id))
    family_root = func.coalesce(Material.source_material_id, Material.id)
    history_rows = await session.execute(
        select(family_root, Usage, Session, Customer, Course)
        .join(Usage, Usage.material_id == Material.id)
        .join(Session, Session.id == Usage.session_id)
        .join(Customer, Customer.id == Session.customer_id)
        .join(Course, Course.id == Session.course_id)
        .where(
            family_root.in_(family_roots),
            Usage.status == "已用",
            Session.id != teaching_session.id,
            or_(*match_conditions),
        )
        .options(selectinload(Session.audience_types))
        .order_by(Session.session_date.desc(), Usage.updated_at.desc(), Usage.id.desc())
    )

    latest_by_family_and_level: dict[tuple[UUID, str], tuple[Session, Customer, Course]] = {}
    for root_id, _usage, historical_session, historical_customer, course in history_rows:
        level = "same_customer" if historical_customer.id == customer.id else "same_group"
        key = (root_id, level)
        latest_by_family_and_level.setdefault(
            key, (historical_session, historical_customer, course)
        )

    candidates: list[SessionMaterialCandidateRead] = []
    for material in materials:
        root_id = material.source_material_id or material.id
        recent = (latest_by_family_and_level.get((root_id, "same_customer"))
                  or latest_by_family_and_level.get((root_id, "same_group")))
        repeat_usage = None
        if recent is not None:
            historical_session, historical_customer, course = recent
            level = "same_customer" if historical_customer.id == customer.id else "same_group"
            repeat_usage = RepeatUsageRead(
                level=level,
                session_date=historical_session.session_date,
                course_name=course.name,
                audience_types=[item.name for item in historical_session.audience_types],
                customer_name=historical_customer.name,
            )
        material_data = MaterialRead.model_validate(material).model_dump()
        candidates.append(SessionMaterialCandidateRead(
            **material_data, repeat_usage=repeat_usage,
        ))
    return candidates


@router.get("/{session_id}", response_model=SessionRead)
async def get_session_detail(session_id: UUID, session: DbSession) -> Session:
    teaching_session = await session.get(Session, session_id)
    if teaching_session is None:
        raise HTTPException(status_code=404)
    return teaching_session
