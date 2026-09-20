from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ApplicationError, ConflictError
from app.db.session import get_session
from app.models.customer import Customer
from app.models.vocabulary import Industry
from app.schemas.customer import CustomerCreate, CustomerPage, CustomerRead, CustomerUpdate

DbSession = Annotated[AsyncSession, Depends(get_session)]

router = APIRouter(prefix="/customers", tags=["customers"])


async def _name_taken(session: AsyncSession, name: str, exclude: UUID | None) -> bool:
    query = select(Customer.id).where(Customer.name == name)
    if exclude is not None:
        query = query.where(Customer.id != exclude)
    return await session.scalar(query) is not None


def _apply(customer: Customer, payload: CustomerCreate | CustomerUpdate) -> None:
    customer.name = payload.name
    customer.short_name = payload.short_name
    customer.industry_id = payload.industry_id
    customer.group_name = payload.group_name
    customer.notes = payload.notes


async def _require_industry(session: AsyncSession, industry_id: UUID | None) -> None:
    if industry_id is None:
        return
    if await session.get(Industry, industry_id) is None:
        raise ApplicationError("INDUSTRY_NOT_FOUND", "行业不存在", 404)


@router.get("", response_model=CustomerPage)
async def list_customers(session: DbSession,
                         q: Annotated[str | None, Query(max_length=255)] = None,
                         page: Annotated[int, Query(ge=1)] = 1,
                         page_size: Annotated[int, Query(ge=1, le=100)] = 20) -> CustomerPage:
    where = []
    if q and q.strip():
        keyword = f"%{q.strip()}%"
        where.append(Customer.name.ilike(keyword) | Customer.short_name.ilike(keyword))
    total = await session.scalar(select(func.count()).select_from(Customer).where(*where))
    rows = await session.scalars(select(Customer).where(*where)
                                 .order_by(Customer.name.asc())
                                 .offset((page - 1) * page_size).limit(page_size))
    return CustomerPage(items=[CustomerRead.model_validate(row) for row in rows],
                        page=page, page_size=page_size, total=total or 0)


@router.post("", response_model=CustomerRead, status_code=201)
async def create_customer(payload: CustomerCreate, session: DbSession) -> Customer:
    await _require_industry(session, payload.industry_id)
    if await _name_taken(session, payload.name, None):
        raise ConflictError(f"客户标准名称“{payload.name}”已存在")
    customer = Customer()
    _apply(customer, payload)
    session.add(customer)
    try:
        await session.commit()
    except IntegrityError as exc:
        await session.rollback()
        raise ConflictError(f"客户标准名称“{payload.name}”已存在") from exc
    await session.refresh(customer)
    return customer


@router.get("/{customer_id}", response_model=CustomerRead)
async def get_customer(customer_id: UUID, session: DbSession) -> Customer:
    customer = await session.get(Customer, customer_id)
    if customer is None:
        raise HTTPException(status_code=404)
    return customer


@router.put("/{customer_id}", response_model=CustomerRead)
async def update_customer(customer_id: UUID, payload: CustomerUpdate,
                          session: DbSession) -> Customer:
    customer = await session.get(Customer, customer_id)
    if customer is None:
        raise HTTPException(status_code=404)
    await _require_industry(session, payload.industry_id)
    if await _name_taken(session, payload.name, customer_id):
        raise ConflictError(f"客户标准名称“{payload.name}”已存在")
    _apply(customer, payload)
    try:
        await session.commit()
    except IntegrityError as exc:
        await session.rollback()
        raise ConflictError(f"客户标准名称“{payload.name}”已存在") from exc
    await session.refresh(customer)
    return customer
