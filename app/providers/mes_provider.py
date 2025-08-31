"""
Model Execution Service (MES) provider for local model execution.
"""
import asyncio
import time
from typing import Dict, Any, Optional, List

import httpx
import structlog

from .base import BaseProvider, ProviderResponse, ProviderCapabilities

logger = structlog.get_logger(__name__)


class ModelExecutionServiceProvider(BaseProvider):
    """Provider for Model Execution Service (local models via Ollama)."""
    
    def __init__(self, api_key: str, base_url: str = "http://localhost:8001", **kwargs):
        super().__init__(api_key, **kwargs)
        self.base_url = base_url.rstrip('/')
        self.timeout = kwargs.get('timeout', 60)
        self._client = None
        self._available_models = None
        self._last_model_refresh = 0
    
    @property
    def provider_name(self) -> str:
        return "model_execution_service"
    
    @property
    def capabilities(self) -> ProviderCapabilities:
        return ProviderCapabilities(
            supports_structured_output=True,
            supports_json_mode=True,
            supports_function_calling=False,
            max_context_length=8192,  # Varies by model
            supports_streaming=False,
            supports_system_messages=True
        )
    
    def _get_client(self) -> httpx.AsyncClient:
        """Get HTTP client instance."""
        if self._client is None:
            self._client = httpx.AsyncClient(
                base_url=self.base_url,
                timeout=httpx.Timeout(self.timeout),
                headers={"Authorization": f"Bearer {self.api_key}"}
            )
        return self._client
    
    async def generate(
        self,
        prompt: str,
        model: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        json_mode: bool = False,
        json_schema: Optional[Dict[str, Any]] = None,
        **kwargs
    ) -> ProviderResponse:
        """Generate response using MES."""
        start_time = time.time()
        
        try:
            client = self._get_client()
            
            # Prepare request payload
            payload = {
                "model_id": model,
                "prompt": prompt,
                "temperature": temperature
            }
            
            if system_prompt:
                payload["system_prompt"] = system_prompt
            
            if max_tokens:
                payload["max_tokens"] = max_tokens
            
            # Handle JSON schema
            if json_schema:
                payload["json_schema"] = json_schema
            elif json_mode:
                # Simple JSON mode without schema
                payload["json_schema"] = {"type": "object"}
            
            # Custom timeout from kwargs
            if "timeout" in kwargs:
                payload["timeout"] = kwargs["timeout"]
            
            logger.info("Sending request to MES", 
                       model=model, 
                       prompt_length=len(prompt),
                       has_schema=json_schema is not None)
            
            # Make request
            response = await client.post("/v1/inference", json=payload)
            response.raise_for_status()
            
            result = response.json()
            
            if not result.get("success", False):
                error_msg = result.get("error", "Unknown error")
                logger.error("MES inference failed", error=error_msg, model=model)
                raise Exception(f"MES inference failed: {error_msg}")
            
            # Extract response data
            content = result.get("output", "")
            usage = result.get("usage", {})
            latency_ms = result.get("latency_ms", int((time.time() - start_time) * 1000))
            
            logger.info("MES inference completed", 
                       model=model,
                       latency_ms=latency_ms,
                       output_length=len(content))
            
            return ProviderResponse(
                content=content,
                raw_response=result,
                input_tokens=usage.get("prompt_tokens"),
                output_tokens=usage.get("completion_tokens"),
                total_tokens=usage.get("total_tokens"),
                latency_ms=latency_ms,
                model_used=model,
                finish_reason="stop"  # MES doesn't provide finish reason
            )
            
        except httpx.TimeoutException:
            latency_ms = int((time.time() - start_time) * 1000)
            logger.error("MES request timeout", model=model, latency_ms=latency_ms)
            raise Exception(f"Request timeout after {self.timeout}s")
            
        except httpx.HTTPStatusError as e:
            latency_ms = int((time.time() - start_time) * 1000)
            logger.error("MES HTTP error", 
                        model=model,
                        status_code=e.response.status_code,
                        response=e.response.text,
                        latency_ms=latency_ms)
            
            if e.response.status_code == 401:
                raise Exception("Authentication failed - check API key")
            elif e.response.status_code == 404:
                raise Exception(f"Model {model} not found")
            else:
                raise Exception(f"HTTP {e.response.status_code}: {e.response.text}")
                
        except Exception as e:
            latency_ms = int((time.time() - start_time) * 1000)
            logger.error("MES request failed", 
                        model=model, 
                        error=str(e),
                        latency_ms=latency_ms)
            raise
    
    async def health_check(self) -> bool:
        """Check if MES is healthy."""
        try:
            client = self._get_client()
            response = await client.get("/health", timeout=10)
            return response.status_code == 200
        except Exception as e:
            logger.warning("MES health check failed", error=str(e))
            return False
    
    def get_available_models(self) -> List[Dict[str, Any]]:
        """Get list of available models from MES."""
        # This is a sync method, but we need async call
        # Return cached models or empty list
        return self._available_models or []
    
    async def refresh_available_models(self) -> List[Dict[str, Any]]:
        """Refresh and get available models from MES."""
        try:
            client = self._get_client()
            response = await client.get("/v1/models")
            response.raise_for_status()
            
            result = response.json()
            models = result.get("models", [])
            
            # Transform MES model format to standard format
            standardized_models = []
            for model in models:
                standardized_models.append({
                    "id": model.get("id"),
                    "name": model.get("name"),
                    "provider": self.provider_name,
                    "context_length": model.get("context_window", 4096),
                    "supports_json": model.get("supports_json", False),
                    "status": model.get("status", "unknown"),
                    "loaded": model.get("loaded", False),
                    "size_gb": model.get("size_gb", 0)
                })
            
            self._available_models = standardized_models
            self._last_model_refresh = time.time()
            
            logger.info("Refreshed MES models", count=len(standardized_models))
            return standardized_models
            
        except Exception as e:
            logger.error("Failed to refresh MES models", error=str(e))
            return []
    
    async def load_model(self, model_id: str) -> bool:
        """Load a model in MES."""
        try:
            client = self._get_client()
            response = await client.post(f"/v1/models/{model_id}/load")
            response.raise_for_status()
            
            result = response.json()
            success = result.get("success", False)
            
            if success:
                logger.info("Model loaded in MES", model=model_id)
            else:
                logger.warning("Failed to load model in MES", 
                             model=model_id, 
                             message=result.get("message"))
            
            return success
            
        except Exception as e:
            logger.error("Error loading model in MES", model=model_id, error=str(e))
            return False
    
    async def unload_model(self, model_id: str) -> bool:
        """Unload a model in MES."""
        try:
            client = self._get_client()
            response = await client.post(f"/v1/models/{model_id}/unload")
            response.raise_for_status()
            
            result = response.json()
            success = result.get("success", False)
            
            if success:
                logger.info("Model unloaded in MES", model=model_id)
            else:
                logger.warning("Failed to unload model in MES", 
                             model=model_id, 
                             message=result.get("message"))
            
            return success
            
        except Exception as e:
            logger.error("Error unloading model in MES", model=model_id, error=str(e))
            return False
    
    async def get_status(self) -> Dict[str, Any]:
        """Get MES status information."""
        try:
            client = self._get_client()
            response = await client.get("/v1/status")
            response.raise_for_status()
            
            return response.json()
            
        except Exception as e:
            logger.error("Error getting MES status", error=str(e))
            return {}
    
    async def close(self):
        """Close the HTTP client."""
        if self._client:
            await self._client.aclose()
            self._client = None
