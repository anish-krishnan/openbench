"""
Common schemas used across the API.
"""
from typing import Any, Dict, Generic, List, Optional, TypeVar
from pydantic import BaseModel, Field

T = TypeVar('T')


class ErrorDetail(BaseModel):
    """Error detail model."""
    code: str
    message: str
    details: Optional[Dict[str, Any]] = None
    request_id: Optional[str] = None


class ErrorResponse(BaseModel):
    """Standard error response format."""
    error: ErrorDetail


class PaginationMeta(BaseModel):
    """Pagination metadata."""
    page: int = Field(..., ge=1, description="Current page number")
    size: int = Field(..., ge=1, le=100, description="Page size")
    total: int = Field(..., ge=0, description="Total number of items")
    pages: int = Field(..., ge=0, description="Total number of pages")
    has_next: bool = Field(..., description="Whether there are more pages")
    has_prev: bool = Field(..., description="Whether there are previous pages")


class CacheMeta(BaseModel):
    """Cache metadata."""
    hit: bool = Field(..., description="Whether this was a cache hit")
    ttl: Optional[int] = Field(None, description="Time to live in seconds")


class ResponseMeta(BaseModel):
    """Response metadata."""
    pagination: Optional[PaginationMeta] = None
    cache: Optional[CacheMeta] = None


class PaginatedResponse(BaseModel, Generic[T]):
    """Generic paginated response."""
    data: List[T]
    meta: ResponseMeta


class StandardResponse(BaseModel, Generic[T]):
    """Standard API response format."""
    data: T
    meta: ResponseMeta = Field(default_factory=ResponseMeta)
    errors: List[str] = Field(default_factory=list)
