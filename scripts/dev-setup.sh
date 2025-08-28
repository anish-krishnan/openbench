#!/bin/bash

# Development setup script for Open Bench backend

set -e

echo "🚀 Setting up Open Bench development environment..."

# Check if Python 3.11+ is available
if ! command -v python3.11 &> /dev/null; then
    echo "❌ Python 3.11+ is required but not found"
    exit 1
fi

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3.11 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📥 Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Copy environment file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "⚙️ Creating .env file from template..."
    cp .env.example .env || echo "⚠️ .env.example not found, please create .env manually"
fi

# Start Docker services
echo "🐳 Starting Docker services (PostgreSQL & Redis)..."
docker-compose up -d postgres redis

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Run database migrations
echo "🗄️ Running database migrations..."
alembic upgrade head

echo "✅ Development environment setup complete!"
echo ""
echo "🎯 Next steps:"
echo "  1. Edit .env file with your API keys"
echo "  2. Run: source venv/bin/activate"
echo "  3. Run: uvicorn app.main:app --reload"
echo "  4. Visit: http://localhost:8000/docs"
echo ""
echo "📚 Useful commands:"
echo "  • Run tests: pytest"
echo "  • Create migration: alembic revision --autogenerate -m 'description'"
echo "  • Reset database: docker-compose down -v && docker-compose up -d"
