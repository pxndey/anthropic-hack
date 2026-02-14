import uuid

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from dependencies import DBSession, TenantID
from models import Customer
from schemas import CustomerCreate, CustomerRead

router = APIRouter(prefix="/customers", tags=["customers"])


@router.post("", response_model=CustomerRead, status_code=status.HTTP_201_CREATED)
async def create_customer(
    body: CustomerCreate,
    tenant_id: TenantID,
    session: DBSession,
) -> Customer:
    customer = Customer(
        tenant_id=tenant_id,
        name=body.name,
        email=body.email,
        phone=body.phone,
    )
    session.add(customer)
    await session.commit()
    await session.refresh(customer)
    return customer


@router.get("", response_model=list[CustomerRead])
async def list_customers(
    tenant_id: TenantID,
    session: DBSession,
    limit: int = 50,
    offset: int = 0,
) -> list[Customer]:
    stmt = (
        select(Customer)
        .where(Customer.tenant_id == tenant_id)
        .order_by(Customer.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    result = await session.execute(stmt)
    return list(result.scalars().all())


@router.get("/{customer_id}", response_model=CustomerRead)
async def get_customer(
    customer_id: uuid.UUID,
    tenant_id: TenantID,
    session: DBSession,
) -> Customer:
    stmt = select(Customer).where(
        Customer.id == customer_id, Customer.tenant_id == tenant_id
    )
    result = await session.execute(stmt)
    customer = result.scalar_one_or_none()
    if customer is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")
    return customer


@router.put("/{customer_id}", response_model=CustomerRead)
async def update_customer(
    customer_id: uuid.UUID,
    body: CustomerCreate,
    tenant_id: TenantID,
    session: DBSession,
) -> Customer:
    stmt = select(Customer).where(
        Customer.id == customer_id, Customer.tenant_id == tenant_id
    )
    result = await session.execute(stmt)
    customer = result.scalar_one_or_none()
    if customer is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")
    customer.name = body.name
    customer.email = body.email
    customer.phone = body.phone
    await session.commit()
    await session.refresh(customer)
    return customer


@router.delete("/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_customer(
    customer_id: uuid.UUID,
    tenant_id: TenantID,
    session: DBSession,
) -> None:
    stmt = select(Customer).where(
        Customer.id == customer_id, Customer.tenant_id == tenant_id
    )
    result = await session.execute(stmt)
    customer = result.scalar_one_or_none()
    if customer is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")
    await session.delete(customer)
    await session.commit()
