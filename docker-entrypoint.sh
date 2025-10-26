#!/bin/sh
set -e

echo "🚀 Starting Winterhouse Application..."

# Wait for MongoDB to be ready
echo "⏳ Waiting for MongoDB to be ready..."
until curl -f http://mongodb-service:27017/ > /dev/null 2>&1 || nc -z mongodb-service 27017; do
  echo "MongoDB is unavailable - sleeping"
  sleep 2
done
echo "✅ MongoDB is ready!"

# Test MongoDB connection
echo "🔍 Testing MongoDB connection..."
node -e "
const mongoose = require('mongoose');
mongoose.connect(process.env.DATABASE_URL || 'mongodb://mongodb-service:27017/baanlomnow')
  .then(() => {
    console.log('✅ MongoDB connection successful');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });
" || {
  echo "❌ MongoDB connection test failed"
  exit 1
}

echo "✅ Database setup complete!"

# Start the application
echo "🌐 Starting Next.js server..."
exec node server.js

