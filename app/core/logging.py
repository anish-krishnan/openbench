"""
Logging configuration for Open Bench.
"""
import logging
import sys
from typing import Any, Dict

import structlog
from structlog.types import FilteringBoundLogger

from app.config import settings


def setup_logging() -> None:
    """Configure structured logging."""
    
    # Configure standard library logging
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=logging.DEBUG if settings.debug else logging.INFO,
    )
    
    # Silence noisy loggers in production
    if settings.is_production:
        logging.getLogger("httpx").setLevel(logging.WARNING)
        logging.getLogger("httpcore").setLevel(logging.WARNING)
        logging.getLogger("asyncio").setLevel(logging.WARNING)
    
    # Configure structlog
    processors = [
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.StackInfoRenderer(),
        structlog.dev.set_exc_info,
    ]
    
    if settings.is_production:
        # JSON logging for production
        processors.extend([
            structlog.processors.dict_tracebacks,
            structlog.processors.JSONRenderer(),
        ])
    else:
        # Pretty console logging for development
        processors.extend([
            structlog.dev.ConsoleRenderer(colors=True),
        ])
    
    structlog.configure(
        processors=processors,
        wrapper_class=structlog.make_filtering_bound_logger(
            logging.DEBUG if settings.debug else logging.INFO
        ),
        logger_factory=structlog.PrintLoggerFactory(),
        cache_logger_on_first_use=True,
    )


def get_logger(name: str = __name__) -> FilteringBoundLogger:
    """Get a structured logger instance."""
    return structlog.get_logger(name)


def log_request(
    logger: FilteringBoundLogger,
    method: str,
    path: str,
    status_code: int,
    duration_ms: float,
    user_id: str = None,
    **kwargs: Any,
) -> None:
    """Log HTTP request with structured data."""
    log_data = {
        "event": "http_request",
        "method": method,
        "path": path,
        "status_code": status_code,
        "duration_ms": duration_ms,
        **kwargs,
    }
    
    if user_id:
        log_data["user_id"] = user_id
    
    if status_code >= 500:
        logger.error("HTTP request failed", **log_data)
    elif status_code >= 400:
        logger.warning("HTTP request error", **log_data)
    else:
        logger.info("HTTP request completed", **log_data)


def log_evaluation(
    logger: FilteringBoundLogger,
    test_id: str,
    model_id: str,
    status: str,
    duration_ms: float,
    error: str = None,
    **kwargs: Any,
) -> None:
    """Log model evaluation with structured data."""
    log_data = {
        "event": "model_evaluation",
        "test_id": test_id,
        "model_id": model_id,
        "status": status,
        "duration_ms": duration_ms,
        **kwargs,
    }
    
    if error:
        log_data["error"] = error
        logger.error("Model evaluation failed", **log_data)
    else:
        logger.info("Model evaluation completed", **log_data)


def mask_sensitive_data(data: Dict[str, Any]) -> Dict[str, Any]:
    """Mask sensitive data in log entries."""
    sensitive_keys = {
        "api_key", "token", "password", "secret", "authorization",
        "openai_api_key", "anthropic_api_key", "google_api_key"
    }
    
    masked_data = {}
    for key, value in data.items():
        if any(sensitive in key.lower() for sensitive in sensitive_keys):
            masked_data[key] = "***MASKED***"
        elif isinstance(value, dict):
            masked_data[key] = mask_sensitive_data(value)
        else:
            masked_data[key] = value
    
    return masked_data
