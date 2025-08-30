"""
Test result model for Open Bench.
"""
from datetime import datetime
from typing import Dict, Any, Optional
from uuid import uuid4

from sqlalchemy import Boolean, DateTime, String, Integer, Numeric, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.core.database import Base


class TestResult(Base):
    """Individual test result for a model evaluation."""
    
    __tablename__ = "test_results"
    
    # Primary key
    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        primary_key=True,
        default=lambda: str(uuid4()),
        index=True
    )
    
    # Foreign keys
    test_case_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), 
        ForeignKey("test_cases.id"), 
        index=True
    )
    model_id: Mapped[str] = mapped_column(UUID(as_uuid=False), index=True)
    execution_id: Mapped[str] = mapped_column(UUID(as_uuid=False), index=True)
    
    # Execution metadata
    provider_request_id: Mapped[Optional[str]] = mapped_column(String(255))
    
    # Model response
    raw_output: Mapped[Optional[str]] = mapped_column()
    parsed_output: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSONB)
    
    # Evaluation results
    is_correct: Mapped[Optional[bool]] = mapped_column(Boolean, index=True)
    accuracy_score: Mapped[Optional[float]] = mapped_column(Numeric(5, 4))  # 0.0 to 1.0
    evaluation_details: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSONB)
    
    # Performance metrics
    latency_ms: Mapped[Optional[int]] = mapped_column(Integer)
    input_tokens: Mapped[Optional[int]] = mapped_column(Integer)
    output_tokens: Mapped[Optional[int]] = mapped_column(Integer)
    total_tokens: Mapped[Optional[int]] = mapped_column(Integer)
    
    # Cost calculation
    input_cost: Mapped[Optional[float]] = mapped_column(Numeric(10, 6))
    output_cost: Mapped[Optional[float]] = mapped_column(Numeric(10, 6))
    total_cost: Mapped[Optional[float]] = mapped_column(Numeric(10, 6))
    
    # Error handling
    status: Mapped[str] = mapped_column(String(20), default="completed", index=True)  # completed, failed, timeout
    error_message: Mapped[Optional[str]] = mapped_column(String(1000))
    error_type: Mapped[Optional[str]] = mapped_column(String(100))
    
    # Timestamps
    executed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        index=True
    )
    
    def __repr__(self) -> str:
        return f"<TestResult(id={self.id}, test_case_id={self.test_case_id}, model_id={self.model_id}, is_correct={self.is_correct})>"
    
    @property
    def tokens_per_second(self) -> Optional[float]:
        """Calculate tokens per second throughput."""
        if not self.total_tokens or not self.latency_ms:
            return None
        return (self.total_tokens / self.latency_ms) * 1000
