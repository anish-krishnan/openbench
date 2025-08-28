"""
API dependencies for authentication, database, and services.
"""
from typing import Optional
from fastapi import Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import structlog

from app.core.database import get_db_session
from app.core.exceptions import AuthenticationException, AuthorizationException
from app.models import User
from app.services.evaluation import EvaluationService
from app.services.analytics import AnalyticsService
from app.services.validation import ValidationService

logger = structlog.get_logger(__name__)


async def get_current_user(
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    """Get current authenticated user from JWT token."""
    if not authorization:
        raise AuthenticationException("Authorization header required")
    
    if not authorization.startswith("Bearer "):
        raise AuthenticationException("Invalid authorization header format")
    
    token = authorization[7:]  # Remove "Bearer " prefix
    
    try:
        # TODO: Implement JWT token validation with Supabase
        # For now, return a mock user for development
        user_data = {
            "id": "user-123",
            "email": "test@example.com",
            "is_admin": False,
            "tier": "free",
        }
        
        logger.info("User authenticated", user_id=user_data["id"])
        return user_data
        
    except Exception as e:
        logger.warning("Authentication failed", error=str(e))
        raise AuthenticationException("Invalid or expired token")


async def get_current_admin_user(
    current_user: dict = Depends(get_current_user),
) -> dict:
    """Get current user and verify admin privileges."""
    if not current_user.get("is_admin"):
        raise AuthorizationException("Admin privileges required")
    
    return current_user


async def get_optional_user(
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db_session),
) -> Optional[dict]:
    """Get current user if authenticated, otherwise None."""
    if not authorization:
        return None
    
    try:
        return await get_current_user(authorization, db)
    except (AuthenticationException, AuthorizationException):
        return None


def get_evaluation_service() -> EvaluationService:
    """Get evaluation service instance."""
    return EvaluationService()


def get_analytics_service() -> AnalyticsService:
    """Get analytics service instance."""
    return AnalyticsService()


def get_validation_service() -> ValidationService:
    """Get validation service instance."""
    return ValidationService()
