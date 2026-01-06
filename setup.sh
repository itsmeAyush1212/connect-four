#!/bin/bash

echo "🚀 Starting 4 In A Row Setup..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "⚠️  Docker is not installed. Services will not start automatically."
    echo "   Install from: https://www.docker.com/products/docker-desktop"
else
    echo "✅ Docker is installed"
    echo "🐳 Starting Docker containers..."
    docker-compose up -d
    echo "⏳ Waiting for services to be ready..."
    sleep 10
fi

# Setup backend
echo ""
echo "📦 Setting up backend..."
cd connect-four-server
npm install
echo "✅ Backend dependencies installed"

# Copy example .env if it doesn't exist
if [ ! -f .env ]; then
    echo "PORT=3001
MONGODB_URI=mongodb://admin:password@localhost:27017/four-in-a-row?authSource=admin
KAFKA_BROKERS=localhost:9092
FRONTEND_URL=http://localhost:3000
NODE_ENV=development" > .env
    echo "✅ .env file created"
else
    echo "⚠️  .env file already exists"
fi

cd ..

# Setup frontend
echo ""
echo "📦 Setting up frontend..."
cd connect-four
npm install
echo "✅ Frontend dependencies installed"

# Copy example .env.local if it doesn't exist
if [ ! -f .env.local ]; then
    echo "NEXT_PUBLIC_SERVER_URL=http://localhost:3001" > .env.local
    echo "✅ .env.local file created"
else
    echo "⚠️  .env.local file already exists"
fi

cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Start the backend:  cd connect-four-server && npm run dev"
echo "   2. Start the frontend: cd connect-four && npm run dev"
echo "   3. Open http://localhost:3000 in your browser"
echo ""
echo "🛑 To stop services:"
echo "   docker-compose down"
