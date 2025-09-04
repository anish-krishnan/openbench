# OpenBench Backend API

A FastAPI-based backend service for the OpenBench LLM evaluation platform.

## Features

- **Multi-Provider Support**: OpenAI, Anthropic, Google, Together AI, and local models
- **Flexible Evaluation**: Exact match, structured matching, and LLM judge evaluation
- **Real-time Execution**: Async evaluation with progress tracking
- **Comprehensive Analytics**: Leaderboards, comparisons, and performance trends
- **Robust Architecture**: Layered design with proper error handling and logging
- **Production Ready**: Docker support, health checks, and monitoring

## Quick Start

### Prerequisites

- Python 3.11+
- PostgreSQL 15+
- Redis 7+

### Installation

1. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start PostgreSQL and Redis** (or use Docker):
   ```bash
   docker-compose up -d postgres redis
   ```

4. **Run database migrations**:
   ```bash
   alembic upgrade head
   ```

5. **Start the development server**:
   ```bash
   uvicorn app.main:app --reload
   ```

### Using Docker Compose

From the project root:

```bash
# Start all backend services
docker-compose up -d

# Run database migrations
docker-compose exec backend alembic upgrade head

# Access the API documentation
open http://localhost:8000/docs
```

## Configuration

### Environment Variables

```env
# Database
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/openbench
REDIS_URL=redis://localhost:6379

# LLM Provider API Keys
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
GOOGLE_API_KEY=your-google-api-key
TOGETHER_API_KEY=your-together-api-key

# Security
SECRET_KEY=your-jwt-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Application
ENVIRONMENT=development
DEBUG=true
LOG_LEVEL=INFO

# Model Execution Service (if using local models)
MES_API_URL=http://localhost:8001
MES_API_KEY=mes-dev-key-123
```

## API Documentation

The API follows REST principles with the following main endpoints:

### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration
- `GET /api/v1/auth/me` - Get current user

### Test Management
- `POST /api/v1/tests` - Create test case
- `GET /api/v1/tests` - List test cases
- `GET /api/v1/tests/{id}` - Get test case details
- `PUT /api/v1/tests/{id}` - Update test case
- `DELETE /api/v1/tests/{id}` - Delete test case
- `POST /api/v1/tests/{id}/run` - Run evaluation

### Model Management
- `GET /api/v1/models` - List available models
- `POST /api/v1/models` - Add new model
- `GET /api/v1/models/{id}` - Get model details
- `GET /api/v1/models/{id}/performance` - Get performance metrics

### Execution Management
- `GET /api/v1/executions` - List executions
- `GET /api/v1/executions/{id}` - Get execution details
- `GET /api/v1/executions/{id}/results` - Get execution results
- `POST /api/v1/executions/{id}/cancel` - Cancel execution

### Analytics & Leaderboard
- `GET /api/v1/leaderboard` - Global leaderboard
- `GET /api/v1/analytics/trends` - Performance trends
- `GET /api/v1/analytics/compare` - Compare models

### Admin
- `GET /api/v1/admin/pending` - Pending test approvals
- `POST /api/v1/admin/approve/{test_id}` - Approve test
- `POST /api/v1/admin/reject/{test_id}` - Reject test
- `GET /api/v1/admin/stats` - Admin statistics

### Health & Monitoring
- `GET /health` - Basic health check
- `GET /ready` - Readiness check (includes database connectivity)
- `GET /metrics` - Prometheus metrics (if enabled)

## Architecture

The backend follows a layered architecture:

```
app/
├── api/                    # API Layer - FastAPI routes
│   ├── dependencies.py    # Shared dependencies
│   └── v1/               # API version 1
│       ├── admin.py      # Admin endpoints
│       ├── benchmark.py  # Benchmarking endpoints
│       ├── models.py     # Model management
│       └── tests.py      # Test management
├── core/                  # Core utilities
│   ├── database.py       # Database configuration
│   ├── exceptions.py     # Custom exceptions
│   └── logging.py        # Logging configuration
├── models/               # Data Layer - SQLAlchemy models
│   ├── execution.py      # Execution models
│   ├── model.py          # Model registry
│   ├── test_case.py      # Test case models
│   ├── test_result.py    # Result models
│   └── user.py           # User models
├── providers/            # Provider Layer - LLM integrations
│   ├── base.py           # Base provider interface
│   ├── factory.py        # Provider factory
│   ├── openai_provider.py
│   ├── anthropic_provider.py
│   ├── google_provider.py
│   ├── together_provider.py
│   └── mes_provider.py   # Model Execution Service
├── schemas/              # Pydantic schemas
│   ├── common.py         # Shared schemas
│   ├── execution.py      # Execution schemas
│   ├── model.py          # Model schemas
│   ├── test_case.py      # Test case schemas
│   ├── test_result.py    # Result schemas
│   └── user.py           # User schemas
├── services/             # Service Layer - Business logic
│   ├── analytics.py      # Analytics service
│   ├── evaluation.py     # Evaluation orchestration
│   └── validation.py     # Result validation
├── config.py             # Application configuration
└── main.py               # FastAPI application entry point
```

### Key Services

#### EvaluationService
Orchestrates the evaluation process:
- Manages test execution lifecycles
- Coordinates with LLM providers
- Handles async execution with progress tracking
- Implements retry logic and error handling

#### ValidationService
Validates and scores model outputs:
- Exact match validation
- Structured output validation (JSON schema)
- LLM judge evaluation
- Custom scoring functions

#### AnalyticsService
Generates performance metrics and insights:
- Leaderboard calculations
- Performance trend analysis
- Model comparison statistics
- Aggregated metrics

### Provider Support

The system supports multiple LLM providers through a unified interface:

- **OpenAI**: GPT-4, GPT-3.5-turbo, GPT-4-turbo
- **Anthropic**: Claude 3 (Opus, Sonnet, Haiku)
- **Google**: Gemini Pro, Gemini Pro Vision
- **Together AI**: Various open-source models
- **Local Models**: Via Model Execution Service (Ollama)

Each provider implements the `BaseProvider` interface with consistent methods for:
- Text generation
- Structured output (JSON mode)
- Token counting
- Error handling

## Database Schema

### Core Tables

- **users** - User accounts and authentication
- **models** - LLM model registry and metadata
- **test_cases** - Test definitions and validation schemas
- **executions** - Batch execution tracking
- **test_results** - Individual evaluation results

### Key Relationships

```sql
users 1:N test_cases
test_cases 1:N executions
executions 1:N test_results
models 1:N test_results
```

### Indexes

Critical indexes for performance:
- `test_results(model_id, created_at)` - Leaderboard queries
- `executions(status, created_at)` - Active execution tracking
- `test_cases(status, created_at)` - Public test listing

## Development

### Running Tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app tests/

# Run specific test file
pytest tests/test_evaluation.py
```

### Database Migrations

```bash
# Create a new migration
alembic revision --autogenerate -m "Description of changes"

# Apply migrations
alembic upgrade head

# Rollback migration
alembic downgrade -1
```

### Code Quality

The project uses several tools for code quality:

```bash
# Format code
black app/ tests/

# Sort imports
isort app/ tests/

# Lint code
flake8 app/ tests/

# Type checking
mypy app/
```

### Adding New Providers

1. Create a new provider class inheriting from `BaseProvider`
2. Implement required methods (`generate`, `count_tokens`, etc.)
3. Add provider configuration to `ProviderFactory`
4. Add environment variables for API keys
5. Update documentation

Example:
```python
# app/providers/new_provider.py
from .base import BaseProvider

class NewProvider(BaseProvider):
    def __init__(self, api_key: str):
        self.api_key = api_key
    
    async def generate(self, prompt: str, **kwargs) -> str:
        # Implementation here
        pass
```

## Deployment

### Production Configuration

```env
# Production settings
ENVIRONMENT=production
DEBUG=false
LOG_LEVEL=WARNING

# Database with connection pooling
DATABASE_URL=postgresql+asyncpg://user:pass@prod-db:5432/openbench?pool_size=20&max_overflow=30

# Redis with persistence
REDIS_URL=redis://prod-redis:6379/0

# Security
SECRET_KEY=very-secure-production-key
CORS_ORIGINS=["https://openbench.com"]
```

### Health Checks

The application provides comprehensive health checks:

- **`/health`**: Basic liveness check
- **`/ready`**: Readiness check including:
  - Database connectivity
  - Redis connectivity
  - Provider API availability

### Monitoring

Integration points for monitoring:

- **Structured Logging**: JSON logs with correlation IDs
- **Metrics**: Request latency, error rates, provider performance
- **Tracing**: OpenTelemetry compatible tracing
- **Alerts**: Database connection, provider failures, high error rates

### Scaling Considerations

- **Database**: Use read replicas for analytics queries
- **Cache**: Redis cluster for high availability
- **Workers**: Horizontal scaling with load balancer
- **Background Jobs**: Celery with Redis broker for long-running tasks

## Security

### Authentication & Authorization

- JWT tokens for API authentication
- OAuth integration for web interface
- Role-based access control (RBAC)
- API key authentication for programmatic access

### Data Protection

- Input validation with Pydantic schemas
- SQL injection prevention with SQLAlchemy ORM
- XSS protection with proper content types
- Rate limiting on public endpoints

### API Keys

- Provider API keys stored securely
- Rotation procedures documented
- Separate keys for development/production
- Monitoring for key usage and limits

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   ```bash
   # Check database status
   docker-compose logs postgres
   
   # Test connection
   psql postgresql://user:pass@localhost:5432/openbench
   ```

2. **Provider API Errors**
   ```bash
   # Check API key configuration
   echo $OPENAI_API_KEY
   
   # Test provider connectivity
   curl -H "Authorization: Bearer $OPENAI_API_KEY" https://api.openai.com/v1/models
   ```

3. **Redis Connection Issues**
   ```bash
   # Check Redis status
   docker-compose logs redis
   
   # Test connection
   redis-cli ping
   ```

### Performance Debugging

- Enable SQL query logging for slow queries
- Monitor provider response times
- Check database connection pool usage
- Profile memory usage during large evaluations

## Contributing

1. Follow the established architecture patterns
2. Add tests for new functionality
3. Update API documentation
4. Ensure type hints are complete
5. Follow the code style guidelines

## License

This project is part of OpenBench and follows the same licensing terms.
