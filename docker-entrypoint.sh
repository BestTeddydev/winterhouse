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
DB_URL="${MONGODB_URI:-${DATABASE_URL:-mongodb://admin:bestbaanlomnow@mongodb-service:27017/baanlomnow?authSource=admin}}"
node -e "
const mongoose = require('mongoose');
console.log('Connecting to:', process.env.MONGODB_URI || process.env.DATABASE_URL);
mongoose.connect(process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://admin:bestbaanlomnow@mongodb-service:27017/baanlomnow?authSource=admin')
  .then(() => {
    console.log('✅ MongoDB connection successful');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(0); // Don't fail startup if MongoDB test fails
  });
"

echo "✅ Database setup complete!"

# Start the application
echo "🌐 Starting Next.js server..."
# Use the server.js from standalone build, or fallback to .next/server.js
if [ -f "./server.js" ]; then
  exec node server.js
else
  echo "⚠️  server.js not found, using .next/server.js"
  exec node .next/server.js
fi

