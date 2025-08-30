# Open Bench - Model Execution Service (MES) Design

## Executive Summary

This document presents a design for the Model Execution Service that will host and manage open source models for Open Bench. The service focuses on essential functionality with local storage and minimal dependencies, enabling rapid deployment while maintaining a clear path for future scaling.

## Core Architecture

### System Overview

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│                 │     │                  │     │                 │
│  Main Backend   │────▶│  Model Execution │────▶│     Ollama      │
│   (FastAPI)     │     │    Service       │     │    Instance     │
│                 │     │   (FastAPI)      │     │                 │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                │
                                ▼
                        ┌──────────────────┐
                        │                  │
                        │  Local Storage   │
                        │  (Docker Volume) │
                        │                  │
                        └──────────────────┘
```

### Design Principles

1. **Simplicity First** - Minimal dependencies and straightforward implementation
2. **Local Execution** - All models stored and executed locally
3. **Synchronous Operations** - No complex queuing or caching initially
4. **Single Ollama Instance** - One Ollama process managing all models
5. **Direct Integration** - Simple HTTP API matching main backend patterns

## Service Responsibilities

### Primary Functions

1. **Model Management**
   - Load/unload models into Ollama
   - Track available models and their status
   - Report model capabilities and requirements

2. **Inference Execution**
   - Process inference requests from main backend
   - Handle structured output formatting
   - Return normalized responses

3. **Health Monitoring**
   - Track Ollama process health
   - Monitor available system resources
   - Report service status

## Technology Stack

- **Framework**: FastAPI (matching main backend)
- **Model Runtime**: Ollama (latest stable version)
- **Storage**: Docker volumes for model persistence
- **Container**: Docker with docker-compose
- **Python Version**: 3.11+ (matching main backend)

## API Specification

### Authentication
- Simple API key authentication via header: `X-API-Key`
- Single shared key between main backend and MES
- Key stored in environment variables

### Core Endpoints

#### Model Management

**GET `/v1/models`**
```json
Response:
{
  "models": [
    {
      "id": "llama3.1:8b",
      "name": "Llama 3.1 8B",
      "status": "ready",
      "size_gb": 4.7,
      "context_window": 8192,
      "supports_json": true,
      "loaded": true
    }
  ]
}
```

**POST `/v1/models/{model_id}/load`**
- Loads specified model into memory
- Returns success/failure status
- Blocks until model is ready

**POST `/v1/models/{model_id}/unload`**
- Unloads model from memory
- Frees resources for other models

#### Inference

**POST `/v1/inference`**
```json
Request:
{
  "model_id": "llama3.1:8b",
  "prompt": "...",
  "system_prompt": "...",
  "temperature": 0.7,
  "max_tokens": 1000,
  "json_schema": {...},  // Optional
  "timeout": 30  // seconds
}

Response:
{
  "success": true,
  "output": "...",
  "usage": {
    "prompt_tokens": 150,
    "completion_tokens": 200,
    "total_tokens": 350
  },
  "latency_ms": 2500,
  "model_id": "llama3.1:8b"
}
```

#### Health & Status

**GET `/health`**
- Basic liveness check
- Returns 200 if service is running

**GET `/ready`**
- Readiness check including Ollama status
- Returns 200 if ready to serve requests

**GET `/v1/status`**
```json
Response:
{
  "ollama_running": true,
  "models_loaded": ["llama3.1:8b"],
  "memory_available_gb": 12.5,
  "gpu_available": true,
  "version": "1.0.0"
}
```

## Model Registry

### Initial Model Set

Start with a focused set of well-tested models:

1. **Llama 3.1 8B** - General purpose, good structured output
2. **Mistral 7B** - Fast, reliable JSON generation
3. **Phi-3 Mini** - Lightweight, CPU-friendly
4. **CodeLlama 7B** - Code-specific tasks
5. **Gemma 2B** - Ultra-light for high throughput

### Model Configuration

Each model requires a configuration entry:

```json
{
  "llama3.1:8b": {
    "display_name": "Llama 3.1 8B",
    "ollama_tag": "llama3.1:8b",
    "size_gb": 4.7,
    "min_memory_gb": 8,
    "context_window": 8192,
    "supports_json_mode": true,
    "default_temperature": 0.7,
    "timeout_seconds": 30,
    "concurrent_requests": 3
  }
}
```

## Deployment Configuration

### Docker Setup

**docker-compose.yml structure:**
```yaml
services:
  mes:
    build: .
    environment:
      - API_KEY=${MES_API_KEY}
      - OLLAMA_HOST=http://ollama:11434
      - MAX_LOADED_MODELS=2
      - DEFAULT_TIMEOUT=30
    volumes:
      - ./config:/app/config
    depends_on:
      - ollama
  
  ollama:
    image: ollama/ollama:latest
    volumes:
      - ollama_models:/root/.ollama
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
```

### Resource Requirements

**Minimum Requirements:**
- CPU: 8 cores
- RAM: 32GB
- Storage: 100GB SSD
- GPU: Optional but recommended (NVIDIA with 8GB+ VRAM)

**Recommended Requirements:**
- CPU: 16 cores
- RAM: 64GB
- Storage: 500GB NVMe SSD
- GPU: NVIDIA RTX 3090 or better (24GB VRAM)

### Environment Variables

```
MES_API_KEY=<secure-random-key>
OLLAMA_HOST=http://ollama:11434
MAX_LOADED_MODELS=2
DEFAULT_TIMEOUT=30
LOG_LEVEL=INFO
PORT=8001
```

## Implementation Strategy

### Model Loading Policy

**Simple LRU Strategy:**
1. Keep up to `MAX_LOADED_MODELS` in memory
2. When loading a new model that would exceed limit:
   - Unload least recently used model
   - Load requested model
3. Track last usage time for each model
4. Pre-load popular models on startup

### Error Handling

**Timeout Handling:**
- Set aggressive timeout (30s default)
- Kill long-running requests
- Return timeout error to main backend
- Main backend handles retry logic

**Model Loading Failures:**
- Retry once with backoff
- If persistent failure, mark model as unavailable
- Continue serving other models
- Alert monitoring system

**Ollama Process Crashes:**
- Automatic restart via Docker
- Graceful degradation during restart
- Queue requests briefly (max 10 seconds)
- Return 503 if Ollama unavailable

### Structured Output Handling

**Approach for JSON Generation:**

1. **Native JSON Mode** (if model supports):
   - Pass schema to model directly
   - Use Ollama's JSON mode flag

2. **Prompt Engineering** (fallback):
   - Inject schema into system prompt
   - Add explicit JSON formatting instructions
   - Parse and validate response

3. **Response Processing:**
   - Attempt JSON parsing
   - Extract JSON from markdown code blocks if needed
   - Validate against provided schema
   - Return parsing errors to main backend

### Integration with Main Backend

**Provider Adapter Implementation:**

The main backend needs a simple adapter for MES:

```python
class ModelExecutionServiceProvider:
    def __init__(self, base_url, api_key):
        self.base_url = base_url
        self.api_key = api_key
    
    async def complete(self, prompt, model_id, **kwargs):
        # POST to /v1/inference
        # Handle response normalization
        # Return in standard format
```

**Connection Configuration:**
- Single MES endpoint URL
- Shared API key for authentication
- Timeout configuration (30s default)
- Retry policy handled by main backend

## Monitoring & Logging

### Key Metrics to Track

**Request Metrics:**
- Total requests per model
- Success/failure rates
- Average latency per model
- Timeout frequency

**Resource Metrics:**
- Memory usage (RAM and VRAM)
- Models currently loaded
- Model loading/unloading frequency
- Disk usage for model storage

**Error Tracking:**
- Failed inference requests
- Model loading failures
- Ollama process restarts
- Schema validation failures

### Logging Configuration

**Structured Logging:**
- JSON format for easy parsing
- Include request_id for tracing
- Log level: INFO for production
- Separate log files for access and application

**Log Rotation:**
- Daily rotation
- Keep 7 days of logs
- Compress older logs

## Operational Procedures

### Startup Sequence

1. Verify Ollama is running
2. Check available resources
3. Load configuration file
4. Pre-load specified models
5. Start health check endpoint
6. Begin accepting requests

### Adding New Models

1. Pull model using Ollama CLI: `ollama pull model:tag`
2. Add configuration to `models.json`
3. Test model with sample requests
4. Reload configuration (no restart needed)
5. Model available for inference

### Maintenance Tasks

**Daily:**
- Monitor error rates
- Check disk usage
- Review slow query logs

**Weekly:**
- Update Ollama if new version available
- Clean up unused model files
- Review resource utilization

**Monthly:**
- Test disaster recovery procedure
- Update model versions if available
- Performance benchmarking

## Future Enhancement Path

### Phase 1 (Current) - Basic Functionality
- Single Ollama instance
- Local storage only
- Synchronous processing
- Simple LRU model management

### Phase 2 - Reliability Improvements
- Health check automation
- Better error recovery
- Request queuing for overload
- Model warm-up procedures

### Phase 3 - Performance Optimization
- Redis caching for repeated queries
- Multiple Ollama instances
- Load balancing
- Concurrent request handling

### Phase 4 - Scale & Advanced Features
- S3 model storage
- Kubernetes deployment
- Auto-scaling based on load
- Advanced routing algorithms

## Risk Mitigation

| Risk | Impact | Simple Mitigation |
|------|--------|------------------|
| Ollama crashes | High | Docker restart policy, health checks |
| Model won't load | Medium | Pre-tested model list, fallback models |
| Timeout issues | Medium | Aggressive timeouts, kill long requests |
| Memory exhaustion | High | Strict model limits, resource monitoring |
| Slow inference | Medium | Model selection, timeout handling |

## Success Criteria

### Functional Requirements
- Successfully serve inference for 5+ models
- Handle structured output validation
- Maintain 99% uptime during business hours
- Response time <30s for 95% of requests

### Operational Requirements
- Single command deployment
- No external dependencies beyond Docker
- Clear error messages for debugging
- Simple model addition process

## Configuration Files

### models.json Structure
Location: `/app/config/models.json`

```json
{
  "models": {
    "llama3.1:8b": {
      "display_name": "Llama 3.1 8B",
      "enabled": true,
      "preload": true,
      "max_concurrent": 3,
      "timeout": 30
    }
  },
  "defaults": {
    "temperature": 0.7,
    "max_tokens": 1000
  }
}
```

### Settings Structure
Location: Environment variables or `/app/config/settings.json`

```json
{
  "ollama": {
    "host": "http://ollama:11434",
    "healthcheck_interval": 30
  },
  "service": {
    "max_loaded_models": 2,
    "default_timeout": 30,
    "port": 8001
  }
}
```

## Development Guidelines

### Local Development Setup

1. Install Docker and Docker Compose
2. Clone repository
3. Copy `.env.example` to `.env`
4. Run `docker-compose up`
5. Service available at `http://localhost:8001`

### Testing Requirements

**Unit Tests:**
- API endpoint validation
- Response parsing logic
- Model configuration loading

**Integration Tests:**
- Full inference flow with test model
- Error handling scenarios
- Timeout behavior

**Load Tests:**
- Concurrent request handling
- Model switching under load
- Memory usage under stress

This design provides a solid foundation for the Model Execution Service while maintaining flexibility for future enhancements. The focus on local execution and minimal dependencies ensures quick deployment and easy debugging while the team gains operational experience with the system.