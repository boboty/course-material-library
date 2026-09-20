from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ApplicationError
from app.db.session import get_session
from app.models.course import Course
from app.models.customer import Customer
from app.models.session import Session
from app.models.vocabulary import AudienceType
from app.schemas.session import SessionCreate, SessionPage, SessionRead

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


@router.get("/{session_id}", response_model=SessionRead)
async def get_session_detail(session_id: UUID, session: DbSession) -> Session:
    teaching_session = await session.get(Session, session_id)
    if teaching_session is None:
        raise HTTPException(status_code=404)
    return teaching_session
