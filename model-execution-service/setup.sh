#!/bin/bash

# Model Execution Service Setup Script

set -e

echo "🚀 Setting up Model Execution Service..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    echo "Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp env.example .env
    echo "✅ Created .env file. You may want to customize the settings."
else
    echo "ℹ️  .env file already exists"
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p config logs

# Check available memory
echo "🔍 Checking system requirements..."
AVAILABLE_RAM=$(free -g | awk '/^Mem:/{print $2}')
if [ "$AVAILABLE_RAM" -lt 16 ]; then
    echo "⚠️  Warning: You have less than 16GB RAM ($AVAILABLE_RAM GB available)"
    echo "   Consider using smaller models or reducing MAX_LOADED_MODELS"
fi

# Check for GPU
if command -v nvidia-smi &> /dev/null; then
    echo "🎮 NVIDIA GPU detected - you may want to enable GPU support in docker-compose.yml"
else
    echo "ℹ️  No NVIDIA GPU detected - will run on CPU only"
fi

# Build and start services
echo "🏗️  Building and starting services..."
docker-compose up -d --build

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 10

# Check if services are running
echo "🔍 Checking service health..."

# Check MES health
if curl -f http://localhost:8001/health > /dev/null 2>&1; then
    echo "✅ Model Execution Service is running"
else
    echo "❌ Model Execution Service is not responding"
    echo "   Check logs with: docker-compose logs mes"
fi

# Check Ollama health
if curl -f http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "✅ Ollama service is running"
else
    echo "❌ Ollama service is not responding"
    echo "   Check logs with: docker-compose logs ollama"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Pull your first model:"
echo "   docker-compose exec ollama ollama pull llama3.1:8b"
echo ""
echo "2. Test the API:"
echo "   curl -H 'Authorization: Bearer mes-dev-key-123' http://localhost:8001/v1/models"
echo ""
echo "3. View logs:"
echo "   docker-compose logs -f"
echo ""
echo "4. View the README.md for more usage examples"
echo ""
echo "Service URLs:"
echo "- Model Execution Service: http://localhost:8001"
echo "- Ollama API: http://localhost:11434"
echo ""
echo "Default API Key: mes-dev-key-123 (change this in .env for production!)"
