from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.routes import auth, products, vendors, influencers, campaigns, orders, commissions, payouts, analytics, tracking, payments, reviews, uploads

app = FastAPI(
    title="EHR Creator Commerce API",
    version="0.1.0",
    description="Africa-first creator-commerce platform API",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(products.router, prefix="/products", tags=["products"])
app.include_router(vendors.router, prefix="/vendors", tags=["vendors"])
app.include_router(influencers.router, prefix="/influencers", tags=["influencers"])
app.include_router(campaigns.router, prefix="/campaigns", tags=["campaigns"])
app.include_router(orders.router, prefix="/orders", tags=["orders"])
app.include_router(commissions.router, prefix="/commissions", tags=["commissions"])
app.include_router(payouts.router, prefix="/payouts", tags=["payouts"])
app.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
app.include_router(tracking.router, prefix="/tracking", tags=["tracking"])
app.include_router(payments.router, prefix="/payments", tags=["payments"])
app.include_router(reviews.router)  # prefix=/products already set in router
app.include_router(uploads.router)  # prefix=/uploads set in router


@app.get("/health")
def health_check():
    return {"status": "ok", "version": "0.1.0"}
