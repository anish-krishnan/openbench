"""
Custom exceptions for Open Bench application.
"""
from typing import Any, Dict, Optional


class OpenBenchException(Exception):
    """Base exception for Open Bench application."""
    
    def __init__(
        self,
        message: str,
        status_code: int = 500,
        error_code: str = "INTERNAL_ERROR",
        details: Optional[Dict[str, Any]] = None,
    ):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code
        self.details = details or {}
        super().__init__(message)


class ValidationException(OpenBenchException):
    """Exception for validation errors."""
    
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            status_code=400,
            error_code="VALIDATION_ERROR",
            details=details,
        )


class AuthenticationException(OpenBenchException):
    """Exception for authentication errors."""
    
    def __init__(self, message: str = "Authentication required"):
        super().__init__(
            message=message,
            status_code=401,
            error_code="AUTHENTICATION_ERROR",
        )


class AuthorizationException(OpenBenchException):
    """Exception for authorization errors."""
    
    def __init__(self, message: str = "Insufficient permissions"):
        super().__init__(
            message=message,
            status_code=403,
            error_code="AUTHORIZATION_ERROR",
        )


class NotFoundException(OpenBenchException):
    """Exception for not found errors."""
    
    def __init__(self, message: str, resource_type: str = "Resource"):
        super().__init__(
            message=message,
            status_code=404,
            error_code="NOT_FOUND",
            details={"resource_type": resource_type},
        )


class RateLimitException(OpenBenchException):
    """Exception for rate limiting errors."""
    
    def __init__(self, message: str = "Rate limit exceeded", retry_after: Optional[int] = None):
        details = {}
        if retry_after:
            details["retry_after"] = retry_after
            
        super().__init__(
            message=message,
            status_code=429,
            error_code="RATE_LIMIT_EXCEEDED",
            details=details,
        )


class ProviderException(OpenBenchException):
    """Exception for LLM provider errors."""
    
    def __init__(self, message: str, provider: str, details: Optional[Dict[str, Any]] = None):
        provider_details = {"provider": provider}
        if details:
            provider_details.update(details)
            
        super().__init__(
            message=message,
            status_code=502,
            error_code="PROVIDER_ERROR",
            details=provider_details,
        )


class TimeoutException(OpenBenchException):
    """Exception for timeout errors."""
    
    def __init__(self, message: str = "Operation timed out", timeout_seconds: Optional[int] = None):
        details = {}
        if timeout_seconds:
            details["timeout_seconds"] = timeout_seconds
            
        super().__init__(
            message=message,
            status_code=504,
            error_code="TIMEOUT_ERROR",
            details=details,
        )


class DatabaseException(OpenBenchException):
    """Exception for database errors."""
    
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            status_code=500,
            error_code="DATABASE_ERROR",
            details=details,
        )
