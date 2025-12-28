from fastapi_users.db import SQLAlchemyBaseUserTable

from app.core.database import Base


class User(SQLAlchemyBaseUserTable[int], Base):
    __tablename__ = "auth_user"
