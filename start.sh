#!/bin/bash

# Ensure we're in the project root folder
cd "$(dirname "$0")"

echo "🚀 Starting CampusEats (SnackZone) Setup & Run Script..."

# Set up environment variables if missing
if [ ! -f .env ]; then
  echo "📄 Creating .env file from .env.example..."
  cp .env.example .env
  echo "⚠️ Note: Please update your .env with valid credentials (e.g., Firebase Service Account) before production use."
fi

# Install dependencies for the backend
echo "📦 Installing Backend Dependencies..."
npm install

# Install dependencies for the frontend
echo "📦 Installing Frontend Dependencies..."
cd "Event listing prototype"
npm install
cd ..

# Start both servers
echo "🏃‍♂️ Starting servers in parallel..."
echo "Backend: starting up..."
echo "Frontend: looking for localhost..."

# Start Backend in the background
npm start &
BACKEND_PID=$!

# Start Frontend in the background
cd "Event listing prototype"
npm run dev &
FRONTEND_PID=$!
cd ..

# Intercept Ctrl+C to stop both servers cleanly
trap "echo '🛑 Terminating servers...'; kill $BACKEND_PID $FRONTEND_PID; exit" SIGINT SIGTERM

echo "✅ Both servers are running! Press Ctrl+C to stop them."
echo ""

# Wait for background processes to keep the script alive
wait $BACKEND_PID $FRONTEND_PID
