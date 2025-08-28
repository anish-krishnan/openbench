"""
Together AI provider implementation.
"""
import time
from typing import Dict, Any, Optional, List

import httpx
import structlog

from app.config import settings
from app.core.exceptions import ProviderException, TimeoutException
from .base import BaseProvider, ProviderResponse, ProviderCapabilities

logger = structlog.get_logger(__name__)


class TogetherProvider(BaseProvider):
    """Together AI provider implementation."""
    
    def __init__(self, api_key: Optional[str] = None, **kwargs):
        super().__init__(api_key or settings.together_api_key, **kwargs)
        self.base_url = "https://api.together.xyz/v1"
        self.client = httpx.AsyncClient(
            base_url=self.base_url,
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            },
            timeout=30.0,
        )
    
    @property
    def provider_name(self) -> str:
        return "together"
    
    @property
    def capabilities(self) -> ProviderCapabilities:
        return ProviderCapabilities(
            supports_structured_output=False,
            supports_json_mode=True,
            supports_function_calling=False,
            max_context_length=32768,  # Varies by model
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
        """Generate response using Together AI API."""
        start_time = time.time()
        
        try:
            messages = self.format_messages(prompt, system_prompt)
            
            payload = {
                "model": model,
                "messages": messages,
                "temperature": temperature,
                **kwargs,
            }
            
            if max_tokens:
                payload["max_tokens"] = max_tokens
            
            logger.info("Making Together AI request", model=model)
            
            response = await self.client.post("/chat/completions", json=payload)
            response.raise_for_status()
            
            data = response.json()
            latency_ms = int((time.time() - start_time) * 1000)
            
            # Extract response content
            content = data["choices"][0]["message"]["content"]
            
            # Extract usage information
            usage = data.get("usage", {})
            input_tokens = usage.get("prompt_tokens")
            output_tokens = usage.get("completion_tokens")
            total_tokens = usage.get("total_tokens")
            
            return ProviderResponse(
                content=content,
                raw_response=data,
                input_tokens=input_tokens,
                output_tokens=output_tokens,
                total_tokens=total_tokens,
                latency_ms=latency_ms,
                provider_request_id=data.get("id"),
                model_used=data.get("model"),
                finish_reason=data["choices"][0].get("finish_reason"),
            )
            
        except httpx.TimeoutException as e:
            raise TimeoutException(
                f"Together AI timeout for model {model}",
                timeout_seconds=30,
            ) from e
        
        except Exception as e:
            raise ProviderException(
                f"Together AI provider error: {str(e)}",
                provider="together",
                details={"model": model},
            ) from e
    
    async def health_check(self) -> bool:
        """Check Together AI health."""
        try:
            response = await self.client.get("/models")
            return response.status_code == 200
        except Exception:
            return False
    
    def get_available_models(self) -> List[Dict[str, Any]]:
        """Get available Together AI models."""
        return [
            {
                "id": "mixtral-8x7b",
                "name": "Mixtral 8x7B",
                "provider_model_id": "mistralai/Mixtral-8x7B-Instruct-v0.1",
                "supports_structured_output": False,
                "supports_json_mode": True,
                "supports_function_calling": False,
                "max_context_length": 32768,
                "input_price_per_1k": 0.0006,
                "output_price_per_1k": 0.0006,
            },
        ]
    
    async def __aenter__(self):
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.client.aclose()
