#!/bin/bash

echo "Starting Interactive Website..."
echo

echo "Installing backend dependencies..."
npm install

echo
echo "Installing frontend dependencies..."
cd client
npm install
cd ..

echo
echo "Creating .env file..."
cat > .env << EOF
MONGODB_URI=mongodb://localhost:27017/interactive-website
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
PORT=5000
NODE_ENV=development
EOF

echo
echo "Running setup script..."
node setup.js

echo
echo "Starting the application..."
echo "Backend will run on http://localhost:5000"
echo "Frontend will run on http://localhost:3000"
echo
echo "Press Ctrl+C to stop both servers"
echo

# Start backend in background
npm run dev &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend
npm run client &
FRONTEND_PID=$!

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
