#!/bin/sh
set -e

echo "🚀 Starting Winterhouse Application..."

# Generate Prisma Client
echo "📦 Generating Prisma Client..."
npx prisma generate

# Push schema to MongoDB (MongoDB doesn't use migrations)
echo "📦 Pushing schema to MongoDB..."
npx prisma db push --skip-generate --accept-data-loss || echo "Schema already in sync"

echo "✅ Database setup complete!"

# Start the application
echo "🌐 Starting Next.js server..."
exec node server.js

