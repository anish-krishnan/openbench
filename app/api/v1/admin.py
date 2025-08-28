"""
Admin API endpoints.
"""
from typing import List

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
import structlog

from app.core.database import get_db_session
from app.core.exceptions import NotFoundException
from app.models import TestCase
from app.schemas import TestCaseResponse, PaginatedResponse, StandardResponse
from app.schemas.common import PaginationMeta, ResponseMeta
from app.api.dependencies import get_current_admin_user

router = APIRouter()
logger = structlog.get_logger(__name__)


@router.get("/pending", response_model=PaginatedResponse[TestCaseResponse])
async def get_pending_tests(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(20, ge=1, le=100, description="Page size"),
    current_admin: dict = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db_session),
):
    """Get tests awaiting approval."""
    query = select(TestCase).where(
        and_(
            TestCase.is_public == True,
            TestCase.is_approved == False,
        )
    )
    
    # Count total
    count_result = await db.execute(query)
    total = len(count_result.scalars().all())
    
    # Apply pagination
    offset = (page - 1) * size
    query = query.offset(offset).limit(size).order_by(TestCase.created_at.desc())
    
    result = await db.execute(query)
    test_cases = result.scalars().all()
    
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
    
    response_data = [TestCaseResponse.model_validate(tc) for tc in test_cases]
    
    return PaginatedResponse(
        data=response_data,
        meta=ResponseMeta(pagination=pagination_meta),
    )


@router.post("/approve", response_model=StandardResponse[dict])
async def approve_tests(
    test_ids: List[str],
    action: str = Query(..., description="Action: approve or reject"),
    notes: str = Query(None, description="Moderation notes"),
    current_admin: dict = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db_session),
):
    """Approve or reject tests in bulk."""
    if action not in ["approve", "reject"]:
        raise ValueError("Action must be 'approve' or 'reject'")
    
    updated_count = 0
    
    for test_id in test_ids:
        result = await db.execute(select(TestCase).where(TestCase.id == test_id))
        test_case = result.scalar_one_or_none()
        
        if test_case:
            if action == "approve":
                test_case.is_approved = True
                test_case.approved_by = current_admin["id"]
            else:
                test_case.is_public = False  # Reject by making private
            
            updated_count += 1
    
    await db.commit()
    
    logger.info(
        "Bulk test moderation",
        action=action,
        count=updated_count,
        admin_id=current_admin["id"],
        notes=notes,
    )
    
    return StandardResponse(
        data={
            "action": action,
            "updated_count": updated_count,
            "notes": notes,
        }
    )


@router.get("/stats", response_model=StandardResponse[dict])
async def get_admin_stats(
    current_admin: dict = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db_session),
):
    """Get system health and usage statistics."""
    # TODO: Implement comprehensive admin statistics
    # This would include:
    # - System health metrics
    # - Usage statistics
    # - Error rates
    # - Provider status
    # - Database metrics
    
    stats = {
        "system_health": "healthy",
        "pending_approvals": 0,  # TODO: Calculate actual count
        "total_tests": 0,  # TODO: Calculate actual count
        "total_evaluations": 0,  # TODO: Calculate actual count
        "active_users": 0,  # TODO: Calculate actual count
    }
    
    return StandardResponse(data=stats)
