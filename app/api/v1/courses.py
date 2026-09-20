from typing import Annotated, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.models.course import Course
from app.schemas.course import CourseCreate, CoursePage, CourseRead, CourseUpdate

DbSession = Annotated[AsyncSession, Depends(get_session)]

router = APIRouter(prefix="/courses", tags=["courses"])

CourseStatusFilter = Literal["启用", "停用"]


def _apply(course: Course, payload: CourseCreate | CourseUpdate) -> None:
    course.name = payload.name
    course.alias = payload.alias
    course.status = payload.status


@router.get("", response_model=CoursePage)
async def list_courses(session: DbSession,
                       q: Annotated[str | None, Query(max_length=255)] = None,
                       status: Annotated[CourseStatusFilter | None, Query()] = None,
                       page: Annotated[int, Query(ge=1)] = 1,
                       page_size: Annotated[int, Query(ge=1, le=100)] = 20) -> CoursePage:
    where = []
    if q and q.strip():
        keyword = f"%{q.strip()}%"
        where.append(Course.name.ilike(keyword) | Course.alias.ilike(keyword))
    if status is not None:
        where.append(Course.status == status)
    total = await session.scalar(select(func.count()).select_from(Course).where(*where))
    rows = await session.scalars(select(Course).where(*where)
                                 .order_by(Course.name.asc())
                                 .offset((page - 1) * page_size).limit(page_size))
    return CoursePage(items=[CourseRead.model_validate(row) for row in rows],
                      page=page, page_size=page_size, total=total or 0)


@router.post("", response_model=CourseRead, status_code=201)
async def create_course(payload: CourseCreate, session: DbSession) -> Course:
    course = Course()
    _apply(course, payload)
    session.add(course)
    await session.commit()
    await session.refresh(course)
    return course


@router.get("/{course_id}", response_model=CourseRead)
async def get_course(course_id: UUID, session: DbSession) -> Course:
    course = await session.get(Course, course_id)
    if course is None:
        raise HTTPException(status_code=404)
    return course


@router.put("/{course_id}", response_model=CourseRead)
async def update_course(course_id: UUID, payload: CourseUpdate, session: DbSession) -> Course:
    course = await session.get(Course, course_id)
    if course is None:
        raise HTTPException(status_code=404)
    _apply(course, payload)
    await session.commit()
    await session.refresh(course)
    return course
