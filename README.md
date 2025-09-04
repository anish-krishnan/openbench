# OpenBench

A comprehensive LLM evaluation platform for testing and benchmarking language models across various tasks and providers.

## 🚀 Overview

OpenBench is a full-stack platform designed to evaluate and benchmark Large Language Models (LLMs) from multiple providers. It consists of three main components:

- **Backend API** (`app/`) - FastAPI-based backend with multi-provider support
- **Frontend** (`frontend/`) - Modern Next.js web interface
- **Model Execution Service** (`model-execution-service/`) - Local model execution using Ollama

## ✨ Features

- **Multi-Provider Support**: OpenAI, Anthropic, Google, Together AI, and local models via Ollama
- **Flexible Evaluation**: Exact match, structured matching, and LLM judge evaluation
- **Real-time Updates**: Live execution tracking and result updates
- **Comprehensive Analytics**: Leaderboards, model comparisons, and performance trends
- **Modern UI**: Responsive web interface with dark mode support
- **Admin Dashboard**: Content moderation and test approval workflows
- **Local Model Support**: Run open-source models locally with the Model Execution Service

## 🏗️ Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│                 │     │                  │     │                 │
│   Frontend      │────▶│   Backend API    │────▶│   PostgreSQL    │
│   (Next.js)     │     │   (FastAPI)      │     │   Database      │
│   Port: 3000    │     │   Port: 8000     │     │   Port: 5432    │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                │                           │
                                │                           │
                                ▼                           ▼
                        ┌──────────────────┐     ┌─────────────────┐
                        │                  │     │                 │
                        │ Model Execution  │     │     Redis       │
                        │    Service       │     │    Cache        │
                        │   Port: 8001     │     │   Port: 6379    │
                        └──────────────────┘     └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for frontend development)
- Python 3.11+ (for backend development)
- At least 16GB RAM (32GB recommended for local models)

### 1. Clone the Repository

```bash
git clone <repository-url>
cd openbench
```

### 2. Start the Backend Services

```bash
# Start PostgreSQL, Redis, and the Backend API
docker-compose up -d

# Run database migrations
docker-compose exec backend alembic upgrade head
```

### 3. Start the Model Execution Service (Optional)

If you want to run local models via Ollama:

```bash
cd model-execution-service
docker-compose up -d

# Pull your first model
docker-compose exec ollama ollama pull llama3.1:8b
```

### 4. Start the Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local with your configuration
npm run dev
```

### 5. Access the Applications

- **Frontend**: http://localhost:3000
- **Backend API Docs**: http://localhost:8000/docs
- **Model Execution Service**: http://localhost:8001/docs (if running)

## 🔧 Configuration

### Environment Variables

Create `.env` files in the root directory with:

```env
# Database
DATABASE_URL=postgresql+asyncpg://openbench:openbench_dev_password@localhost:5432/openbench
REDIS_URL=redis://localhost:6379

# API Keys for LLM Providers
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key
GOOGLE_API_KEY=your-google-key
TOGETHER_API_KEY=your-together-key

# Security
SECRET_KEY=your-jwt-secret-key
ENVIRONMENT=development
```

### Frontend Configuration

In `frontend/.env.local`:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret

# OAuth Providers (optional)
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Supabase for Real-time (optional)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Model Execution Service

In `model-execution-service/.env`:

```env
MES_API_KEY=mes-dev-key-123
OLLAMA_HOST=http://ollama:11434
MAX_LOADED_MODELS=2
LOG_LEVEL=INFO
```

## 📚 Documentation

- [Backend Technical Design](docs/backend-technical-design.md)
- [Frontend Technical Design](docs/frontend-technical-design.md)
- [Model Execution Service Design](docs/model-execution-service-design.md)
- [Backend API Documentation](app/README.md)
- [Frontend Documentation](frontend/README.md)
- [Model Execution Service Documentation](model-execution-service/README.md)

## 🛠️ Development

### Backend Development

```bash
# Install dependencies
pip install -r requirements.txt

# Start services
docker-compose up -d postgres redis

# Run migrations
alembic upgrade head

# Start development server
uvicorn app.main:app --reload
```

### Frontend Development

```bash
cd frontend
npm install
npm run dev
```

### Model Execution Service Development

```bash
cd model-execution-service
pip install -r requirements.txt

# Start Ollama separately
docker run -d -p 11434:11434 ollama/ollama

# Start development server
python -m app.main
```

## 🧪 Testing

### Backend Tests

```bash
pytest
```

### Frontend Tests

```bash
cd frontend
npm run test
```

### Model Execution Service Tests

```bash
cd model-execution-service
pytest tests/
```

## 📦 Deployment

### Production with Docker

```bash
# Start all services
docker-compose -f docker-compose.prod.yml up -d

# Run migrations
docker-compose exec backend alembic upgrade head
```

### Individual Service Deployment

- **Backend**: Railway, Heroku, or any containerized platform
- **Frontend**: Vercel, Netlify, or static hosting
- **Model Execution Service**: Self-hosted with GPU support

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with appropriate tests
4. Submit a pull request

Please ensure all tests pass and follow the established code patterns for each service.

## 📊 API Overview

### Main Endpoints

- **Tests**: `/api/v1/tests` - Create and manage test cases
- **Models**: `/api/v1/models` - Model registry and performance metrics
- **Executions**: `/api/v1/executions` - Run evaluations
- **Leaderboard**: `/api/v1/leaderboard` - Rankings and comparisons
- **Admin**: `/api/v1/admin` - Administrative functions

### Authentication

The system supports multiple authentication methods:
- API keys for programmatic access
- OAuth (GitHub, Google) for web interface
- Session-based authentication for the frontend

## 🔍 Monitoring

- **Health Checks**: All services expose `/health` endpoints
- **Logging**: Structured JSON logs with correlation IDs
- **Metrics**: Request latency, error rates, and resource usage
- **Real-time**: Live updates via WebSocket connections

## 📄 License

[License information here]

---

## Component Documentation

- **[Backend README](app/README.md)** - FastAPI backend details
- **[Frontend README](frontend/README.md)** - Next.js frontend details  
- **[Model Execution Service README](model-execution-service/README.md)** - Local model execution details

Built with ❤️ by the OpenBench community