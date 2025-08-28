"""
Test management API endpoints.
"""
from typing import List, Optional
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload
import structlog

from app.core.database import get_db_session
from app.core.exceptions import NotFoundException, ValidationException
from app.models import TestCase, TestResult, Execution
from app.schemas import (
    TestCaseCreate,
    TestCaseResponse,
    TestCaseUpdate,
    TestResultResponse,
    ExecutionCreate,
    ExecutionResponse,
    PaginatedResponse,
    StandardResponse,
    PaginationMeta,
    ResponseMeta,
)
from app.services.evaluation import EvaluationService
from app.api.dependencies import get_current_user, get_current_admin_user

router = APIRouter()
logger = structlog.get_logger(__name__)


@router.post("", response_model=StandardResponse[TestCaseResponse])
async def create_test_case(
    test_case: TestCaseCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
):
    """Create a new test case."""
    try:
        # Create test case record
        db_test_case = TestCase(
            id=str(uuid4()),
            created_by=current_user["id"],
            **test_case.model_dump(),
        )
        
        db.add(db_test_case)
        await db.commit()
        await db.refresh(db_test_case)
        
        logger.info(
            "Test case created",
            test_case_id=db_test_case.id,
            user_id=current_user["id"],
            title=test_case.title,
        )
        
        return StandardResponse(data=TestCaseResponse.model_validate(db_test_case))
        
    except Exception as e:
        await db.rollback()
        logger.error("Failed to create test case", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to create test case")


@router.get("/{test_id}", response_model=StandardResponse[TestCaseResponse])
async def get_test_case(
    test_id: str,
    include_results: bool = Query(False, description="Include recent results"),
    db: AsyncSession = Depends(get_db_session),
):
    """Get test case by ID."""
    query = select(TestCase).where(TestCase.id == test_id)
    
    if include_results:
        query = query.options(selectinload(TestCase.results))
    
    result = await db.execute(query)
    test_case = result.scalar_one_or_none()
    
    if not test_case:
        raise NotFoundException(f"Test case {test_id} not found", "TestCase")
    
    # Check if user can access this test case
    # TODO: Implement proper authorization logic
    
    return StandardResponse(data=TestCaseResponse.model_validate(test_case))


@router.put("/{test_id}", response_model=StandardResponse[TestCaseResponse])
async def update_test_case(
    test_id: str,
    test_case_update: TestCaseUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
):
    """Update test case."""
    result = await db.execute(select(TestCase).where(TestCase.id == test_id))
    test_case = result.scalar_one_or_none()
    
    if not test_case:
        raise NotFoundException(f"Test case {test_id} not found", "TestCase")
    
    # Check if user owns this test case or is admin
    if test_case.created_by != current_user["id"] and not current_user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Not authorized to update this test case")
    
    # Update fields
    update_data = test_case_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(test_case, field, value)
    
    await db.commit()
    await db.refresh(test_case)
    
    logger.info("Test case updated", test_case_id=test_id, user_id=current_user["id"])
    
    return StandardResponse(data=TestCaseResponse.model_validate(test_case))


@router.post("/{test_id}/run", response_model=StandardResponse[ExecutionResponse])
async def run_test_case(
    test_id: str,
    execution: ExecutionCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
    evaluation_service: EvaluationService = Depends(),
):
    """Run test case on specified models."""
    # Verify test case exists
    result = await db.execute(select(TestCase).where(TestCase.id == test_id))
    test_case = result.scalar_one_or_none()
    
    if not test_case:
        raise NotFoundException(f"Test case {test_id} not found", "TestCase")
    
    # Create execution record
    db_execution = Execution(
        id=str(uuid4()),
        test_case_id=test_id,
        created_by=current_user["id"],
        model_ids=execution.model_ids,
        execution_config=execution.execution_config,
        total_evaluations=len(execution.model_ids),
        status="pending",
    )
    
    db.add(db_execution)
    await db.commit()
    await db.refresh(db_execution)
    
    # Start async evaluation
    await evaluation_service.run_evaluation(db_execution.id)
    
    logger.info(
        "Test execution started",
        execution_id=db_execution.id,
        test_case_id=test_id,
        model_count=len(execution.model_ids),
    )
    
    return StandardResponse(data=ExecutionResponse.model_validate(db_execution))


@router.get("/{test_id}/results", response_model=PaginatedResponse[TestResultResponse])
async def get_test_results(
    test_id: str,
    execution_id: Optional[str] = Query(None, description="Filter by execution ID"),
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(20, ge=1, le=100, description="Page size"),
    db: AsyncSession = Depends(get_db_session),
):
    """Get test results with pagination."""
    # Build query
    query = select(TestResult).where(TestResult.test_case_id == test_id)
    
    if execution_id:
        query = query.where(TestResult.execution_id == execution_id)
    
    # Count total results
    count_query = select(TestResult).where(TestResult.test_case_id == test_id)
    if execution_id:
        count_query = count_query.where(TestResult.execution_id == execution_id)
    
    total_result = await db.execute(count_query)
    total = len(total_result.scalars().all())
    
    # Apply pagination
    offset = (page - 1) * size
    query = query.offset(offset).limit(size).order_by(TestResult.executed_at.desc())
    
    result = await db.execute(query)
    results = result.scalars().all()
    
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
    
    response_data = [TestResultResponse.model_validate(r) for r in results]
    
    return PaginatedResponse(
        data=response_data,
        meta=ResponseMeta(pagination=pagination_meta),
    )


@router.get("", response_model=PaginatedResponse[TestCaseResponse])
async def list_test_cases(
    category: Optional[str] = Query(None, description="Filter by category"),
    is_public: Optional[bool] = Query(None, description="Filter by public status"),
    is_approved: Optional[bool] = Query(None, description="Filter by approval status"),
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(20, ge=1, le=100, description="Page size"),
    db: AsyncSession = Depends(get_db_session),
):
    """List test cases with filtering and pagination."""
    query = select(TestCase)
    
    # Apply filters
    filters = []
    if category:
        filters.append(TestCase.category == category)
    if is_public is not None:
        filters.append(TestCase.is_public == is_public)
    if is_approved is not None:
        filters.append(TestCase.is_approved == is_approved)
    
    if filters:
        query = query.where(and_(*filters))
    
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
