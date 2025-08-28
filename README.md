# Open Bench - Backend

A FastAPI-based backend for the Open Bench LLM evaluation platform.

## Features

- **Multi-Provider Support**: OpenAI, Anthropic, Google, Together AI, and more
- **Flexible Evaluation**: Exact match, structured matching, and LLM judge evaluation
- **Real-time Execution**: Async evaluation with progress tracking
- **Comprehensive Analytics**: Leaderboards, comparisons, and performance trends
- **Robust Architecture**: Layered design with proper error handling and logging
- **Production Ready**: Docker support, health checks, and monitoring

## Quick Start

### Using Docker Compose (Recommended)

1. Clone the repository:
```bash
git clone <repository-url>
cd openbench
```

2. Start the services:
```bash
docker-compose up -d
```

3. Run database migrations:
```bash
docker-compose exec backend alembic upgrade head
```

4. Access the API documentation:
- API Docs: http://localhost:8000/docs
- Health Check: http://localhost:8000/health

### Local Development

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Start PostgreSQL and Redis (or use Docker):
```bash
docker-compose up -d postgres redis
```

4. Run database migrations:
```bash
alembic upgrade head
```

5. Start the development server:
```bash
uvicorn app.main:app --reload
```

## Configuration

Key environment variables:

- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `OPENAI_API_KEY`: OpenAI API key
- `ANTHROPIC_API_KEY`: Anthropic API key
- `GOOGLE_API_KEY`: Google API key
- `TOGETHER_API_KEY`: Together AI API key
- `SECRET_KEY`: JWT secret key
- `ENVIRONMENT`: Environment (development/production)

## API Documentation

The API follows REST principles with the following main endpoints:

### Test Management
- `POST /api/v1/tests` - Create test case
- `GET /api/v1/tests/{id}` - Get test case
- `POST /api/v1/tests/{id}/run` - Run evaluation
- `GET /api/v1/tests/{id}/results` - Get results

### Model Management
- `GET /api/v1/models` - List models
- `GET /api/v1/models/{id}/performance` - Get performance metrics

### Benchmarking
- `GET /api/v1/leaderboard` - Global leaderboard
- `GET /api/v1/compare` - Compare models
- `GET /api/v1/analytics/trends` - Performance trends

### Admin
- `GET /api/v1/admin/pending` - Pending approvals
- `POST /api/v1/admin/approve` - Approve/reject tests

## Architecture

The backend follows a layered architecture:

1. **API Layer** (`app/api/`) - FastAPI routes and request/response handling
2. **Service Layer** (`app/services/`) - Business logic and orchestration
3. **Provider Layer** (`app/providers/`) - LLM provider abstractions
4. **Data Layer** (`app/models/`) - Database models and operations

### Key Services

- **EvaluationService**: Orchestrates model evaluations
- **ValidationService**: Validates and scores model outputs
- **AnalyticsService**: Generates performance metrics and insights

### Provider Support

The system supports multiple LLM providers through a unified interface:

- OpenAI (GPT-4, GPT-3.5)
- Anthropic (Claude 3)
- Google (Gemini)
- Together AI (Open models)

## Database Schema

Key tables:

- `users` - User accounts and authentication
- `models` - LLM model registry
- `test_cases` - Test definitions and schemas
- `test_results` - Individual evaluation results
- `executions` - Batch execution tracking

## Development

### Running Tests

```bash
pytest
```

### Database Migrations

Create a new migration:
```bash
alembic revision --autogenerate -m "Description"
```

Apply migrations:
```bash
alembic upgrade head
```

### Code Style

The project uses:
- Black for code formatting
- isort for import sorting
- flake8 for linting

## Deployment

### Railway (Recommended)

1. Connect your GitHub repository to Railway
2. Set environment variables in Railway dashboard
3. Deploy automatically on push

### Docker

Build and run the production image:

```bash
docker build -t openbench-backend .
docker run -p 8000:8000 openbench-backend
```

## Monitoring

The application includes:

- Health check endpoints (`/health`, `/ready`)
- Structured logging with correlation IDs
- Error tracking with Sentry integration
- Performance metrics collection

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with tests
4. Submit a pull request

## License

[License information here]
