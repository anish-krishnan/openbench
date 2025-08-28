"""
Benchmark and leaderboard API endpoints.
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
import structlog

from app.core.database import get_db_session
from app.schemas import StandardResponse, PaginatedResponse
from app.schemas.common import ResponseMeta
from app.services.analytics import AnalyticsService

router = APIRouter()
logger = structlog.get_logger(__name__)


@router.get("/leaderboard", response_model=StandardResponse[dict])
async def get_leaderboard(
    category: Optional[str] = Query(None, description="Filter by category"),
    timeframe: str = Query("30d", description="Timeframe (7d, 30d, 90d, all)"),
    min_tests: int = Query(10, ge=1, description="Minimum number of tests"),
    limit: int = Query(50, ge=1, le=100, description="Number of models to return"),
    analytics_service: AnalyticsService = Depends(),
):
    """Get global leaderboard rankings."""
    leaderboard_data = await analytics_service.get_leaderboard(
        category=category,
        timeframe=timeframe,
        min_tests=min_tests,
        limit=limit,
    )
    
    return StandardResponse(data=leaderboard_data)


@router.get("/compare", response_model=StandardResponse[dict])
async def compare_models(
    model_ids: List[str] = Query(..., description="Model IDs to compare (2-5 models)"),
    category: Optional[str] = Query(None, description="Filter by category"),
    analytics_service: AnalyticsService = Depends(),
):
    """Compare multiple models head-to-head."""
    if len(model_ids) < 2 or len(model_ids) > 5:
        raise ValueError("Must compare between 2 and 5 models")
    
    comparison_data = await analytics_service.compare_models(
        model_ids=model_ids,
        category=category,
    )
    
    return StandardResponse(data=comparison_data)


@router.get("/analytics/trends", response_model=StandardResponse[dict])
async def get_analytics_trends(
    metric: str = Query("accuracy", description="Metric to analyze (accuracy, latency, cost)"),
    timeframe: str = Query("30d", description="Timeframe for trends"),
    category: Optional[str] = Query(None, description="Filter by category"),
    model_ids: Optional[List[str]] = Query(None, description="Filter by specific models"),
    format: str = Query("json", description="Export format (json, csv)"),
    analytics_service: AnalyticsService = Depends(),
):
    """Get historical performance trends."""
    trends_data = await analytics_service.get_trends(
        metric=metric,
        timeframe=timeframe,
        category=category,
        model_ids=model_ids,
    )
    
    # TODO: Handle CSV export format
    if format == "csv":
        # Would return CSV response
        pass
    
    return StandardResponse(data=trends_data)


@router.get("/categories", response_model=StandardResponse[List[dict]])
async def get_categories(
    db: AsyncSession = Depends(get_db_session),
    analytics_service: AnalyticsService = Depends(),
):
    """Get available test categories with statistics."""
    categories_data = await analytics_service.get_categories()
    
    return StandardResponse(data=categories_data)


@router.get("/stats", response_model=StandardResponse[dict])
async def get_platform_stats(
    analytics_service: AnalyticsService = Depends(),
):
    """Get overall platform statistics."""
    stats_data = await analytics_service.get_platform_stats()
    
    return StandardResponse(data=stats_data)
