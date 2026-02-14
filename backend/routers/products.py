import uuid

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from dependencies import DBSession, TenantID
from models import Product
from schemas import ProductCreate, ProductRead

router = APIRouter(prefix="/products", tags=["products"])


@router.post("", response_model=ProductRead, status_code=status.HTTP_201_CREATED)
async def create_product(
    body: ProductCreate,
    tenant_id: TenantID,
    session: DBSession,
) -> Product:
    # Check for duplicate SKU within tenant
    existing = await session.execute(
        select(Product).where(
            Product.tenant_id == tenant_id, Product.sku == body.sku
        )
    )
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Product with SKU '{body.sku}' already exists for this tenant",
        )
    product = Product(
        tenant_id=tenant_id,
        name=body.name,
        sku=body.sku,
        price=body.price,
    )
    session.add(product)
    await session.commit()
    await session.refresh(product)
    return product


@router.get("", response_model=list[ProductRead])
async def list_products(
    tenant_id: TenantID,
    session: DBSession,
    limit: int = 50,
    offset: int = 0,
) -> list[Product]:
    stmt = (
        select(Product)
        .where(Product.tenant_id == tenant_id)
        .order_by(Product.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    result = await session.execute(stmt)
    return list(result.scalars().all())


@router.get("/{product_id}", response_model=ProductRead)
async def get_product(
    product_id: uuid.UUID,
    tenant_id: TenantID,
    session: DBSession,
) -> Product:
    stmt = select(Product).where(
        Product.id == product_id, Product.tenant_id == tenant_id
    )
    result = await session.execute(stmt)
    product = result.scalar_one_or_none()
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return product


@router.put("/{product_id}", response_model=ProductRead)
async def update_product(
    product_id: uuid.UUID,
    body: ProductCreate,
    tenant_id: TenantID,
    session: DBSession,
) -> Product:
    stmt = select(Product).where(
        Product.id == product_id, Product.tenant_id == tenant_id
    )
    result = await session.execute(stmt)
    product = result.scalar_one_or_none()
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    # Check SKU uniqueness if changing
    if body.sku != product.sku:
        dup = await session.execute(
            select(Product).where(
                Product.tenant_id == tenant_id, Product.sku == body.sku
            )
        )
        if dup.scalar_one_or_none() is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Product with SKU '{body.sku}' already exists for this tenant",
            )
    product.name = body.name
    product.sku = body.sku
    product.price = body.price
    await session.commit()
    await session.refresh(product)
    return product


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: uuid.UUID,
    tenant_id: TenantID,
    session: DBSession,
) -> None:
    stmt = select(Product).where(
        Product.id == product_id, Product.tenant_id == tenant_id
    )
    result = await session.execute(stmt)
    product = result.scalar_one_or_none()
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    await session.delete(product)
    await session.commit()
