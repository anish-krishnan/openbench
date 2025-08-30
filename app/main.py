"""
Main FastAPI application entry point.
"""
import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

import sentry_sdk
import structlog
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration

from app.config import settings
from app.core.database import init_db, close_db
from app.core.exceptions import OpenBenchException
from app.core.logging import setup_logging
from app.api.v1 import api_router

  



@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan context manager."""
    # Startup
    setup_logging()
    logger = structlog.get_logger()
    
    logger.info("Starting Open Bench backend", environment=settings.environment)
    
    # Initialize database
    await init_db()
    logger.info("Database initialized")
    
    yield
    
    # Shutdown
    logger.info("Shutting down Open Bench backend")
    await close_db()


def create_app() -> FastAPI:
    """Create and configure FastAPI application."""
    
    # Initialize Sentry if configured
    if settings.sentry_dsn:
        sentry_sdk.init(
            dsn=settings.sentry_dsn,
            integrations=[
                FastApiIntegration(auto_enabling=True),
                SqlalchemyIntegration(),
            ],
            traces_sample_rate=0.1 if settings.is_production else 1.0,
            environment=settings.environment,
        )
    
    # Create FastAPI app
    app = FastAPI(
        title="Open Bench API",
        description="Backend API for Open Bench - LLM evaluation platform",
        version="1.0.0",
        lifespan=lifespan,
        debug=settings.debug,
    )
    
    # Add CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"] if settings.is_development else ["https://openbench.ai"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Include API router
    app.include_router(api_router, prefix=f"/api/{settings.api_version}")
    
    # Global exception handlers
    @app.exception_handler(OpenBenchException)
    async def openbench_exception_handler(request: Request, exc: OpenBenchException):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": {
                    "code": exc.error_code,
                    "message": exc.message,
                    "details": exc.details,
                    "request_id": getattr(request.state, "request_id", None),
                }
            },
        )
    
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        return JSONResponse(
            status_code=422,
            content={
                "detail": exc.errors()
            },
        )
    
    # Health check endpoint
    @app.get("/health")
    async def health_check():
        return {"status": "healthy", "environment": settings.environment}
    
    # Readiness probe
    @app.get("/ready")
    async def readiness_check():
        # TODO: Add actual readiness checks (DB, Redis, etc.)
        return {"status": "ready"}
    
    return app


# Create the app instance
app = create_app()


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug,
        log_config=None,  # We handle logging ourselves
    )
