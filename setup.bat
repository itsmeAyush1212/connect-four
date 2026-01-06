@echo off
setlocal enabledelayedexpansion

echo 🚀 Starting 4 In A Row Setup...

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    exit /b 1
)

echo ✅ Node.js version:
node --version

REM Check if Docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Docker is not installed. Services will not start automatically.
    echo    Install from: https://www.docker.com/products/docker-desktop
) else (
    echo ✅ Docker is installed
    echo 🐳 Starting Docker containers...
    docker-compose up -d
    echo ⏳ Waiting for services to be ready...
    timeout /t 10 /nobreak
)

REM Setup backend
echo.
echo 📦 Setting up backend...
cd connect-four-server
call npm install
echo ✅ Backend dependencies installed

REM Create .env if it doesn't exist
if not exist .env (
    (
        echo PORT=3001
        echo MONGODB_URI=mongodb://admin:password@localhost:27017/four-in-a-row?authSource=admin
        echo KAFKA_BROKERS=localhost:9092
        echo FRONTEND_URL=http://localhost:3000
        echo NODE_ENV=development
    ) > .env
    echo ✅ .env file created
) else (
    echo ⚠️  .env file already exists
)

cd ..

REM Setup frontend
echo.
echo 📦 Setting up frontend...
cd connect-four
call npm install
echo ✅ Frontend dependencies installed

REM Create .env.local if it doesn't exist
if not exist .env.local (
    echo NEXT_PUBLIC_SERVER_URL=http://localhost:3001 > .env.local
    echo ✅ .env.local file created
) else (
    echo ⚠️  .env.local file already exists
)

cd ..

echo.
echo ✅ Setup complete!
echo.
echo 📝 Next steps:
echo    1. Start the backend:  cd connect-four-server ^&^& npm run dev
echo    2. Start the frontend: cd connect-four ^&^& npm run dev
echo    3. Open http://localhost:3000 in your browser
echo.
echo 🛑 To stop services:
echo    docker-compose down
