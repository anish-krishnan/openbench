"""
Google provider implementation.
"""
import time
from typing import Dict, Any, Optional, List

import httpx
import structlog

from app.config import settings
from app.core.exceptions import ProviderException, TimeoutException
from .base import BaseProvider, ProviderResponse, ProviderCapabilities

logger = structlog.get_logger(__name__)


class GoogleProvider(BaseProvider):
    """Google Gemini provider implementation."""
    
    def __init__(self, api_key: Optional[str] = None, **kwargs):
        super().__init__(api_key or settings.google_api_key, **kwargs)
        self.base_url = "https://generativelanguage.googleapis.com/v1beta"
        self.client = httpx.AsyncClient(
            base_url=self.base_url,
            timeout=30.0,
        )
    
    @property
    def provider_name(self) -> str:
        return "google"
    
    @property
    def capabilities(self) -> ProviderCapabilities:
        return ProviderCapabilities(
            supports_structured_output=False,
            supports_json_mode=False,
            supports_function_calling=True,
            max_context_length=32000,  # Gemini Pro
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
        """Generate response using Google Gemini API."""
        start_time = time.time()
        
        try:
            # Format content for Gemini
            parts = []
            if system_prompt:
                parts.append({"text": f"System: {system_prompt}\n\nUser: {prompt}"})
            else:
                parts.append({"text": prompt})
            
            payload = {
                "contents": [{"parts": parts}],
                "generationConfig": {
                    "temperature": temperature,
                    "candidateCount": 1,
                },
            }
            
            if max_tokens:
                payload["generationConfig"]["maxOutputTokens"] = max_tokens
            
            logger.info("Making Google API request", model=model)
            
            url = f"/models/{model}:generateContent"
            response = await self.client.post(
                url,
                json=payload,
                params={"key": self.api_key}
            )
            response.raise_for_status()
            
            data = response.json()
            latency_ms = int((time.time() - start_time) * 1000)
            
            # Extract response content
            candidates = data.get("candidates", [])
            if not candidates:
                raise ProviderException("No candidates in response", provider="google")
            
            content = candidates[0]["content"]["parts"][0]["text"]
            
            # Google doesn't provide detailed token usage in the basic API
            return ProviderResponse(
                content=content,
                raw_response=data,
                latency_ms=latency_ms,
                model_used=model,
                finish_reason=candidates[0].get("finishReason"),
            )
            
        except httpx.TimeoutException as e:
            raise TimeoutException(
                f"Google API timeout for model {model}",
                timeout_seconds=30,
            ) from e
        
        except Exception as e:
            raise ProviderException(
                f"Google provider error: {str(e)}",
                provider="google",
                details={"model": model},
            ) from e
    
    async def health_check(self) -> bool:
        """Check Google API health."""
        try:
            response = await self.client.get(
                "/models",
                params={"key": self.api_key}
            )
            return response.status_code == 200
        except Exception:
            return False
    
    def get_available_models(self) -> List[Dict[str, Any]]:
        """Get available Google models."""
        return [
            {
                "id": "gemini-pro",
                "name": "Gemini Pro",
                "provider_model_id": "gemini-pro",
                "supports_structured_output": False,
                "supports_json_mode": False,
                "supports_function_calling": True,
                "max_context_length": 32000,
                "input_price_per_1k": 0.0005,
                "output_price_per_1k": 0.0015,
            },
        ]
    
    async def __aenter__(self):
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.client.aclose()
