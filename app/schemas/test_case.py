"""
Test case schemas.
"""
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class TestCaseBase(BaseModel):
    """Base test case schema."""
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=2000)
    category: str = Field(..., min_length=1, max_length=100)
    tags: Optional[List[str]] = Field(default_factory=list)
    
    prompt: str = Field(..., min_length=1)
    system_prompt: Optional[str] = None
    expected_output: Dict[str, Any]
    output_schema: Optional[Dict[str, Any]] = None
    
    evaluation_type: str = Field(default="exact_match")
    evaluation_config: Optional[Dict[str, Any]] = None
    timeout_seconds: int = Field(default=30, ge=1, le=300)
    
    difficulty: str = Field(default="medium")
    language: str = Field(default="en", max_length=10)


class TestCaseCreate(TestCaseBase):
    """Schema for creating a test case."""
    is_public: bool = Field(default=False)


class TestCaseUpdate(BaseModel):
    """Schema for updating a test case."""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=2000)
    category: Optional[str] = Field(None, min_length=1, max_length=100)
    tags: Optional[List[str]] = None
    
    prompt: Optional[str] = Field(None, min_length=1)
    system_prompt: Optional[str] = None
    expected_output: Optional[Dict[str, Any]] = None
    output_schema: Optional[Dict[str, Any]] = None
    
    evaluation_type: Optional[str] = None
    evaluation_config: Optional[Dict[str, Any]] = None
    timeout_seconds: Optional[int] = Field(None, ge=1, le=300)
    
    difficulty: Optional[str] = None
    language: Optional[str] = Field(None, max_length=10)
    is_public: Optional[bool] = None


class TestCaseResponse(TestCaseBase):
    """Schema for test case response."""
    id: str
    created_by: str
    is_public: bool
    is_approved: bool
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    
    total_runs: int
    avg_accuracy: Optional[float] = None
    
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
