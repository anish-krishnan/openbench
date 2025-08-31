# Model Execution Service (MES)

A local model execution service for Open Bench that manages and serves open-source models using Ollama.

## Features

- 🚀 **Fast Local Execution** - Run models locally with Ollama
- 🔄 **Dynamic Model Management** - Load/unload models on demand
- 📊 **Structured Output** - JSON schema validation support
- 🔒 **Secure API** - API key authentication
- 📈 **Resource Management** - LRU model caching with configurable limits
- 🏥 **Health Monitoring** - Comprehensive health checks and status reporting

## Quick Start

### Prerequisites

- Docker and Docker Compose
- At least 16GB RAM (32GB recommended)
- NVIDIA GPU with 8GB+ VRAM (optional but recommended)

### Setup

1. **Clone and navigate to the service directory:**
   ```bash
   cd model-execution-service
   ```

2. **Copy environment configuration:**
   ```bash
   cp env.example .env
   ```

3. **Start the services:**
   ```bash
   docker-compose up -d
   ```

4. **Check service health:**
   ```bash
   curl http://localhost:8001/health
   ```

### First Model Setup

The service will automatically try to load configured models. To manually pull a model:

```bash
docker-compose exec ollama ollama pull llama3.1:8b
```

## API Usage

### Authentication

All API endpoints (except health checks) require authentication via the `Authorization` header:

```bash
curl -H "Authorization: Bearer your-api-key" http://localhost:8001/v1/models
```

### List Available Models

```bash
curl -H "Authorization: Bearer mes-dev-key-123" \
     http://localhost:8001/v1/models
```

### Load a Model

```bash
curl -X POST \
     -H "Authorization: Bearer mes-dev-key-123" \
     http://localhost:8001/v1/models/llama3.1:8b/load
```

### Perform Inference

```bash
curl -X POST \
     -H "Authorization: Bearer mes-dev-key-123" \
     -H "Content-Type: application/json" \
     -d '{
       "model_id": "llama3.1:8b",
       "prompt": "What is the capital of France?",
       "temperature": 0.7,
       "max_tokens": 100
     }' \
     http://localhost:8001/v1/inference
```

### Inference with JSON Schema

```bash
curl -X POST \
     -H "Authorization: Bearer mes-dev-key-123" \
     -H "Content-Type: application/json" \
     -d '{
       "model_id": "llama3.1:8b",
       "prompt": "Extract the name and age from: John Smith is 25 years old",
       "json_schema": {
         "type": "object",
         "properties": {
           "name": {"type": "string"},
           "age": {"type": "number"}
         },
         "required": ["name", "age"]
       }
     }' \
     http://localhost:8001/v1/inference
```

### Check Service Status

```bash
curl -H "Authorization: Bearer mes-dev-key-123" \
     http://localhost:8001/v1/status
```

## Configuration

### Environment Variables

- `MES_API_KEY` - API key for authentication (default: mes-dev-key-123)
- `OLLAMA_HOST` - Ollama service URL (default: http://ollama:11434)
- `MAX_LOADED_MODELS` - Maximum models to keep in memory (default: 2)
- `DEFAULT_TIMEOUT` - Default request timeout in seconds (default: 30)
- `LOG_LEVEL` - Logging level (default: INFO)
- `PORT` - Service port (default: 8001)

### Model Configuration

Edit `config/models.json` to configure available models:

```json
{
  "models": {
    "llama3.1:8b": {
      "display_name": "Llama 3.1 8B",
      "enabled": true,
      "preload": true,
      "max_concurrent": 3,
      "timeout": 30,
      "supports_json_mode": true
    }
  },
  "defaults": {
    "temperature": 0.7,
    "max_tokens": 1000
  }
}
```

## API Endpoints

### Health & Status

- `GET /health` - Basic health check
- `GET /ready` - Readiness check (includes Ollama status)
- `GET /v1/status` - Detailed service status (requires auth)

### Model Management

- `GET /v1/models` - List all available models
- `POST /v1/models/{model_id}/load` - Load a model into memory
- `POST /v1/models/{model_id}/unload` - Unload a model from memory

### Inference

- `POST /v1/inference` - Perform text generation

## Architecture

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

### Key Components

1. **FastAPI Service** - HTTP API server handling requests
2. **Model Manager** - Handles model loading/unloading with LRU caching
3. **Inference Service** - Processes generation requests with schema validation
4. **Ollama Client** - HTTP client for Ollama API communication
5. **Ollama Instance** - Local model runtime (separate container)

## Development

### Local Development Setup

1. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Start Ollama locally:**
   ```bash
   docker run -d -p 11434:11434 --name ollama ollama/ollama
   ```

3. **Set environment variables:**
   ```bash
   export OLLAMA_HOST=http://localhost:11434
   export MES_API_KEY=dev-key-123
   ```

4. **Run the service:**
   ```bash
   python -m app.main
   ```

### Running Tests

```bash
pytest tests/
```

## Monitoring

### Logs

Service logs are structured JSON format. View logs with:

```bash
docker-compose logs -f mes
```

### Metrics

Key metrics to monitor:
- Request latency per model
- Memory usage
- Model loading/unloading frequency
- Error rates
- Concurrent request counts

## Troubleshooting

### Common Issues

1. **"Ollama is not accessible"**
   - Check if Ollama container is running: `docker-compose ps`
   - Check Ollama logs: `docker-compose logs ollama`

2. **"Model not found"**
   - Check if model is pulled: `docker-compose exec ollama ollama list`
   - Pull model manually: `docker-compose exec ollama ollama pull model:tag`

3. **"Out of memory" errors**
   - Reduce `MAX_LOADED_MODELS`
   - Use smaller models
   - Add more RAM or use GPU

4. **Slow inference**
   - Enable GPU support in docker-compose.yml
   - Use smaller models
   - Reduce max_tokens

### Performance Tuning

1. **GPU Acceleration:** Uncomment GPU configuration in docker-compose.yml
2. **Memory Optimization:** Adjust MAX_LOADED_MODELS based on available RAM
3. **Concurrent Requests:** Configure max_concurrent per model in models.json

## Security

- Change default API key in production
- Use HTTPS in production
- Restrict network access to authorized clients
- Monitor resource usage to prevent abuse

## License

This project is part of Open Bench and follows the same licensing terms.
