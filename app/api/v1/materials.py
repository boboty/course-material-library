from datetime import date
from typing import Annotated, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import case, func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import aliased, selectinload

from app.core.exceptions import ApplicationError
from app.db.session import get_session
from app.models.course import Course
from app.models.material import Material
from app.models.session import Session
from app.models.usage import Usage
from app.models.vocabulary import AudienceType, Industry
from app.schemas.material import (
    MaterialCreate,
    MaterialDetailRead,
    MaterialFamilyCandidate,
    MaterialListItem,
    MaterialMarkdownImport,
    MaterialMarkdownImportResult,
    MaterialPage,
    MaterialRead,
    MaterialReference,
    MaterialUpdate,
    ReviewWarningSession,
)

DbSession = Annotated[AsyncSession, Depends(get_session)]

router = APIRouter(prefix="/materials", tags=["materials"])

MaterialStatusFilter = Literal["草稿", "可用", "主力", "待更新", "退役"]
MaterialTypeFilter = Literal["故事", "案例", "Demo", "金句", "段子", "行业素材"]
MaterialAlertFilter = Literal["review_overdue", "consecutive_bad", "attention"]


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
                         audience_type_id: Annotated[UUID | None, Query()] = None,
                         industry_id: Annotated[UUID | None, Query()] = None,
                         tag: Annotated[str | None, Query(max_length=255)] = None,
                         alert: Annotated[MaterialAlertFilter | None, Query()] = None,
                         page: Annotated[int, Query(ge=1)] = 1,
                         page_size: Annotated[int, Query(ge=1, le=100)] = 20) -> MaterialPage:
    where = []
    if q and q.strip():
        search = f"%{q.strip()}%"
        matching_tags = func.unnest(Material.tags).column_valued("material_tag")
        tag_matches = select(1).where(matching_tags.ilike(search)).correlate(Material).exists()
        where.append(or_(
            Material.title.ilike(search), Material.body.ilike(search),
            tag_matches,
        ))
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
    if audience_type_id is not None:
        audience_exists = await session.scalar(
            select(AudienceType.id).where(AudienceType.id == audience_type_id)
        )
        if audience_exists is None:
            raise HTTPException(status_code=404, detail="人群类型不存在")
        where.append(Material.audience_types.any(AudienceType.id == audience_type_id))
    if industry_id is not None:
        industry_exists = await session.scalar(
            select(Industry.id).where(Industry.id == industry_id)
        )
        if industry_exists is None:
            raise HTTPException(status_code=404, detail="行业不存在")
        where.append(Material.industries.any(Industry.id == industry_id))
    if tag is not None:
        where.append(Material.tags.contains([tag]))
    today = date.today()
    overdue = Material.review_date.is_not(None) & (Material.review_date < today)
    ranked_usages = select(
        Usage.material_id.label("material_id"),
        Usage.effect.label("effect"),
        func.row_number().over(
            partition_by=Usage.material_id,
            order_by=(Session.session_date.desc(), Usage.updated_at.desc(), Usage.id.desc()),
        ).label("position"),
    ).join(Session, Session.id == Usage.session_id).where(Usage.status == "已用").subquery()
    consecutive_bad_ids = (
        select(ranked_usages.c.material_id)
        .where(ranked_usages.c.position <= 2)
        .group_by(ranked_usages.c.material_id)
        .having(
            func.count() == 2,
            func.count(case((ranked_usages.c.effect == "差", 1))) == 2,
        )
    )
    consecutive_bad = Material.id.in_(consecutive_bad_ids)
    if alert == "review_overdue":
        where.append(overdue)
    elif alert == "consecutive_bad":
        where.append(consecutive_bad)
    elif alert == "attention":
        where.append(or_(overdue, consecutive_bad))
    total = await session.scalar(select(func.count()).select_from(Material).where(*where))
    rows = await session.scalars(select(Material).where(*where)
                                 .order_by(Material.created_at.desc(), Material.id.desc())
                                 .offset((page - 1) * page_size).limit(page_size))
    materials = list(rows.all())
    recent_usages: dict[UUID, list[tuple[str, ReviewWarningSession]]] = {}
    if materials:
        recent_rows = await session.execute(
            select(Usage, Session)
            .join(Session, Session.id == Usage.session_id)
            .where(Usage.material_id.in_([item.id for item in materials]), Usage.status == "已用")
            .options(selectinload(Session.audience_types))
            .order_by(Session.session_date.desc(), Usage.updated_at.desc(), Usage.id.desc())
        )
        for usage, teaching_session in recent_rows:
            recent = recent_usages.setdefault(usage.material_id, [])
            if len(recent) < 2:
                recent.append((usage.effect, ReviewWarningSession(
                    session_date=teaching_session.session_date,
                    audience_types=[audience.name for audience in teaching_session.audience_types],
                    customer_name=teaching_session.customer.name,
                    course_name=teaching_session.course.name,
                )))
    items: list[MaterialListItem] = []
    for material in materials:
        latest = recent_usages.get(material.id, [])
        # Keep the sequence decision tied to the two newest actual-use records;
        # an unrated record is not treated as an average rating or skipped.
        is_consecutive_bad = len(latest) == 2 and all(
            effect == "差" for effect, _details in latest
        )
        items.append(MaterialListItem(
            **MaterialRead.model_validate(material).model_dump(),
            review_overdue=material.review_date is not None and material.review_date < today,
            consecutive_bad_usages=[details for _effect, details in latest]
            if is_consecutive_bad else [],
        ))
    return MaterialPage(items=items,
                        page=page, page_size=page_size, total=total or 0)


@router.get("/tags", response_model=list[str])
async def list_material_tags(session: DbSession) -> list[str]:
    tags = await session.scalars(
        select(func.unnest(Material.tags)).distinct().order_by(func.unnest(Material.tags))
    )
    return list(tags.all())


@router.get("/family-candidates", response_model=list[MaterialFamilyCandidate])
async def list_material_family_candidates(session: DbSession) -> list[MaterialFamilyCandidate]:
    source = aliased(Material)
    rows = await session.execute(
        select(
            Material.id,
            Material.title,
            Material.source_material_id,
            source.title.label("source_title"),
        )
        .outerjoin(source, source.id == Material.source_material_id)
        .order_by(Material.created_at.desc(), Material.id.desc())
    )
    return [MaterialFamilyCandidate.model_validate(row._mapping) for row in rows]


@router.get("/{material_id}", response_model=MaterialDetailRead)
async def get_material(material_id: UUID, session: DbSession) -> MaterialDetailRead:
    material = await session.get(Material, material_id)
    if material is None:
        raise HTTPException(status_code=404)
    family_root_id = material.source_material_id or material.id
    family_rows = await session.scalars(
        select(Material)
        .where(
            or_(Material.id == family_root_id,
                Material.source_material_id == family_root_id),
            Material.id != material.id,
        )
        .order_by(Material.created_at, Material.id)
    )
    result = MaterialDetailRead.model_validate(material)
    result.family_members = [
        MaterialReference(id=member.id, title=member.title) for member in family_rows
    ]
    return result


@router.put("/{material_id}", response_model=MaterialRead)
async def update_material(material_id: UUID, payload: MaterialUpdate,
                          session: DbSession) -> Material:
    material = await session.get(Material, material_id)
    if material is None:
        raise HTTPException(status_code=404)
    if payload.status != "草稿" and (payload.type is None or payload.body is None):
        raise ApplicationError("MATERIAL_INCOMPLETE", "非草稿素材必须填写类型和正文", 422)
    source_material_id: UUID | None = None
    source_root: Material | None = None
    if "source_material_id" in payload.model_fields_set and payload.source_material_id is not None:
        requested_source = payload.source_material_id
        if requested_source == material.id:
            raise ApplicationError("MATERIAL_SOURCE_INVALID", "素材不能将自身设为源素材", 422)
        source_material = await session.get(Material, requested_source)
        if source_material is None:
            raise ApplicationError("MATERIAL_SOURCE_NOT_FOUND", "源素材不存在", 422)
        source_material_id = source_material.source_material_id or source_material.id
        if source_material_id == material.id:
            raise ApplicationError("MATERIAL_SOURCE_INVALID", "不能选择当前素材家族的成员", 422)
        if source_material_id == source_material.id:
            source_root = source_material
        else:
            source_root = await session.get(Material, source_material_id)
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
    tags = (payload.tags or []) if "tags" in payload.model_fields_set else None
    material.title = payload.title
    material.type = payload.type
    material.body = payload.body
    if "supporting_judgment" in payload.model_fields_set:
        material.supporting_judgment = payload.supporting_judgment
    if "speaking_notes" in payload.model_fields_set:
        material.speaking_notes = payload.speaking_notes
    if "source_note" in payload.model_fields_set:
        material.source_note = payload.source_note
    if "review_date" in payload.model_fields_set:
        material.review_date = payload.review_date
    if "demo_verified_on" in payload.model_fields_set:
        material.demo_verified_on = payload.demo_verified_on
    if "case_category" in payload.model_fields_set:
        material.case_category = payload.case_category
    if "retirement_reason" in payload.model_fields_set:
        material.retirement_reason = payload.retirement_reason
    material.status = payload.status
    # Type/status transitions deterministically clear fields that no longer apply.
    if payload.type != "案例":
        material.case_category = None
    if payload.type != "Demo":
        material.demo_verified_on = None
    if payload.status != "退役":
        material.retirement_reason = None
    if courses is not None:
        material.courses = courses
    if audience_types is not None:
        material.audience_types = audience_types
    if industries is not None:
        material.industries = industries
    if tags is not None:
        material.tags = tags
    if "source_material_id" in payload.model_fields_set:
        if source_material_id is not None:
            await session.execute(
                update(Material)
                .where(Material.source_material_id == material.id)
                .values(source_material_id=source_material_id)
            )
        material.source_material_id = source_material_id
        material.source_material = source_root
    await session.commit()
    await session.refresh(material)
    return material
