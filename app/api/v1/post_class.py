from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError
from app.db.session import get_session
from app.models.material import Material
from app.models.session import Session
from app.models.usage import Usage
from app.schemas.post_class import PostClassSave
from app.schemas.usage import UsageRead

DbSession = Annotated[AsyncSession, Depends(get_session)]
router = APIRouter(prefix="/sessions/{session_id}/post-class", tags=["post-class"])


@router.put("", response_model=list[UsageRead])
async def save_post_class(session_id: UUID, payload: PostClassSave,
                          session: DbSession) -> list[Usage]:
    if await session.get(Session, session_id) is None:
        raise HTTPException(status_code=404)

    rows = list(await session.scalars(select(Usage).where(Usage.session_id == session_id)
                                      .order_by(Usage.created_at, Usage.id)))
    by_id = {row.id: row for row in rows}
    submitted_ids = [item.id for item in payload.usages]
    if len(set(submitted_ids)) != len(submitted_ids) or set(submitted_ids) != set(by_id):
        raise HTTPException(status_code=422, detail="使用记录必须完整属于本场次")

    existing_ids = [item.material_id for item in payload.existing_materials]
    if len(set(existing_ids)) != len(existing_ids):
        raise ConflictError("同一素材不能重复补记")
    used_ids = {row.material_id for row in rows}
    if used_ids.intersection(existing_ids):
        raise ConflictError("该素材已有本场使用记录")
    for material_id in existing_ids:
        if await session.get(Material, material_id) is None:
            raise HTTPException(status_code=404, detail="素材不存在")

    try:
        for item in payload.usages:
            row = by_id[item.id]
            row.status = item.status
            row.effect = item.effect
            row.reaction = item.reaction
        for item in payload.existing_materials:
            session.add(Usage(session_id=session_id, material_id=item.material_id,
                              status="已用", effect=item.effect, reaction=item.reaction))
        for item in payload.new_materials:
            material = Material(title=item.title, type=None, body=None, status="草稿")
            session.add(material)
            await session.flush()
            session.add(Usage(session_id=session_id, material_id=material.id,
                              status="已用", effect=item.effect, reaction=item.reaction))
        await session.commit()
    except IntegrityError as exc:
        await session.rollback()
        raise ConflictError("课后登记保存冲突，请刷新后重试") from exc
    return list(await session.scalars(select(Usage).where(Usage.session_id == session_id)
                                      .order_by(Usage.created_at, Usage.id)))
