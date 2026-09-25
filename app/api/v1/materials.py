from typing import Annotated, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ApplicationError
from app.db.session import get_session
from app.models.course import Course
from app.models.material import Material
from app.models.vocabulary import AudienceType, Industry
from app.schemas.material import (
    MaterialCreate,
    MaterialMarkdownImport,
    MaterialMarkdownImportResult,
    MaterialPage,
    MaterialRead,
    MaterialUpdate,
)

DbSession = Annotated[AsyncSession, Depends(get_session)]

router = APIRouter(prefix="/materials", tags=["materials"])

MaterialStatusFilter = Literal["草稿", "可用", "主力", "待更新", "退役"]
MaterialTypeFilter = Literal["故事", "案例", "Demo", "金句", "段子", "行业素材"]


def parse_markdown_import(markdown: str) -> list[tuple[str, str]]:
    if not markdown.strip():
        raise ApplicationError("MARKDOWN_IMPORT_INVALID", "请粘贴 Markdown 内容", 422)

    materials: list[tuple[str, str]] = []
    title: str | None = None
    body_lines: list[str] = []
    for line_number, line in enumerate(markdown.splitlines(), start=1):
        if line.startswith("## "):
            if title is not None:
                body = "\n".join(body_lines).strip()
                if not body:
                    raise ApplicationError(
                        "MARKDOWN_IMPORT_INVALID",
                        f"素材「{title}」的正文不能为空",
                        422,
                    )
                materials.append((title, body))
            title = line[3:].strip()
            if not title:
                raise ApplicationError(
                    "MARKDOWN_IMPORT_INVALID", f"第 {line_number} 行缺少素材标题", 422
                )
            body_lines = []
        elif line.lstrip().startswith("#"):
            raise ApplicationError(
                "MARKDOWN_IMPORT_INVALID",
                f"第 {line_number} 行格式错误：素材标题必须使用 `## 标题` 格式",
                422,
            )
        elif title is None:
            if line.strip():
                raise ApplicationError(
                    "MARKDOWN_IMPORT_INVALID",
                    f"第 {line_number} 行位于第一个 `## 标题` 之前，请检查 Markdown 格式",
                    422,
                )
        else:
            body_lines.append(line)

    if title is None:
        raise ApplicationError(
            "MARKDOWN_IMPORT_INVALID", "未找到 `## 标题`，请按约定格式整理内容", 422
        )
    body = "\n".join(body_lines).strip()
    if not body:
        raise ApplicationError("MARKDOWN_IMPORT_INVALID", "最后一条素材正文不能为空", 422)
    materials.append((title, body))
    return materials


@router.post("", response_model=MaterialRead, status_code=201)
async def create_material(payload: MaterialCreate, session: DbSession) -> Material:
    material = Material(title=payload.title, type=payload.type, body=payload.body, status="草稿")
    session.add(material)
    await session.commit()
    await session.refresh(material)
    return material


@router.post("/import", response_model=MaterialMarkdownImportResult, status_code=201)
async def import_materials(payload: MaterialMarkdownImport,
                           session: DbSession) -> MaterialMarkdownImportResult:
    parsed = parse_markdown_import(payload.markdown)
    session.add_all([
        Material(title=title, body=body, type=None, status="草稿")
        for title, body in parsed
    ])
    try:
        await session.commit()
    except Exception as exc:
        await session.rollback()
        raise ApplicationError(
            "MATERIAL_IMPORT_FAILED", "批量导入失败，未保存任何素材，请检查内容后重试", 500
        ) from exc
    return MaterialMarkdownImportResult(count=len(parsed))


@router.get("", response_model=MaterialPage)
async def list_materials(session: DbSession,
                         q: Annotated[str | None, Query(max_length=255)] = None,
                         title: Annotated[str | None, Query(max_length=255)] = None,
                         material_type: Annotated[
                             MaterialTypeFilter | None, Query(alias="type")
                         ] = None,
                         status: Annotated[MaterialStatusFilter | None, Query()] = None,
                         course_id: Annotated[UUID | None, Query()] = None,
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
    if course_id is not None:
        course_exists = await session.scalar(select(Course.id).where(Course.id == course_id))
        if course_exists is None:
            raise HTTPException(status_code=404, detail="课程不存在")
        where.append(Material.courses.any(Course.id == course_id))
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
    courses = None
    audience_types = None
    industries = None
    if "course_ids" in payload.model_fields_set:
        course_ids = payload.course_ids or []
        if len(course_ids) != len(set(course_ids)):
            raise ApplicationError("COURSE_IDS_INVALID", "课程 ID 不能重复", 422)
        course_rows = await session.scalars(select(Course).where(Course.id.in_(course_ids)))
        courses = list(course_rows.all())
        if len(courses) != len(course_ids):
            raise ApplicationError("COURSE_IDS_INVALID", "课程不存在", 422)
    if "audience_type_ids" in payload.model_fields_set:
        identifiers = payload.audience_type_ids or []
        if len(identifiers) != len(set(identifiers)):
            raise ApplicationError("MATERIAL_VOCABULARY_IDS_INVALID", "人群类型 ID 不能重复", 422)
        rows = await session.scalars(select(AudienceType).where(AudienceType.id.in_(identifiers)))
        audience_types = list(rows.all())
        if len(audience_types) != len(identifiers):
            raise ApplicationError("MATERIAL_VOCABULARY_IDS_INVALID", "人群类型不存在", 422)
    if "industry_ids" in payload.model_fields_set:
        identifiers = payload.industry_ids or []
        if len(identifiers) != len(set(identifiers)):
            raise ApplicationError("MATERIAL_VOCABULARY_IDS_INVALID", "行业 ID 不能重复", 422)
        rows = await session.scalars(select(Industry).where(Industry.id.in_(identifiers)))
        industries = list(rows.all())
        if len(industries) != len(identifiers):
            raise ApplicationError("MATERIAL_VOCABULARY_IDS_INVALID", "行业不存在", 422)
    material.title = payload.title
    material.type = payload.type
    material.body = payload.body
    if "supporting_judgment" in payload.model_fields_set:
        material.supporting_judgment = payload.supporting_judgment
    if "speaking_notes" in payload.model_fields_set:
        material.speaking_notes = payload.speaking_notes
    if "source_note" in payload.model_fields_set:
        material.source_note = payload.source_note
    material.status = payload.status
    if courses is not None:
        material.courses = courses
    if audience_types is not None:
        material.audience_types = audience_types
    if industries is not None:
        material.industries = industries
    await session.commit()
    await session.refresh(material)
    return material
