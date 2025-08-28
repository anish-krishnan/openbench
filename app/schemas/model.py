"""
Model schemas.
"""
from datetime import datetime
from typing import Any, Dict, Optional
from pydantic import BaseModel, ConfigDict


class ModelResponse(BaseModel):
    """Schema for model response."""
    id: str
    name: str
    display_name: str
    provider: str
    provider_model_id: str
    
    description: Optional[str] = None
    model_type: str
    version: Optional[str] = None
    
    supports_structured_output: bool
    supports_json_mode: bool
    supports_function_calling: bool
    max_context_length: Optional[int] = None
    
    input_price_per_1k: Optional[float] = None
    output_price_per_1k: Optional[float] = None
    
    config: Optional[Dict[str, Any]] = None
    
    is_active: bool
    is_public: bool
    health_status: str
    
    avg_latency_ms: Optional[float] = None
    success_rate: Optional[float] = None
    total_evaluations: int
    
    created_at: datetime
    updated_at: datetime
    last_health_check: Optional[datetime] = None
    
    model_config = ConfigDict(
        from_attributes=True,
        protected_namespaces=()
    )


class ModelPerformanceResponse(BaseModel):
    """Schema for model performance metrics."""
    model_id: str
    model_name: str
    
    overall_accuracy: float
    total_evaluations: int
    
    category_performance: Dict[str, Dict[str, Any]]
    
    avg_latency_ms: float
    success_rate: float
    
    cost_per_evaluation: Optional[float] = None
    
    last_updated: datetime
    
    model_config = ConfigDict(
        protected_namespaces=()
    )
