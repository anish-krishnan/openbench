"""
Anthropic provider implementation.
"""
import asyncio
import time
from typing import Dict, Any, Optional, List

import httpx
import structlog

from app.config import settings
from app.core.exceptions import ProviderException, TimeoutException
from .base import BaseProvider, ProviderResponse, ProviderCapabilities

logger = structlog.get_logger(__name__)


class AnthropicProvider(BaseProvider):
    """Anthropic provider implementation."""
    
    def __init__(self, api_key: Optional[str] = None, **kwargs):
        super().__init__(api_key or settings.anthropic_api_key, **kwargs)
        self.base_url = "https://api.anthropic.com"
        self.client = httpx.AsyncClient(
            base_url=self.base_url,
            headers={
                "x-api-key": self.api_key,
                "anthropic-version": "2023-06-01",
                "Content-Type": "application/json",
            },
            timeout=30.0,
        )
    
    @property
    def provider_name(self) -> str:
        return "anthropic"
    
    @property
    def capabilities(self) -> ProviderCapabilities:
        return ProviderCapabilities(
            supports_structured_output=False,
            supports_json_mode=False,
            supports_function_calling=True,
            max_context_length=200000,  # Claude 3
            supports_streaming=True,
            supports_system_messages=True,
        )
    
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
        """Generate response using Anthropic API."""
        start_time = time.time()
        
        try:
            # Anthropic uses a different message format
            messages = [{"role": "user", "content": prompt}]
            
            payload = {
                "model": model,
                "max_tokens": max_tokens or 4096,
                "messages": messages,
                "temperature": temperature,
                **kwargs,
            }
            
            if system_prompt:
                payload["system"] = system_prompt
            
            logger.info(
                "Making Anthropic API request",
                model=model,
                message_count=len(messages),
                has_system=bool(system_prompt),
            )
            
            response = await self.client.post("/v1/messages", json=payload)
            response.raise_for_status()
            
            data = response.json()
            latency_ms = int((time.time() - start_time) * 1000)
            
            # Extract response content
            content = data["content"][0]["text"] if data.get("content") else ""
            
            # Extract usage information
            usage = data.get("usage", {})
            input_tokens = usage.get("input_tokens")
            output_tokens = usage.get("output_tokens")
            
            # Calculate costs
            input_cost, output_cost, total_cost = self.calculate_cost(
                model, input_tokens or 0, output_tokens or 0
            )
            
            return ProviderResponse(
                content=content,
                raw_response=data,
                input_tokens=input_tokens,
                output_tokens=output_tokens,
                total_tokens=(input_tokens or 0) + (output_tokens or 0),
                latency_ms=latency_ms,
                provider_request_id=data.get("id"),
                model_used=data.get("model"),
                input_cost=input_cost,
                output_cost=output_cost,
                total_cost=total_cost,
                finish_reason=data.get("stop_reason"),
            )
            
        except httpx.TimeoutException as e:
            raise TimeoutException(
                f"Anthropic API timeout for model {model}",
                timeout_seconds=30,
            ) from e
        
        except httpx.HTTPStatusError as e:
            error_detail = "Unknown error"
            try:
                error_data = e.response.json()
                error_detail = error_data.get("error", {}).get("message", str(e))
            except Exception:
                error_detail = str(e)
            
            raise ProviderException(
                f"Anthropic API error: {error_detail}",
                provider="anthropic",
                details={
                    "model": model,
                    "status_code": e.response.status_code,
                    "error": error_detail,
                },
            ) from e
        
        except Exception as e:
            raise ProviderException(
                f"Anthropic provider error: {str(e)}",
                provider="anthropic",
                details={"model": model},
            ) from e
    
    async def health_check(self) -> bool:
        """Check Anthropic API health."""
        try:
            # Anthropic doesn't have a models endpoint, so we'll make a minimal request
            payload = {
                "model": "claude-3-haiku-20240307",
                "max_tokens": 1,
                "messages": [{"role": "user", "content": "Hi"}],
            }
            response = await self.client.post("/v1/messages", json=payload)
            return response.status_code == 200
        except Exception:
            return False
    
    def get_available_models(self) -> List[Dict[str, Any]]:
        """Get available Anthropic models."""
        return [
            {
                "id": "claude-3-opus",
                "name": "Claude 3 Opus",
                "provider_model_id": "claude-3-opus-20240229",
                "supports_structured_output": False,
                "supports_json_mode": False,
                "supports_function_calling": True,
                "max_context_length": 200000,
                "input_price_per_1k": 0.015,
                "output_price_per_1k": 0.075,
            },
            {
                "id": "claude-3-sonnet",
                "name": "Claude 3 Sonnet",
                "provider_model_id": "claude-3-sonnet-20240229",
                "supports_structured_output": False,
                "supports_json_mode": False,
                "supports_function_calling": True,
                "max_context_length": 200000,
                "input_price_per_1k": 0.003,
                "output_price_per_1k": 0.015,
            },
            {
                "id": "claude-3-haiku",
                "name": "Claude 3 Haiku",
                "provider_model_id": "claude-3-haiku-20240307",
                "supports_structured_output": False,
                "supports_json_mode": False,
                "supports_function_calling": True,
                "max_context_length": 200000,
                "input_price_per_1k": 0.00025,
                "output_price_per_1k": 0.00125,
            },
        ]
    
    def calculate_cost(
        self,
        model: str,
        input_tokens: int,
        output_tokens: int
    ) -> tuple[Optional[float], Optional[float], Optional[float]]:
        """Calculate cost for Anthropic request."""
        # Pricing per 1K tokens (as of 2024)
        pricing = {
            "claude-3-opus-20240229": {"input": 0.015, "output": 0.075},
            "claude-3-sonnet-20240229": {"input": 0.003, "output": 0.015},
            "claude-3-haiku-20240307": {"input": 0.00025, "output": 0.00125},
        }
        
        if model not in pricing:
            return None, None, None
        
        rates = pricing[model]
        input_cost = (input_tokens / 1000) * rates["input"]
        output_cost = (output_tokens / 1000) * rates["output"]
        total_cost = input_cost + output_cost
        
        return input_cost, output_cost, total_cost
    
    async def __aenter__(self):
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.client.aclose()
