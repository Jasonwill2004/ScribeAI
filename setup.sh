#!/bin/bash

# ScribeAI Setup Script
# This script helps set up the development environment

set -e

echo "🚀 ScribeAI Setup Script"
echo "========================"
echo ""

# Check Node.js version
echo "📦 Checking Node.js version..."
node_version=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$node_version" -lt 18 ]; then
    echo "❌ Node.js 18+ is required. Current version: $(node -v)"
    exit 1
fi
echo "✅ Node.js version: $(node -v)"
echo ""

# Check Docker
echo "🐳 Checking Docker..."
if ! command -v docker &> /dev/null; then
    echo "⚠️  Docker not found. Please install Docker to run PostgreSQL."
    echo "   You can continue without Docker but will need to set up PostgreSQL manually."
else
    echo "✅ Docker is installed"
    if ! docker info &> /dev/null; then
        echo "⚠️  Docker daemon is not running. Please start Docker."
    else
        echo "✅ Docker daemon is running"
    fi
fi
echo ""

# Install dependencies
echo "📥 Installing dependencies..."
npm install
echo "✅ Dependencies installed"
echo ""

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "✅ .env file created"
    echo "⚠️  Please edit .env and add your GEMINI_API_KEY"
else
    echo "ℹ️  .env file already exists"
fi
echo ""

# Start PostgreSQL
echo "🐳 Starting PostgreSQL with Docker Compose..."
if command -v docker-compose &> /dev/null || command -v docker &> /dev/null; then
    docker-compose up -d 2>/dev/null || docker compose up -d 2>/dev/null || echo "⚠️  Could not start Docker Compose"
    echo "✅ PostgreSQL started (or already running)"
else
    echo "⚠️  Skipping PostgreSQL setup - Docker not available"
fi
echo ""

echo "✨ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env and add your GEMINI_API_KEY (get it from https://ai.google.dev)"
echo "2. Run 'npm run dev' to start both servers"
echo "3. Visit http://localhost:3000"
echo ""
echo "Useful commands:"
echo "  npm run dev          - Start both Next.js and Socket.io servers"
echo "  npm run dev:app      - Start Next.js only"
echo "  npm run dev:socket   - Start Socket.io server only"
echo "  docker-compose logs  - View PostgreSQL logs"
echo ""
