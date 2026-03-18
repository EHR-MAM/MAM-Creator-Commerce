from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import timedelta

from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token
from app.core.config import settings
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse, UserMe

router = APIRouter()

# Simple in-memory refresh token store for pilot
# In production: store hashed refresh tokens in DB
_refresh_tokens: dict[str, str] = {}


@router.post("/register", status_code=201)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    if result.scalar_one_or_none():
        from fastapi import HTTPException
        raise HTTPException(status_code=409, detail="Email already registered")
    user = User(
        name=body.name,
        email=body.email,
        role=body.role,
        hashed_password=hash_password(body.password),
        status="active",
    )
    db.add(user)
    await db.flush()

    # Auto-create influencer record for influencer role
    if body.role == "influencer":
        from app.models.influencer import Influencer
        handle = body.email.split("@")[0].replace(".", "_")
        influencer = Influencer(user_id=user.id, handle=handle)
        db.add(influencer)

    await db.commit()
    await db.refresh(user)
    return {"id": str(user.id), "email": user.email, "role": user.role}


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    if user.status != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is not active",
        )

    access_token = create_access_token(str(user.id))
    refresh_token = create_access_token(
        str(user.id),
        expires_delta=timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )
    _refresh_tokens[refresh_token] = str(user.id)

    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/refresh", response_model=TokenResponse)
async def refresh(body: dict, db: AsyncSession = Depends(get_db)):
    token = body.get("refresh_token")
    user_id = _refresh_tokens.get(token)
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    # Rotate: invalidate old, issue new
    del _refresh_tokens[token]
    new_access = create_access_token(user_id)
    new_refresh = create_access_token(
        user_id,
        expires_delta=timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )
    _refresh_tokens[new_refresh] = user_id
    return TokenResponse(access_token=new_access, refresh_token=new_refresh)


@router.post("/logout")
async def logout(body: dict):
    token = body.get("refresh_token")
    _refresh_tokens.pop(token, None)
    return {"message": "Logged out"}


@router.get("/me", response_model=UserMe)
async def me(current_user: User = Depends(get_current_user)):
    return UserMe(id=str(current_user.id), role=current_user.role, name=current_user.name, email=current_user.email, status=current_user.status)
