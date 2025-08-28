"""
User schemas.
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr


class UserResponse(BaseModel):
    """Schema for user response."""
    id: str
    email: EmailStr
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    
    is_active: bool
    is_admin: bool
    tier: str
    
    created_at: datetime
    
    class Config:
        from_attributes = True
