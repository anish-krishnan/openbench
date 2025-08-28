"""
Configuration management for Open Bench backend.
"""
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings with environment variable support."""
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False
    )
    
    # Database Configuration
    database_url: str = "postgresql+asyncpg://user:password@localhost:5432/openbench"
    supabase_url: Optional[str] = None
    supabase_anon_key: Optional[str] = None
    supabase_service_key: Optional[str] = None
    
    # Redis Configuration
    redis_url: str = "redis://localhost:6379"
    
    # LLM Provider API Keys
    openai_api_key: Optional[str] = None
    anthropic_api_key: Optional[str] = None
    google_api_key: Optional[str] = None
    together_api_key: Optional[str] = None
    replicate_api_token: Optional[str] = None
    
    # Application Configuration
    environment: str = "development"
    secret_key: str = "dev-secret-key-change-in-production"
    api_version: str = "v1"
    debug: bool = True
    
    # Rate Limiting
    rate_limit_free_tier: int = 10
    rate_limit_pro_tier: int = 100
    
    # Monitoring
    sentry_dsn: Optional[str] = None
    
    # Execution Configuration
    max_concurrent_evaluations: int = 10
    max_total_concurrent_calls: int = 50
    evaluation_timeout: int = 30
    test_run_timeout: int = 120
    
    # Cache Configuration
    cache_ttl_tests: int = 300  # 5 minutes
    cache_ttl_models: int = 3600  # 1 hour
    cache_ttl_leaderboard: int = 300  # 5 minutes
    
    @property
    def is_development(self) -> bool:
        return self.environment.lower() == "development"
    
    @property
    def is_production(self) -> bool:
        return self.environment.lower() == "production"


# Global settings instance
settings = Settings()
