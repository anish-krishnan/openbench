"""
Model Execution Service - Main Application
"""
import asyncio
import os
from contextlib import asynccontextmanager

import structlog
import uvicorn
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import router
from app.core.config import settings
from app.core.logging import setup_logging
from app.services.model_manager import model_manager
from app.models.api import ErrorResponse


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for FastAPI application."""
    # Startup
    setup_logging()
    logger = structlog.get_logger()
    
    logger.info("Starting Model Execution Service", version="1.0.0")
    
    # Initialize model manager
    await model_manager.initialize()
    
    # Preload configured models
    await model_manager.preload_models()
    
    logger.info("Model Execution Service started successfully")
    
    yield
    
    # Shutdown
    logger.info("Shutting down Model Execution Service")
    await model_manager.cleanup()


def create_app() -> FastAPI:
    """Create and configure FastAPI application."""
    app = FastAPI(
        title="Model Execution Service",
        description="Local model execution service for Open Bench",
        version="1.0.0",
        lifespan=lifespan,
    )
    
    # Add CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Configure appropriately for production
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Include API routes
    app.include_router(router)
    
    # Add exception handlers
    @app.exception_handler(HTTPException)
    async def http_exception_handler(request, exc):
        """Handle HTTP exceptions."""
        return JSONResponse(
            status_code=exc.status_code,
            content=ErrorResponse(
                error=exc.detail,
                code=str(exc.status_code)
            ).dict()
        )

    @app.exception_handler(Exception)
    async def general_exception_handler(request, exc):
        """Handle general exceptions."""
        logger = structlog.get_logger()
        logger.error("Unhandled exception", error=str(exc))
        
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=ErrorResponse(
                error="Internal server error",
                detail=str(exc)
            ).dict()
        )
    
    return app


app = create_app()


if __name__ == "__main__":
    port = int(os.getenv("PORT", 8001))
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=port,
        reload=False,
        log_config=None,  # Use our custom logging
    )
