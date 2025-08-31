"""
Provider factory for creating LLM provider instances.
"""
from typing import Dict, Type, Optional
import structlog

from app.core.exceptions import ProviderException
from .base import BaseProvider
from .openai_provider import OpenAIProvider
from .anthropic_provider import AnthropicProvider
from .google_provider import GoogleProvider
from .together_provider import TogetherProvider
from .mes_provider import ModelExecutionServiceProvider

logger = structlog.get_logger(__name__)


class ProviderFactory:
    """Factory for creating LLM provider instances."""
    
    _providers: Dict[str, Type[BaseProvider]] = {
        "openai": OpenAIProvider,
        "anthropic": AnthropicProvider,
        "google": GoogleProvider,
        "together": TogetherProvider,
        "mes": ModelExecutionServiceProvider,
    }
    
    _instances: Dict[str, BaseProvider] = {}
    
    @classmethod
    def get_provider(cls, provider_name: str, **kwargs) -> BaseProvider:
        """Get or create a provider instance."""
        if provider_name not in cls._providers:
            raise ProviderException(
                f"Unknown provider: {provider_name}",
                provider=provider_name,
                details={"available_providers": list(cls._providers.keys())},
            )
        
        # Use singleton pattern for providers (they're stateless except for config)
        cache_key = f"{provider_name}_{hash(frozenset(kwargs.items()))}"
        
        if cache_key not in cls._instances:
            provider_class = cls._providers[provider_name]
            cls._instances[cache_key] = provider_class(**kwargs)
            logger.info("Created new provider instance", provider=provider_name)
        
        return cls._instances[cache_key]
    
    @classmethod
    def get_available_providers(cls) -> list[str]:
        """Get list of available provider names."""
        return list(cls._providers.keys())
    
    @classmethod
    def register_provider(cls, name: str, provider_class: Type[BaseProvider]) -> None:
        """Register a new provider class."""
        cls._providers[name] = provider_class
        logger.info("Registered new provider", provider=name)
    
    @classmethod
    async def health_check_all(cls) -> Dict[str, bool]:
        """Check health of all providers."""
        results = {}
        
        for provider_name in cls._providers:
            try:
                provider = cls.get_provider(provider_name)
                results[provider_name] = await provider.health_check()
            except Exception as e:
                logger.warning(
                    "Provider health check failed",
                    provider=provider_name,
                    error=str(e),
                )
                results[provider_name] = False
        
        return results
