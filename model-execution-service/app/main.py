"""
Model Execution Service - Main Application
"""
import asyncio
import os
from contextlib import asynccontextmanager

import structlog
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router
from app.core.config import settings
from app.core.logging import setup_logging
from app.services.model_manager import model_manager


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
