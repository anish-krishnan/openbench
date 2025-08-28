"""
API v1 router and endpoints.
"""
from fastapi import APIRouter

from .tests import router as tests_router
from .models import router as models_router
from .benchmark import router as benchmark_router
from .admin import router as admin_router

api_router = APIRouter()

api_router.include_router(tests_router, prefix="/tests", tags=["tests"])
api_router.include_router(models_router, prefix="/models", tags=["models"])
api_router.include_router(benchmark_router, prefix="", tags=["benchmark"])
api_router.include_router(admin_router, prefix="/admin", tags=["admin"])
