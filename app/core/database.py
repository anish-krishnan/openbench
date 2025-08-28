"""
Database configuration and session management.
"""
from typing import AsyncGenerator
import structlog
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import settings

logger = structlog.get_logger(__name__)

# Database engine
engine = None
async_session_maker = None


class Base(DeclarativeBase):
    """Base class for all database models."""
    pass


async def init_db() -> None:
    """Initialize database connection."""
    global engine, async_session_maker
    
    logger.info("Initializing database connection", database_url=settings.database_url.split("@")[0])
    
    engine = create_async_engine(
        settings.database_url,
        echo=settings.debug,
        pool_size=10,
        max_overflow=20,
        pool_pre_ping=True,
        pool_recycle=3600,
    )
    
    async_session_maker = async_sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )
    
    logger.info("Database connection initialized")


async def close_db() -> None:
    """Close database connection."""
    global engine
    
    if engine:
        logger.info("Closing database connection")
        await engine.dispose()
        logger.info("Database connection closed")


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """Get database session dependency."""
    if not async_session_maker:
        raise RuntimeError("Database not initialized")
    
    async with async_session_maker() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def get_db() -> AsyncSession:
    """Get database session for direct use."""
    if not async_session_maker:
        raise RuntimeError("Database not initialized")
    
    return async_session_maker()
