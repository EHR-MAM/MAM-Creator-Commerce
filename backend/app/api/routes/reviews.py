"""
Sprint XXVIII: Product Reviews API
GET  /products/{product_id}/reviews  - public, list approved reviews
POST /products/{product_id}/reviews  - public, submit a review (auto-approved for pilot)
"""
import uuid
from decimal import Decimal
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import require_admin_or_operator
from app.models.user import User
from app.models.product import Product
from app.models.product_review import ProductReview

router = APIRouter(prefix="/products", tags=["reviews"])


class ReviewIn(BaseModel):
    customer_name: str = Field(..., min_length=2, max_length=100)
    customer_phone: Optional[str] = None  # stored as last-4 only
    rating: int = Field(..., ge=1, le=5)
    headline: Optional[str] = Field(None, max_length=150)
    body: Optional[str] = Field(None, max_length=2000)
    order_id: Optional[uuid.UUID] = None


class ReviewOut(BaseModel):
    id: str
    customer_name: str
    customer_phone_last4: Optional[str]
    rating: int
    headline: Optional[str]
    body: Optional[str]
    created_at: str

    class Config:
        from_attributes = True


@router.get("/{product_id}/reviews", response_model=list[ReviewOut])
async def list_reviews(
    product_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ProductReview)
        .where(
            ProductReview.product_id == product_id,
            ProductReview.status == "approved",
        )
        .order_by(ProductReview.created_at.desc())
        .limit(50)
    )
    reviews = result.scalars().all()
    return [
        ReviewOut(
            id=str(r.id),
            customer_name=r.customer_name,
            customer_phone_last4=r.customer_phone_last4,
            rating=r.rating,
            headline=r.headline,
            body=r.body,
            created_at=r.created_at.isoformat() if r.created_at else "",
        )
        for r in reviews
    ]


@router.post("/{product_id}/reviews", response_model=ReviewOut, status_code=201)
async def submit_review(
    product_id: uuid.UUID,
    body: ReviewIn,
    db: AsyncSession = Depends(get_db),
):
    # Verify product exists
    prod_result = await db.execute(select(Product).where(Product.id == product_id))
    product = prod_result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Store last 4 digits of phone only
    phone_last4 = None
    if body.customer_phone:
        digits = "".join(c for c in body.customer_phone if c.isdigit())
        phone_last4 = digits[-4:] if len(digits) >= 4 else None

    review = ProductReview(
        product_id=product_id,
        order_id=body.order_id,
        customer_name=body.customer_name,
        customer_phone_last4=phone_last4,
        rating=body.rating,
        headline=body.headline,
        body=body.body,
        status="approved",  # auto-approve for pilot
    )
    db.add(review)
    await db.flush()

    # Recalculate product rating + review_count
    stats = await db.execute(
        select(
            func.avg(ProductReview.rating).label("avg_rating"),
            func.count(ProductReview.id).label("total"),
        ).where(
            ProductReview.product_id == product_id,
            ProductReview.status == "approved",
        )
    )
    row = stats.one()
    product.rating = float(row.avg_rating) if row.avg_rating else body.rating
    product.review_count = row.total

    await db.commit()
    await db.refresh(review)

    return ReviewOut(
        id=str(review.id),
        customer_name=review.customer_name,
        customer_phone_last4=review.customer_phone_last4,
        rating=review.rating,
        headline=review.headline,
        body=review.body,
        created_at=review.created_at.isoformat() if review.created_at else "",
    )


# ── Admin endpoints ──────────────────────────────────────────────────────────

@router.get("/reviews/admin", response_model=list[ReviewOut])
async def list_reviews_admin(
    status: str = Query("pending", enum=["pending", "approved", "rejected"]),
    limit: int = 50,
    current_user: User = Depends(require_admin_or_operator),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ProductReview)
        .where(ProductReview.status == status)
        .order_by(ProductReview.created_at.desc())
        .limit(limit)
    )
    reviews = result.scalars().all()
    return [
        ReviewOut(
            id=str(r.id),
            customer_name=r.customer_name,
            customer_phone_last4=r.customer_phone_last4,
            rating=r.rating,
            headline=r.headline,
            body=r.body,
            created_at=r.created_at.isoformat() if r.created_at else "",
        )
        for r in reviews
    ]


@router.patch("/reviews/{review_id}/status")
async def update_review_status(
    review_id: uuid.UUID,
    new_status: str = Query(..., enum=["approved", "rejected", "pending"]),
    current_user: User = Depends(require_admin_or_operator),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(ProductReview).where(ProductReview.id == review_id))
    review = result.scalar_one_or_none()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    old_status = review.status
    review.status = new_status
    await db.flush()

    if old_status != new_status:
        prod_result = await db.execute(select(Product).where(Product.id == review.product_id))
        product = prod_result.scalar_one_or_none()
        if product:
            stats = await db.execute(
                select(
                    func.avg(ProductReview.rating).label("avg_rating"),
                    func.count(ProductReview.id).label("total"),
                ).where(
                    ProductReview.product_id == review.product_id,
                    ProductReview.status == "approved",
                )
            )
            row = stats.one()
            product.rating = float(row.avg_rating) if row.avg_rating else None
            product.review_count = row.total

    await db.commit()
    return {"id": str(review.id), "status": new_status}
