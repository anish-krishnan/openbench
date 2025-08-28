"""
Base provider interface for LLM providers.
"""
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Dict, Any, Optional, List
from datetime import datetime


@dataclass
class ProviderCapabilities:
    """Provider capabilities definition."""
    supports_structured_output: bool = False
    supports_json_mode: bool = False
    supports_function_calling: bool = False
    max_context_length: Optional[int] = None
    supports_streaming: bool = False
    supports_system_messages: bool = True


@dataclass
class ProviderResponse:
    """Standardized response from LLM providers."""
    content: str
    raw_response: Dict[str, Any]
    
    # Token usage
    input_tokens: Optional[int] = None
    output_tokens: Optional[int] = None
    total_tokens: Optional[int] = None
    
    # Performance metrics
    latency_ms: Optional[int] = None
    
    # Provider metadata
    provider_request_id: Optional[str] = None
    model_used: Optional[str] = None
    
    # Cost information
    input_cost: Optional[float] = None
    output_cost: Optional[float] = None
    total_cost: Optional[float] = None
    
    # Response metadata
    finish_reason: Optional[str] = None
    created_at: datetime = None
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.utcnow()
        
        # Calculate total tokens if not provided
        if self.total_tokens is None and self.input_tokens and self.output_tokens:
            self.total_tokens = self.input_tokens + self.output_tokens


class BaseProvider(ABC):
    """Abstract base class for LLM providers."""
    
    def __init__(self, api_key: str, **kwargs):
        self.api_key = api_key
        self.config = kwargs
    
    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Get provider name."""
        pass
    
    @property
    @abstractmethod
    def capabilities(self) -> ProviderCapabilities:
        """Get provider capabilities."""
        pass
    
    @abstractmethod
    async def generate(
        self,
        prompt: str,
        model: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        json_mode: bool = False,
        **kwargs
    ) -> ProviderResponse:
        """Generate response from the model."""
        pass
    
    @abstractmethod
    async def health_check(self) -> bool:
        """Check if provider is healthy."""
        pass
    
    @abstractmethod
    def get_available_models(self) -> List[Dict[str, Any]]:
        """Get list of available models from provider."""
        pass
    
    def calculate_cost(
        self,
        model: str,
        input_tokens: int,
        output_tokens: int
    ) -> tuple[Optional[float], Optional[float], Optional[float]]:
        """Calculate cost for the request."""
        # Default implementation - providers should override with actual pricing
        return None, None, None
    
    def format_messages(
        self,
        prompt: str,
        system_prompt: Optional[str] = None
    ) -> List[Dict[str, str]]:
        """Format messages for the provider."""
        messages = []
        
        if system_prompt and self.capabilities.supports_system_messages:
            messages.append({"role": "system", "content": system_prompt})
        
        # If no system message support, prepend to user message
        user_content = prompt
        if system_prompt and not self.capabilities.supports_system_messages:
            user_content = f"{system_prompt}\n\n{prompt}"
        
        messages.append({"role": "user", "content": user_content})
        
        return messages
