"""
Test result schemas.
"""
from datetime import datetime
from typing import Any, Dict, Optional
from pydantic import BaseModel, ConfigDict


class TestResultResponse(BaseModel):
    """Schema for test result response."""
    id: str
    test_case_id: str
    model_id: str
    execution_id: str
    
    provider_request_id: Optional[str] = None
    
    raw_output: Optional[str] = None
    parsed_output: Optional[Dict[str, Any]] = None
    
    is_correct: Optional[bool] = None
    accuracy_score: Optional[float] = None
    evaluation_details: Optional[Dict[str, Any]] = None
    
    latency_ms: Optional[int] = None
    input_tokens: Optional[int] = None
    output_tokens: Optional[int] = None
    total_tokens: Optional[int] = None
    
    input_cost: Optional[float] = None
    output_cost: Optional[float] = None
    total_cost: Optional[float] = None
    
    status: str
    error_message: Optional[str] = None
    error_type: Optional[str] = None
    
    executed_at: datetime
    
    model_config = ConfigDict(
        from_attributes=True,
        protected_namespaces=()
    )
