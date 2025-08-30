"""
Test case model for Open Bench.
"""
from datetime import datetime
from typing import Dict, Any, Optional
from uuid import uuid4

from sqlalchemy import Boolean, DateTime, String, Text, Integer
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .test_result import TestResult

from app.core.database import Base


class TestCase(Base):
    """Test case definition with schema and expected output."""
    
    __tablename__ = "test_cases"
    
    # Primary key
    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        primary_key=True,
        default=lambda: str(uuid4()),
        index=True
    )
    
    # Test identification
    title: Mapped[str] = mapped_column(String(255), index=True)
    description: Mapped[Optional[str]] = mapped_column(Text)
    category: Mapped[str] = mapped_column(String(100), index=True)
    tags: Mapped[Optional[list]] = mapped_column(JSONB)
    
    # Test definition
    prompt: Mapped[str] = mapped_column(Text)
    system_prompt: Mapped[Optional[str]] = mapped_column(Text)
    expected_output: Mapped[Dict[str, Any]] = mapped_column(JSONB)
    output_schema: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSONB)
    
    # Evaluation configuration
    evaluation_type: Mapped[str] = mapped_column(String(50), default="exact_match")  # exact_match, structured_match, llm_judge
    evaluation_config: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSONB)
    timeout_seconds: Mapped[int] = mapped_column(Integer, default=30)
    
    # Test metadata
    difficulty: Mapped[str] = mapped_column(String(20), default="medium")  # easy, medium, hard
    language: Mapped[str] = mapped_column(String(10), default="en")
    
    # Ownership and visibility
    created_by: Mapped[str] = mapped_column(UUID(as_uuid=False), index=True)
    is_public: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    is_approved: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    approved_by: Mapped[Optional[str]] = mapped_column(UUID(as_uuid=False))
    approved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    
    # Statistics
    total_runs: Mapped[int] = mapped_column(Integer, default=0)
    avg_accuracy: Mapped[Optional[float]] = mapped_column()
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        index=True
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )
    
    # Relationships
    results: Mapped[list["TestResult"]] = relationship(
        "TestResult",
        foreign_keys="TestResult.test_case_id",
        primaryjoin="TestCase.id == TestResult.test_case_id",
        back_populates=None
    )
    
    def __repr__(self) -> str:
        return f"<TestCase(id={self.id}, title={self.title}, category={self.category})>"
