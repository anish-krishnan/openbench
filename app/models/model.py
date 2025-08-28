"""
Model registry for Open Bench.
"""
from datetime import datetime
from typing import Dict, Any, Optional
from uuid import uuid4

from sqlalchemy import Boolean, DateTime, String, Text, Integer, Numeric
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.core.database import Base


class Model(Base):
    """LLM model registry with capabilities and metadata."""
    
    __tablename__ = "models"
    
    # Primary key
    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        primary_key=True,
        default=lambda: str(uuid4()),
        index=True
    )
    
    # Model identification
    name: Mapped[str] = mapped_column(String(255), index=True)
    display_name: Mapped[str] = mapped_column(String(255))
    provider: Mapped[str] = mapped_column(String(100), index=True)
    provider_model_id: Mapped[str] = mapped_column(String(255))
    
    # Model metadata
    description: Mapped[Optional[str]] = mapped_column(Text)
    model_type: Mapped[str] = mapped_column(String(50), default="chat")  # chat, completion, embedding
    version: Mapped[Optional[str]] = mapped_column(String(50))
    
    # Capabilities
    supports_structured_output: Mapped[bool] = mapped_column(Boolean, default=False)
    supports_json_mode: Mapped[bool] = mapped_column(Boolean, default=False)
    supports_function_calling: Mapped[bool] = mapped_column(Boolean, default=False)
    max_context_length: Mapped[Optional[int]] = mapped_column(Integer)
    
    # Pricing (per 1K tokens)
    input_price_per_1k: Mapped[Optional[float]] = mapped_column(Numeric(10, 6))
    output_price_per_1k: Mapped[Optional[float]] = mapped_column(Numeric(10, 6))
    
    # Configuration
    config: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSONB)
    
    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    is_public: Mapped[bool] = mapped_column(Boolean, default=True)
    health_status: Mapped[str] = mapped_column(String(20), default="healthy")  # healthy, degraded, down
    
    # Performance metrics (updated periodically)
    avg_latency_ms: Mapped[Optional[float]] = mapped_column(Numeric(10, 2))
    success_rate: Mapped[Optional[float]] = mapped_column(Numeric(5, 4))  # 0.0 to 1.0
    total_evaluations: Mapped[int] = mapped_column(Integer, default=0)
    
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
    last_health_check: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    
    def __repr__(self) -> str:
        return f"<Model(id={self.id}, name={self.name}, provider={self.provider})>"
    
    @property
    def full_name(self) -> str:
        """Get full model name with provider."""
        return f"{self.provider}/{self.name}"
