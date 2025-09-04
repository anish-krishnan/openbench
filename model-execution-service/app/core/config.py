"""
Configuration management for Model Execution Service
"""
import json
import os
from typing import Dict, Any, Optional

from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings."""
    
    # API Configuration
    api_key: str = Field(default="mes-dev-key-123", env="API_KEY")
    
    # Ollama Configuration
    ollama_host: str = Field(default="http://ollama:11434", env="OLLAMA_HOST")
    ollama_timeout: int = Field(default=60, env="OLLAMA_TIMEOUT")
    
    # Service Configuration
    max_loaded_models: int = Field(default=2, env="MAX_LOADED_MODELS")
    default_timeout: int = Field(default=30, env="DEFAULT_TIMEOUT")
    port: int = Field(default=8001, env="PORT")
    
    # Logging
    log_level: str = Field(default="INFO", env="LOG_LEVEL")
    
    # Model Configuration
    models_config_path: str = Field(
        default="/app/config/models.json",
        env="MODELS_CONFIG_PATH"
    )
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


class ModelConfig:
    """Model configuration manager."""
    
    def __init__(self, config_path: str):
        self.config_path = config_path
        self._config: Optional[Dict[str, Any]] = None
    
    def load_config(self) -> Dict[str, Any]:
        """Load model configuration from file."""
        try:
            with open(self.config_path, 'r') as f:
                self._config = json.load(f)
            return self._config
        except FileNotFoundError:
            # Return default configuration if file not found
            return self._get_default_config()
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON in model config: {e}")
    
    def _get_default_config(self) -> Dict[str, Any]:
        """Get default model configuration."""
        return {
            "models": {
                "llama3.1:8b": {
                    "display_name": "Llama 3.1 8B",
                    "enabled": True,
                    "preload": True,
                    "max_concurrent": 3,
                    "timeout": 30,
                    "size_gb": 4.7,
                    "min_memory_gb": 8,
                    "context_window": 8192,
                    "supports_json_mode": True,
                    "default_temperature": 0.7
                }
            },
            "defaults": {
                "temperature": 0.7,
                "max_tokens": 1000,
                "timeout": 30
            }
        }
    
    def get_model_config(self, model_id: str) -> Optional[Dict[str, Any]]:
        """Get configuration for a specific model."""
        if self._config is None:
            self.load_config()
        
        return self._config.get("models", {}).get(model_id)
    
    def get_enabled_models(self) -> Dict[str, Any]:
        """Get all enabled models."""
        if self._config is None:
            self.load_config()
        
        models = self._config.get("models", {})
        return {
            model_id: config
            for model_id, config in models.items()
            if config.get("enabled", False)
        }
    
    def get_preload_models(self) -> list[str]:
        """Get list of models to preload on startup."""
        enabled_models = self.get_enabled_models()
        return [
            model_id
            for model_id, config in enabled_models.items()
            if config.get("preload", False)
        ]
    
    def get_defaults(self) -> Dict[str, Any]:
        """Get default configuration values."""
        if self._config is None:
            self.load_config()
        
        return self._config.get("defaults", {
            "temperature": 0.7,
            "max_tokens": 1000,
            "timeout": 30
        })


# Global settings instance
settings = Settings()

# Global model config instance
model_config = ModelConfig(settings.models_config_path)
