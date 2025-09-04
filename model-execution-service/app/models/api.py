"""
API Models for Model Execution Service
"""
from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field


class ModelInfo(BaseModel):
    """Information about a model."""
    id: str
    name: str
    status: str = Field(description="Model status: ready, loading, error, unavailable")
    size_gb: float
    context_window: int
    supports_json: bool
    loaded: bool


class ModelsResponse(BaseModel):
    """Response for GET /v1/models."""
    models: List[ModelInfo]


class ModelLoadResponse(BaseModel):
    """Response for model load/unload operations."""
    success: bool
    message: str
    model_id: str


class InferenceRequest(BaseModel):
    """Request for inference endpoint."""
    model_config = {"protected_namespaces": ()}
    
    model_id: str
    prompt: str
    system_prompt: Optional[str] = None
    temperature: Optional[float] = Field(default=None, ge=0.0, le=2.0)
    max_tokens: Optional[int] = Field(default=None, ge=1, le=4096)
    json_schema: Optional[Dict[str, Any]] = None
    timeout: Optional[int] = Field(default=None, ge=1, le=300)


class UsageInfo(BaseModel):
    """Token usage information."""
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int


class InferenceResponse(BaseModel):
    """Response for inference endpoint."""
    success: bool
    output: Optional[str] = None
    usage: Optional[UsageInfo] = None
    latency_ms: int
    model_id: str
    error: Optional[str] = None


class StatusResponse(BaseModel):
    """Response for status endpoint."""
    ollama_running: bool
    models_loaded: List[str]
    memory_available_gb: Optional[float] = None
    gpu_available: bool
    version: str


class HealthResponse(BaseModel):
    """Response for health endpoints."""
    status: str
    timestamp: str


class ErrorResponse(BaseModel):
    """Standard error response."""
    error: str
    detail: Optional[str] = None
    code: Optional[str] = None
