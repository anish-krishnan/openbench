"""
OpenAI provider implementation.
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


class OpenAIProvider(BaseProvider):
    """OpenAI provider implementation."""
    
    def __init__(self, api_key: Optional[str] = None, **kwargs):
        super().__init__(api_key or settings.openai_api_key, **kwargs)
        self.base_url = "https://api.openai.com/v1"
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
        return "openai"
    
    @property
    def capabilities(self) -> ProviderCapabilities:
        return ProviderCapabilities(
            supports_structured_output=True,
            supports_json_mode=True,
            supports_function_calling=True,
            max_context_length=128000,  # GPT-4 Turbo
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
        """Generate response using OpenAI API."""
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
            
            if json_mode:
                payload["response_format"] = {"type": "json_object"}
            
            logger.info(
                "Making OpenAI API request",
                model=model,
                message_count=len(messages),
                json_mode=json_mode,
            )
            
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
            
            # Calculate costs
            input_cost, output_cost, total_cost = self.calculate_cost(
                model, input_tokens or 0, output_tokens or 0
            )
            
            return ProviderResponse(
                content=content,
                raw_response=data,
                input_tokens=input_tokens,
                output_tokens=output_tokens,
                total_tokens=total_tokens,
                latency_ms=latency_ms,
                provider_request_id=data.get("id"),
                model_used=data.get("model"),
                input_cost=input_cost,
                output_cost=output_cost,
                total_cost=total_cost,
                finish_reason=data["choices"][0].get("finish_reason"),
            )
            
        except httpx.TimeoutException as e:
            raise TimeoutException(
                f"OpenAI API timeout for model {model}",
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
                f"OpenAI API error: {error_detail}",
                provider="openai",
                details={
                    "model": model,
                    "status_code": e.response.status_code,
                    "error": error_detail,
                },
            ) from e
        
        except Exception as e:
            raise ProviderException(
                f"OpenAI provider error: {str(e)}",
                provider="openai",
                details={"model": model},
            ) from e
    
    async def health_check(self) -> bool:
        """Check OpenAI API health."""
        try:
            response = await self.client.get("/models")
            return response.status_code == 200
        except Exception:
            return False
    
    def get_available_models(self) -> List[Dict[str, Any]]:
        """Get available OpenAI models."""
        return [
            {
                "id": "gpt-4",
                "name": "GPT-4",
                "provider_model_id": "gpt-4",
                "supports_structured_output": True,
                "supports_json_mode": True,
                "supports_function_calling": True,
                "max_context_length": 8192,
                "input_price_per_1k": 0.03,
                "output_price_per_1k": 0.06,
            },
            {
                "id": "gpt-4-turbo",
                "name": "GPT-4 Turbo",
                "provider_model_id": "gpt-4-turbo-preview",
                "supports_structured_output": True,
                "supports_json_mode": True,
                "supports_function_calling": True,
                "max_context_length": 128000,
                "input_price_per_1k": 0.01,
                "output_price_per_1k": 0.03,
            },
            {
                "id": "gpt-3.5-turbo",
                "name": "GPT-3.5 Turbo",
                "provider_model_id": "gpt-3.5-turbo",
                "supports_structured_output": False,
                "supports_json_mode": True,
                "supports_function_calling": True,
                "max_context_length": 16384,
                "input_price_per_1k": 0.0015,
                "output_price_per_1k": 0.002,
            },
        ]
    
    def calculate_cost(
        self,
        model: str,
        input_tokens: int,
        output_tokens: int
    ) -> tuple[Optional[float], Optional[float], Optional[float]]:
        """Calculate cost for OpenAI request."""
        # Pricing per 1K tokens (as of 2024)
        pricing = {
            "gpt-4": {"input": 0.03, "output": 0.06},
            "gpt-4-turbo-preview": {"input": 0.01, "output": 0.03},
            "gpt-3.5-turbo": {"input": 0.0015, "output": 0.002},
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
