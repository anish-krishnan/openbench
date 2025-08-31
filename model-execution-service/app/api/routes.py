"""
API Routes for Model Execution Service
"""
import time
from datetime import datetime
from typing import Optional

import psutil
import structlog
from fastapi import APIRouter, HTTPException, Header, Depends, status
from fastapi.responses import JSONResponse

from app.core.auth import verify_api_key
from app.models.api import (
    ModelsResponse,
    ModelLoadResponse,
    InferenceRequest,
    InferenceResponse,
    StatusResponse,
    HealthResponse,
    ErrorResponse
)
from app.services.model_manager import model_manager
from app.services.inference_service import inference_service
from app.services.ollama_client import ollama_client

logger = structlog.get_logger(__name__)

# Create router
router = APIRouter()


# Health endpoints (no auth required)
@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Basic health check endpoint."""
    return HealthResponse(
        status="healthy",
        timestamp=datetime.utcnow().isoformat()
    )


@router.get("/ready", response_model=HealthResponse)
async def readiness_check():
    """Readiness check including Ollama status."""
    ollama_healthy = await ollama_client.health_check()
    
    if not ollama_healthy:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Ollama service is not available"
        )
    
    return HealthResponse(
        status="ready",
        timestamp=datetime.utcnow().isoformat()
    )


# V1 API endpoints (require authentication)
@router.get("/v1/models", response_model=ModelsResponse)
async def list_models(api_key: str = Depends(verify_api_key)):
    """List all available models."""
    try:
        models = model_manager.get_all_models_info()
        
        logger.info("Listed models", count=len(models))
        
        return ModelsResponse(models=models)
        
    except Exception as e:
        logger.error("Failed to list models", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list models: {str(e)}"
        )


@router.post("/v1/models/{model_id}/load", response_model=ModelLoadResponse)
async def load_model(model_id: str, api_key: str = Depends(verify_api_key)):
    """Load a specific model into memory."""
    try:
        result = await model_manager.load_model(model_id)
        
        if result["success"]:
            logger.info("Model load requested", model=model_id)
            return ModelLoadResponse(**result)
        else:
            logger.warning("Model load failed", model=model_id, message=result["message"])
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result["message"]
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Model load error", model=model_id, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load model: {str(e)}"
        )


@router.post("/v1/models/{model_id}/unload", response_model=ModelLoadResponse)
async def unload_model(model_id: str, api_key: str = Depends(verify_api_key)):
    """Unload a specific model from memory."""
    try:
        result = await model_manager.unload_model(model_id)
        
        if result["success"]:
            logger.info("Model unloaded", model=model_id)
            return ModelLoadResponse(**result)
        else:
            logger.warning("Model unload failed", model=model_id, message=result["message"])
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result["message"]
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Model unload error", model=model_id, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to unload model: {str(e)}"
        )


@router.post("/v1/inference", response_model=InferenceResponse)
async def perform_inference(
    request: InferenceRequest,
    api_key: str = Depends(verify_api_key)
):
    """Perform inference using a specified model."""
    try:
        logger.info("Inference requested", 
                   model=request.model_id,
                   prompt_length=len(request.prompt),
                   has_schema=request.json_schema is not None)
        
        result = await inference_service.generate(request)
        
        if result.success:
            logger.info("Inference completed", 
                       model=request.model_id,
                       latency_ms=result.latency_ms,
                       output_length=len(result.output) if result.output else 0)
        else:
            logger.warning("Inference failed", 
                          model=request.model_id,
                          error=result.error)
        
        return result
        
    except Exception as e:
        logger.error("Inference error", 
                    model=request.model_id, 
                    error=str(e))
        
        return InferenceResponse(
            success=False,
            model_id=request.model_id,
            latency_ms=0,
            error=f"Inference error: {str(e)}"
        )


@router.get("/v1/status", response_model=StatusResponse)
async def get_status(api_key: str = Depends(verify_api_key)):
    """Get service status information."""
    try:
        # Check Ollama status
        ollama_running = await ollama_client.health_check()
        
        # Get loaded models
        loaded_models = model_manager.get_loaded_models()
        
        # Get memory information
        memory_info = psutil.virtual_memory()
        memory_available_gb = memory_info.available / (1024**3)
        
        # Check GPU availability (basic check)
        gpu_available = False
        try:
            import GPUtil
            gpus = GPUtil.getGPUs()
            gpu_available = len(gpus) > 0
        except ImportError:
            # GPUtil not available, assume no GPU
            pass
        except Exception:
            # GPU detection failed
            pass
        
        logger.info("Status requested", 
                   ollama_running=ollama_running,
                   loaded_models_count=len(loaded_models),
                   memory_available_gb=round(memory_available_gb, 2))
        
        return StatusResponse(
            ollama_running=ollama_running,
            models_loaded=loaded_models,
            memory_available_gb=round(memory_available_gb, 2),
            gpu_available=gpu_available,
            version="1.0.0"
        )
        
    except Exception as e:
        logger.error("Status check error", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get status: {str(e)}"
        )


# Error handlers
@router.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Handle HTTP exceptions."""
    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorResponse(
            error=exc.detail,
            code=str(exc.status_code)
        ).dict()
    )


@router.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """Handle general exceptions."""
    logger.error("Unhandled exception", error=str(exc))
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=ErrorResponse(
            error="Internal server error",
            detail=str(exc)
        ).dict()
    )
