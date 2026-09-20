from typing import Annotated, Any, cast
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import delete, select
from sqlalchemy.engine import CursorResult
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError
from app.db.session import get_session
from app.models.material import Material
from app.models.session import Session
from app.models.usage import Usage
from app.schemas.usage import UsageCreate, UsageRead

DbSession = Annotated[AsyncSession, Depends(get_session)]

router = APIRouter(prefix="/sessions/{session_id}/usages", tags=["usages"])


async def _require_session(session: AsyncSession, session_id: UUID) -> Session:
    teaching_session = await session.get(Session, session_id)
    if teaching_session is None:
        raise HTTPException(status_code=404)
    return teaching_session


@router.get("", response_model=list[UsageRead])
async def list_usages(session_id: UUID, session: DbSession) -> list[Usage]:
    await _require_session(session, session_id)
    rows = await session.scalars(select(Usage).where(Usage.session_id == session_id)
                                 .order_by(Usage.created_at.asc(), Usage.id.asc()))
    return list(rows)


@router.post("", response_model=UsageRead, status_code=201)
async def plan_material(session_id: UUID, payload: UsageCreate, session: DbSession) -> Usage:
    await _require_session(session, session_id)
    if await session.get(Material, payload.material_id) is None:
        raise HTTPException(status_code=404)

    existing = await session.scalar(
        select(Usage.id).where(Usage.session_id == session_id,
                               Usage.material_id == payload.material_id)
    )
    if existing is not None:
        raise ConflictError("该素材已在本场计划中")

    usage = Usage(session_id=session_id, material_id=payload.material_id,
                  status="计划", effect="未评", reaction=None)
    session.add(usage)
    try:
        await session.commit()
    except IntegrityError as exc:
        await session.rollback()
        raise ConflictError("该素材已在本场计划中") from exc
    await session.refresh(usage)
    return usage


@router.delete("/{usage_id}", status_code=204)
async def remove_planned_material(session_id: UUID, usage_id: UUID, session: DbSession) -> None:
    await _require_session(session, session_id)
    result = cast(CursorResult[Any], await session.execute(
        delete(Usage).where(Usage.id == usage_id, Usage.session_id == session_id,
                            Usage.status == "计划")
    ))
    if result.rowcount == 0:
        raise HTTPException(status_code=404)
    await session.commit()
