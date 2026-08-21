#!/bin/bash

# MERN Stack Application Startup Script
# This script starts both backend and frontend servers

echo "🚀 Starting Assignment Management System (MERN Stack)..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v18 or higher."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill %1 %2 2>/dev/null
    exit 0
}

trap cleanup EXIT INT

# Start backend
echo "📦 Starting Backend Server..."
cd backend

if [ ! -d "node_modules" ]; then
    echo "📥 Installing backend dependencies..."
    npm install
fi

if [ ! -f ".env" ]; then
    echo "⚙️  Creating .env file..."
    cp .env.example .env
    echo "✅ .env created. Please update with your MongoDB URI if needed."
fi

npm run dev &
BACKEND_PID=$!

# Give backend time to start
sleep 3

# Start frontend
cd ..
echo ""
echo "🎨 Starting Frontend Server..."

if [ ! -d "node_modules" ]; then
    echo "📥 Installing frontend dependencies..."
    npm install
fi

if [ ! -f ".env.local" ]; then
    echo "⚙️  Creating .env.local file..."
    echo "NEXT_PUBLIC_API_URL=http://localhost:5000/api" > .env.local
fi

npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Both servers are starting..."
echo ""
echo "📍 Frontend: http://localhost:3000"
echo "📍 Backend: http://localhost:5000"
echo "📍 API: http://localhost:5000/api"
echo ""
echo "📝 Default Credentials:"
echo "   Admin:    admin@example.com / Admin@123456"
echo "   Teacher:  teacher@example.com / Teacher@123456"
echo "   Student:  student1@example.com / Student@123456"
echo ""
echo "💡 Press Ctrl+C to stop both servers"
echo ""

# Wait for both processes
wait
