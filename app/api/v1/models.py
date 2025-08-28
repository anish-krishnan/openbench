"""
Model management API endpoints.
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
import structlog

from app.core.database import get_db_session
from app.core.exceptions import NotFoundException
from app.models import Model
from app.schemas import ModelResponse, ModelPerformanceResponse, PaginatedResponse, StandardResponse
from app.schemas.common import PaginationMeta, ResponseMeta
from app.services.analytics import AnalyticsService
from app.api.dependencies import get_current_admin_user

router = APIRouter()
logger = structlog.get_logger(__name__)


@router.get("", response_model=PaginatedResponse[ModelResponse])
async def list_models(
    provider: Optional[str] = Query(None, description="Filter by provider"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    supports_structured_output: Optional[bool] = Query(None, description="Filter by structured output support"),
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(50, ge=1, le=100, description="Page size"),
    db: AsyncSession = Depends(get_db_session),
):
    """List available models with filtering."""
    query = select(Model)
    
    # Apply filters
    filters = []
    if provider:
        filters.append(Model.provider == provider)
    if is_active is not None:
        filters.append(Model.is_active == is_active)
    if supports_structured_output is not None:
        filters.append(Model.supports_structured_output == supports_structured_output)
    
    if filters:
        query = query.where(and_(*filters))
    
    # Count total
    count_result = await db.execute(query)
    total = len(count_result.scalars().all())
    
    # Apply pagination
    offset = (page - 1) * size
    query = query.offset(offset).limit(size).order_by(Model.provider, Model.name)
    
    result = await db.execute(query)
    models = result.scalars().all()
    
    # Calculate pagination metadata
    total_pages = (total + size - 1) // size
    pagination_meta = PaginationMeta(
        page=page,
        size=size,
        total=total,
        pages=total_pages,
        has_next=page < total_pages,
        has_prev=page > 1,
    )
    
    response_data = [ModelResponse.model_validate(m) for m in models]
    
    return PaginatedResponse(
        data=response_data,
        meta=ResponseMeta(pagination=pagination_meta),
    )


@router.get("/{model_id}", response_model=StandardResponse[ModelResponse])
async def get_model(
    model_id: str,
    db: AsyncSession = Depends(get_db_session),
):
    """Get model by ID."""
    result = await db.execute(select(Model).where(Model.id == model_id))
    model = result.scalar_one_or_none()
    
    if not model:
        raise NotFoundException(f"Model {model_id} not found", "Model")
    
    return StandardResponse(data=ModelResponse.model_validate(model))


@router.get("/{model_id}/performance", response_model=StandardResponse[ModelPerformanceResponse])
async def get_model_performance(
    model_id: str,
    category: Optional[str] = Query(None, description="Filter by category"),
    days: int = Query(30, ge=1, le=365, description="Days to look back"),
    db: AsyncSession = Depends(get_db_session),
    analytics_service: AnalyticsService = Depends(),
):
    """Get detailed performance metrics for a model."""
    # Verify model exists
    result = await db.execute(select(Model).where(Model.id == model_id))
    model = result.scalar_one_or_none()
    
    if not model:
        raise NotFoundException(f"Model {model_id} not found", "Model")
    
    # Get performance data
    performance_data = await analytics_service.get_model_performance(
        model_id=model_id,
        category=category,
        days=days,
    )
    
    return StandardResponse(data=performance_data)


@router.post("/register", response_model=StandardResponse[ModelResponse])
async def register_model(
    model_data: dict,  # TODO: Create proper schema
    current_admin: dict = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db_session),
):
    """Register a new model (Admin only)."""
    # TODO: Implement model registration logic
    # This would include:
    # 1. Validate model data
    # 2. Test API credentials
    # 3. Verify basic functionality
    # 4. Create model record
    
    logger.info("Model registration requested", admin_id=current_admin["id"])
    
    # Placeholder response
    return StandardResponse(data={"message": "Model registration not implemented yet"})


@router.get("/providers/health", response_model=StandardResponse[dict])
async def get_provider_health():
    """Get health status of all providers."""
    from app.providers.factory import ProviderFactory
    
    health_status = await ProviderFactory.health_check_all()
    
    return StandardResponse(data={"provider_health": health_status})
