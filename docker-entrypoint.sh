#!/bin/sh
set -e

echo "🚀 Starting Winterhouse Application..."

# Data lives in Firestore / Firebase Storage, so there is no database to wait for
if [ -n "$GOOGLE_APPLICATION_CREDENTIALS" ] && [ ! -r "$GOOGLE_APPLICATION_CREDENTIALS" ]; then
  echo "⚠️  GOOGLE_APPLICATION_CREDENTIALS is set but $GOOGLE_APPLICATION_CREDENTIALS is not readable"
fi

# Start the application
echo "🌐 Starting Next.js server..."
# Use the server.js from standalone build, or fallback to .next/server.js
if [ -f "./server.js" ]; then
  exec node server.js
else
  echo "⚠️  server.js not found, using .next/server.js"
  exec node .next/server.js
fi
