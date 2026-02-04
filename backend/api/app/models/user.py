from typing import TYPE_CHECKING
from fastapi_users.db import SQLAlchemyBaseUserTable
from sqlalchemy import Integer, Boolean, String
from sqlalchemy.orm import mapped_column, Mapped

from app.core.database import Base


if TYPE_CHECKING:
    from app.models.user import User


class User(SQLAlchemyBaseUserTable[int], Base):
    __tablename__ = "auth_user"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
