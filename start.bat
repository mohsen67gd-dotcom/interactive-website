@echo off
echo Starting Interactive Website...
echo.

echo Installing backend dependencies...
npm install

echo.
echo Installing frontend dependencies...
cd client
npm install
cd ..

echo.
echo Creating .env file...
echo MONGODB_URI=mongodb://localhost:27017/interactive-website > .env
echo JWT_SECRET=your-super-secret-jwt-key-change-this-in-production >> .env
echo PORT=5000 >> .env
echo NODE_ENV=development >> .env

echo.
echo Running setup script...
node setup.js

echo.
echo Starting the application...
echo Backend will run on http://localhost:5000
echo Frontend will run on http://localhost:3000
echo.
echo Press Ctrl+C to stop both servers
echo.

start "Backend" cmd /k "npm run dev"
timeout /t 3 /nobreak >nul
start "Frontend" cmd /k "npm run client"
