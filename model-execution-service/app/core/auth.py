"""
Authentication middleware for Model Execution Service
"""
from typing import Optional

import structlog
from fastapi import HTTPException, Security, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.core.config import settings

logger = structlog.get_logger(__name__)

# Security scheme
security = HTTPBearer()


def verify_api_key(credentials: HTTPAuthorizationCredentials = Security(security)) -> str:
    """
    Verify API key from Authorization header.
    
    Args:
        credentials: HTTPAuthorizationCredentials from FastAPI
        
    Returns:
        str: The API key if valid
        
    Raises:
        HTTPException: If API key is invalid
    """
    if not credentials:
        logger.warning("Missing authorization header")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if credentials.credentials != settings.api_key:
        logger.warning("Invalid API key", key_prefix=credentials.credentials[:8])
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return credentials.credentials


def verify_api_key_header(x_api_key: Optional[str] = None) -> str:
    """
    Alternative verification using X-API-Key header.
    
    Args:
        x_api_key: API key from X-API-Key header
        
    Returns:
        str: The API key if valid
        
    Raises:
        HTTPException: If API key is invalid
    """
    if not x_api_key:
        logger.warning("Missing X-API-Key header")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing X-API-Key header",
        )
    
    if x_api_key != settings.api_key:
        logger.warning("Invalid API key in X-API-Key header", key_prefix=x_api_key[:8])
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key",
        )
    
    return x_api_key
