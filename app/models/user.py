"""
User model for Open Bench.
"""
from datetime import datetime
from typing import Optional
from uuid import uuid4

from sqlalchemy import Boolean, DateTime, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.core.database import Base


class User(Base):
    """User model for authentication and authorization."""
    
    __tablename__ = "users"
    
    # Primary key
    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        primary_key=True,
        default=lambda: str(uuid4()),
        index=True
    )
    
    # Authentication fields (from Supabase)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    supabase_user_id: Mapped[Optional[str]] = mapped_column(String(255), unique=True, index=True)
    
    # Profile information
    full_name: Mapped[Optional[str]] = mapped_column(String(255))
    avatar_url: Mapped[Optional[str]] = mapped_column(Text)
    
    # Account settings
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False)
    tier: Mapped[str] = mapped_column(String(50), default="free")  # free, pro, enterprise
    
    # Rate limiting
    api_calls_today: Mapped[int] = mapped_column(default=0)
    last_api_call: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        index=True
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )
    
    def __repr__(self) -> str:
        return f"<User(id={self.id}, email={self.email})>"
    
    @property
    def rate_limit(self) -> int:
        """Get rate limit based on user tier."""
        limits = {
            "free": 10,
            "pro": 100,
            "enterprise": 1000,
        }
        return limits.get(self.tier, 10)
