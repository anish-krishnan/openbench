"""
Ollama HTTP client for Model Execution Service
"""
import asyncio
import json
import time
from typing import Dict, Any, List, Optional

import httpx
import structlog
from pydantic import ValidationError

from app.core.config import settings

logger = structlog.get_logger(__name__)


class OllamaError(Exception):
    """Base exception for Ollama operations."""
    pass


class OllamaTimeoutError(OllamaError):
    """Raised when Ollama request times out."""
    pass


class OllamaModelNotFoundError(OllamaError):
    """Raised when model is not found in Ollama."""
    pass


class OllamaClient:
    """HTTP client for Ollama API."""
    
    def __init__(self, base_url: str = None, timeout: int = 60):
        self.base_url = base_url or settings.ollama_host
        self.timeout = timeout
        self._client: Optional[httpx.AsyncClient] = None
    
    async def __aenter__(self):
        """Async context manager entry."""
        self._client = httpx.AsyncClient(
            base_url=self.base_url,
            timeout=httpx.Timeout(self.timeout)
        )
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        if self._client:
            await self._client.aclose()
    
    def get_client(self) -> httpx.AsyncClient:
        """Get HTTP client instance."""
        if self._client is None:
            self._client = httpx.AsyncClient(
                base_url=self.base_url,
                timeout=httpx.Timeout(self.timeout)
            )
        return self._client
    
    async def health_check(self) -> bool:
        """Check if Ollama is running and accessible."""
        try:
            client = self.get_client()
            response = await client.get("/api/tags")
            return response.status_code == 200
        except Exception as e:
            logger.warning("Ollama health check failed", error=str(e))
            return False
    
    async def list_models(self) -> List[Dict[str, Any]]:
        """List all models available in Ollama."""
        try:
            client = self.get_client()
            response = await client.get("/api/tags")
            response.raise_for_status()
            
            data = response.json()
            return data.get("models", [])
        
        except httpx.TimeoutException:
            raise OllamaTimeoutError("Timeout listing models")
        except httpx.HTTPStatusError as e:
            logger.error("HTTP error listing models", status_code=e.response.status_code)
            raise OllamaError(f"HTTP {e.response.status_code}: {e.response.text}")
        except Exception as e:
            logger.error("Unexpected error listing models", error=str(e))
            raise OllamaError(f"Failed to list models: {str(e)}")
    
    async def pull_model(self, model_name: str) -> bool:
        """
        Pull/download a model to Ollama.
        
        Args:
            model_name: Name of the model to pull
            
        Returns:
            bool: True if successful
        """
        try:
            client = self.get_client()
            
            # Start the pull operation
            response = await client.post(
                "/api/pull",
                json={"name": model_name},
                timeout=httpx.Timeout(300)  # 5 minutes for model pulls
            )
            
            if response.status_code != 200:
                logger.error("Failed to pull model", 
                           model=model_name, 
                           status_code=response.status_code)
                return False
            
            # Stream the response to track progress
            async for line in response.aiter_lines():
                if line:
                    try:
                        data = json.loads(line)
                        if "error" in data:
                            logger.error("Model pull error", 
                                       model=model_name, 
                                       error=data["error"])
                            return False
                        
                        # Log progress
                        if "status" in data:
                            logger.info("Model pull progress", 
                                      model=model_name, 
                                      status=data["status"])
                        
                        # Check if completed
                        if data.get("status") == "success":
                            logger.info("Model pull completed", model=model_name)
                            return True
                            
                    except json.JSONDecodeError:
                        continue
            
            return True
            
        except httpx.TimeoutException:
            logger.error("Model pull timeout", model=model_name)
            raise OllamaTimeoutError(f"Timeout pulling model {model_name}")
        except Exception as e:
            logger.error("Model pull failed", model=model_name, error=str(e))
            raise OllamaError(f"Failed to pull model {model_name}: {str(e)}")
    
    async def generate(
        self,
        model: str,
        prompt: str,
        system: Optional[str] = None,
        options: Optional[Dict[str, Any]] = None,
        format: Optional[str] = None,
        timeout: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Generate text using a model.
        
        Args:
            model: Model name to use
            prompt: The prompt text
            system: Optional system prompt
            options: Optional model parameters (temperature, etc.)
            format: Optional format (e.g., "json")
            timeout: Optional request timeout
            
        Returns:
            Dict containing the response
        """
        start_time = time.time()
        
        try:
            client = self.get_client()
            
            # Prepare request payload
            payload = {
                "model": model,
                "prompt": prompt,
                "stream": False
            }
            
            if system:
                payload["system"] = system
            
            if options:
                payload["options"] = options
            
            if format:
                payload["format"] = format
            
            # Make request with timeout
            request_timeout = timeout or settings.default_timeout
            
            response = await client.post(
                "/api/generate",
                json=payload,
                timeout=httpx.Timeout(request_timeout)
            )
            
            response.raise_for_status()
            result = response.json()
            
            # Add timing information
            result["latency_ms"] = int((time.time() - start_time) * 1000)
            
            return result
            
        except httpx.TimeoutException:
            latency_ms = int((time.time() - start_time) * 1000)
            logger.error("Generation timeout", 
                        model=model, 
                        timeout=request_timeout,
                        latency_ms=latency_ms)
            raise OllamaTimeoutError(f"Generation timeout after {request_timeout}s")
            
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                raise OllamaModelNotFoundError(f"Model {model} not found")
            
            logger.error("HTTP error during generation", 
                        model=model,
                        status_code=e.response.status_code,
                        response=e.response.text)
            raise OllamaError(f"HTTP {e.response.status_code}: {e.response.text}")
            
        except Exception as e:
            latency_ms = int((time.time() - start_time) * 1000)
            logger.error("Generation failed", 
                        model=model, 
                        error=str(e),
                        latency_ms=latency_ms)
            raise OllamaError(f"Generation failed: {str(e)}")
    
    async def show_model(self, model_name: str) -> Dict[str, Any]:
        """
        Get information about a specific model.
        
        Args:
            model_name: Name of the model
            
        Returns:
            Dict containing model information
        """
        try:
            client = self.get_client()
            response = await client.post(
                "/api/show",
                json={"name": model_name}
            )
            
            if response.status_code == 404:
                raise OllamaModelNotFoundError(f"Model {model_name} not found")
            
            response.raise_for_status()
            return response.json()
            
        except httpx.TimeoutException:
            raise OllamaTimeoutError(f"Timeout getting model info for {model_name}")
        except OllamaModelNotFoundError:
            raise
        except Exception as e:
            logger.error("Failed to get model info", model=model_name, error=str(e))
            raise OllamaError(f"Failed to get model info: {str(e)}")


# Global client instance
ollama_client = OllamaClient()
