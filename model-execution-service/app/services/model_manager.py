"""
Model Management Service for Model Execution Service
"""
import asyncio
import time
from collections import defaultdict, OrderedDict
from typing import Dict, Any, List, Optional, Set

import structlog

from app.core.config import settings, model_config
from app.services.ollama_client import (
    ollama_client,
    OllamaError,
    OllamaTimeoutError,
    OllamaModelNotFoundError
)

logger = structlog.get_logger(__name__)


class ModelManager:
    """Manages model loading, unloading, and status tracking."""
    
    def __init__(self):
        self._loaded_models: OrderedDict[str, Dict[str, Any]] = OrderedDict()
        self._model_info: Dict[str, Dict[str, Any]] = {}
        self._concurrent_requests: Dict[str, int] = defaultdict(int)
        self._initialized = False
    
    async def initialize(self) -> None:
        """Initialize the model manager."""
        logger.info("Initializing model manager")
        
        # Load model configuration
        model_config.load_config()
        
        # Check Ollama connection
        if not await ollama_client.health_check():
            logger.warning("Ollama is not accessible during initialization")
        else:
            logger.info("Ollama connection verified")
        
        # Get available models from Ollama
        await self._refresh_available_models()
        
        self._initialized = True
        logger.info("Model manager initialized")
    
    async def cleanup(self) -> None:
        """Cleanup resources."""
        logger.info("Cleaning up model manager")
        self._loaded_models.clear()
        self._model_info.clear()
        self._concurrent_requests.clear()
    
    async def _refresh_available_models(self) -> None:
        """Refresh the list of available models from Ollama."""
        try:
            ollama_models = await ollama_client.list_models()
            
            # Update model info with Ollama data
            for model in ollama_models:
                model_name = model.get("name", "")
                if model_name:
                    self._model_info[model_name] = {
                        "ollama_info": model,
                        "last_updated": time.time(),
                        "status": "available"
                    }
            
            logger.info("Refreshed available models", count=len(ollama_models))
            
        except Exception as e:
            logger.error("Failed to refresh available models", error=str(e))
    
    async def preload_models(self) -> None:
        """Preload models specified in configuration."""
        if not self._initialized:
            await self.initialize()
        
        preload_models = model_config.get_preload_models()
        logger.info("Preloading models", models=preload_models)
        
        for model_id in preload_models:
            try:
                await self.load_model(model_id)
            except Exception as e:
                logger.error("Failed to preload model", model=model_id, error=str(e))
    
    async def load_model(self, model_id: str) -> Dict[str, Any]:
        """
        Load a model into memory.
        
        Args:
            model_id: ID of the model to load
            
        Returns:
            Dict with success status and message
        """
        logger.info("Loading model", model=model_id)
        
        # Check if model is configured
        config = model_config.get_model_config(model_id)
        if not config:
            error_msg = f"Model {model_id} not found in configuration"
            logger.error(error_msg)
            return {"success": False, "message": error_msg, "model_id": model_id}
        
        # Check if model is already loaded
        if model_id in self._loaded_models:
            logger.info("Model already loaded", model=model_id)
            # Update access time
            self._loaded_models.move_to_end(model_id)
            return {"success": True, "message": "Model already loaded", "model_id": model_id}
        
        try:
            # Check if we need to unload models to make space
            await self._ensure_model_capacity(model_id)
            
            # Try to get model info from Ollama
            try:
                model_info = await ollama_client.show_model(model_id)
                logger.info("Model found in Ollama", model=model_id)
            except OllamaModelNotFoundError:
                # Model not found, try to pull it
                logger.info("Model not found in Ollama, attempting to pull", model=model_id)
                success = await ollama_client.pull_model(model_id)
                if not success:
                    error_msg = f"Failed to pull model {model_id}"
                    logger.error(error_msg)
                    return {"success": False, "message": error_msg, "model_id": model_id}
                
                model_info = await ollama_client.show_model(model_id)
            
            # Test the model with a simple generation
            test_result = await ollama_client.generate(
                model=model_id,
                prompt="Hello",
                timeout=30
            )
            
            # Mark model as loaded
            self._loaded_models[model_id] = {
                "config": config,
                "ollama_info": model_info,
                "loaded_at": time.time(),
                "last_used": time.time(),
                "status": "ready"
            }
            
            logger.info("Model loaded successfully", model=model_id)
            return {"success": True, "message": "Model loaded successfully", "model_id": model_id}
            
        except OllamaTimeoutError:
            error_msg = f"Timeout loading model {model_id}"
            logger.error(error_msg)
            return {"success": False, "message": error_msg, "model_id": model_id}
        except Exception as e:
            error_msg = f"Failed to load model {model_id}: {str(e)}"
            logger.error(error_msg, error=str(e))
            return {"success": False, "message": error_msg, "model_id": model_id}
    
    async def unload_model(self, model_id: str) -> Dict[str, Any]:
        """
        Unload a model from memory.
        
        Args:
            model_id: ID of the model to unload
            
        Returns:
            Dict with success status and message
        """
        logger.info("Unloading model", model=model_id)
        
        if model_id not in self._loaded_models:
            message = f"Model {model_id} is not loaded"
            logger.warning(message)
            return {"success": False, "message": message, "model_id": model_id}
        
        # Check if model has active requests
        if self._concurrent_requests[model_id] > 0:
            message = f"Model {model_id} has active requests, cannot unload"
            logger.warning(message, active_requests=self._concurrent_requests[model_id])
            return {"success": False, "message": message, "model_id": model_id}
        
        # Remove from loaded models
        del self._loaded_models[model_id]
        
        logger.info("Model unloaded successfully", model=model_id)
        return {"success": True, "message": "Model unloaded successfully", "model_id": model_id}
    
    async def _ensure_model_capacity(self, new_model_id: str) -> None:
        """Ensure there's capacity for a new model by unloading LRU models if needed."""
        max_models = settings.max_loaded_models
        
        if len(self._loaded_models) < max_models:
            return
        
        # Need to unload models - remove LRU models
        models_to_unload = len(self._loaded_models) - max_models + 1
        
        for _ in range(models_to_unload):
            if not self._loaded_models:
                break
            
            # Find model with no active requests
            lru_model = None
            for model_id in self._loaded_models:
                if self._concurrent_requests[model_id] == 0:
                    lru_model = model_id
                    break
            
            if lru_model:
                logger.info("Unloading LRU model to make space", 
                          lru_model=lru_model, 
                          new_model=new_model_id)
                await self.unload_model(lru_model)
            else:
                logger.warning("All loaded models have active requests, cannot unload any")
                break
    
    def get_loaded_models(self) -> List[str]:
        """Get list of currently loaded model IDs."""
        return list(self._loaded_models.keys())
    
    def get_model_status(self, model_id: str) -> str:
        """Get the status of a specific model."""
        if model_id in self._loaded_models:
            return self._loaded_models[model_id].get("status", "unknown")
        
        config = model_config.get_model_config(model_id)
        if config:
            return "available"
        
        return "unknown"
    
    def is_model_loaded(self, model_id: str) -> bool:
        """Check if a model is currently loaded."""
        return model_id in self._loaded_models
    
    def get_all_models_info(self) -> List[Dict[str, Any]]:
        """Get information about all configured models."""
        models_info = []
        enabled_models = model_config.get_enabled_models()
        
        for model_id, config in enabled_models.items():
            loaded = model_id in self._loaded_models
            
            model_info = {
                "id": model_id,
                "name": config.get("display_name", model_id),
                "status": "ready" if loaded else "available",
                "size_gb": config.get("size_gb", 0),
                "context_window": config.get("context_window", 2048),
                "supports_json": config.get("supports_json_mode", False),
                "loaded": loaded
            }
            
            models_info.append(model_info)
        
        return models_info
    
    async def start_inference(self, model_id: str) -> bool:
        """
        Mark the start of an inference request for a model.
        
        Args:
            model_id: Model ID
            
        Returns:
            bool: True if inference can proceed
        """
        if model_id not in self._loaded_models:
            return False
        
        config = model_config.get_model_config(model_id)
        max_concurrent = config.get("max_concurrent", 1) if config else 1
        
        if self._concurrent_requests[model_id] >= max_concurrent:
            logger.warning("Model at max concurrent requests", 
                          model=model_id, 
                          current=self._concurrent_requests[model_id],
                          max_allowed=max_concurrent)
            return False
        
        self._concurrent_requests[model_id] += 1
        
        # Update last used time
        self._loaded_models[model_id]["last_used"] = time.time()
        self._loaded_models.move_to_end(model_id)
        
        return True
    
    def end_inference(self, model_id: str) -> None:
        """Mark the end of an inference request for a model."""
        if self._concurrent_requests[model_id] > 0:
            self._concurrent_requests[model_id] -= 1


# Global model manager instance
model_manager = ModelManager()
