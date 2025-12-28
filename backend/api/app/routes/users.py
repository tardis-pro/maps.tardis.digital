from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.users import current_active_user
from app.models import User
from app.schemas import UserRead, UserUpdate

router = APIRouter(prefix="/api/v1/user-profile", tags=["users"])


@router.get("/", response_model=UserRead)
async def get_user_profile(user: User = Depends(current_active_user)):
    return user


@router.put("/", response_model=UserRead)
async def update_user_profile(
    payload: UserUpdate,
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_db),
):
    for key, value in payload.model_dump(exclude_unset=True).items():
        if hasattr(user, key):
            setattr(user, key, value)
    await db.commit()
    await db.refresh(user)
    return user


@router.patch("/", response_model=UserRead)
async def partial_update_user_profile(
    payload: UserUpdate,
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_db),
):
    for key, value in payload.model_dump(exclude_unset=True).items():
        if hasattr(user, key):
            setattr(user, key, value)
    await db.commit()
    await db.refresh(user)
    return user
