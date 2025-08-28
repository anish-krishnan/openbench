"""
Execution schemas.
"""
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, ConfigDict


class ExecutionCreate(BaseModel):
    """Schema for creating an execution."""
    test_case_id: str
    model_ids: List[str] = Field(..., min_items=1)
    execution_config: Optional[Dict[str, Any]] = None
    
    model_config = ConfigDict(
        protected_namespaces=()
    )


class ExecutionResponse(BaseModel):
    """Schema for execution response."""
    id: str
    test_case_id: str
    created_by: str
    
    model_ids: List[str]
    execution_config: Optional[Dict[str, Any]] = None
    
    status: str
    progress: int
    total_evaluations: int
    
    successful_evaluations: int
    failed_evaluations: int
    avg_accuracy: Optional[float] = None
    avg_latency_ms: Optional[float] = None
    
    error_message: Optional[str] = None
    error_details: Optional[Dict[str, Any]] = None
    
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    
    model_config = ConfigDict(
        from_attributes=True,
        protected_namespaces=()
    )
