#!/bin/bash

echo "🚀 Building AliadaDigital Registro Horario..."

# Install backend dependencies
echo "📦 Installing backend dependencies..."
npm install

# Install frontend dependencies and build
echo "📦 Installing frontend dependencies..."
cd client
npm install

echo "🏗️ Building frontend..."
npm run build

echo "✅ Build completed!"
