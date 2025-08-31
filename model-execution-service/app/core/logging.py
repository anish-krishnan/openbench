"""
Logging configuration for Model Execution Service
"""
import sys
from typing import Any

import structlog
from structlog.typing import Processor

from app.core.config import settings


def setup_logging() -> None:
    """Setup structured logging configuration."""
    
    # Configure processors
    processors: list[Processor] = [
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
    ]
    
    # Add JSON formatting for production
    if settings.log_level.upper() == "DEBUG":
        processors.append(structlog.dev.ConsoleRenderer())
    else:
        processors.append(structlog.processors.JSONRenderer())
    
    # Configure structlog
    structlog.configure(
        processors=processors,
        wrapper_class=structlog.stdlib.BoundLogger,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )


def get_logger(name: str = "") -> structlog.stdlib.BoundLogger:
    """Get a configured logger instance."""
    return structlog.get_logger(name)
