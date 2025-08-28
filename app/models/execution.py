"""
Execution tracking model for Open Bench.
"""
from datetime import datetime
from typing import Dict, Any, Optional, List
from uuid import uuid4

from sqlalchemy import DateTime, String, Integer, Numeric
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.core.database import Base


class Execution(Base):
    """Batch execution tracking for test runs."""
    
    __tablename__ = "executions"
    
    # Primary key
    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        primary_key=True,
        default=lambda: str(uuid4()),
        index=True
    )
    
    # Execution metadata
    test_case_id: Mapped[str] = mapped_column(UUID(as_uuid=False), index=True)
    created_by: Mapped[str] = mapped_column(UUID(as_uuid=False), index=True)
    
    # Execution configuration
    model_ids: Mapped[List[str]] = mapped_column(JSONB)  # Models to evaluate
    execution_config: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSONB)
    
    # Status tracking
    status: Mapped[str] = mapped_column(String(20), default="pending", index=True)  # pending, running, completed, failed
    progress: Mapped[int] = mapped_column(Integer, default=0)  # Number of completed evaluations
    total_evaluations: Mapped[int] = mapped_column(Integer, default=0)
    
    # Results summary
    successful_evaluations: Mapped[int] = mapped_column(Integer, default=0)
    failed_evaluations: Mapped[int] = mapped_column(Integer, default=0)
    avg_accuracy: Mapped[Optional[float]] = mapped_column(Numeric(5, 4))
    avg_latency_ms: Mapped[Optional[float]] = mapped_column(Numeric(10, 2))
    
    # Error tracking
    error_message: Mapped[Optional[str]] = mapped_column(String(1000))
    error_details: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSONB)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        index=True
    )
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    
    def __repr__(self) -> str:
        return f"<Execution(id={self.id}, test_case_id={self.test_case_id}, status={self.status})>"
    
    @property
    def duration_seconds(self) -> Optional[float]:
        """Calculate execution duration in seconds."""
        if not self.started_at:
            return None
        
        end_time = self.completed_at or datetime.utcnow()
        return (end_time - self.started_at).total_seconds()
    
    @property
    def progress_percentage(self) -> float:
        """Calculate progress as percentage."""
        if self.total_evaluations == 0:
            return 0.0
        return (self.progress / self.total_evaluations) * 100
