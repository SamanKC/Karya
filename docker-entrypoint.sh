#!/bin/sh
set -e

echo "Karya: Waiting for database to be ready..."

# Simple wait loop for MySQL (max 30 seconds)
RETRIES=30
until node -e "
  const mysql = require('mysql2/promise');
  (async () => {
    const conn = await mysql.createConnection(process.env.DATABASE_URL);
    await conn.ping();
    await conn.end();
  })().catch(() => process.exit(1));
" 2>/dev/null || [ "$RETRIES" -eq 0 ]; do
  RETRIES=$((RETRIES - 1))
  echo "Karya: Database not ready, retrying in 1s... ($RETRIES attempts left)"
  sleep 1
done

if [ "$RETRIES" -eq 0 ]; then
  echo "Karya: WARNING - Could not verify database connection, proceeding anyway"
fi

echo "Karya: Running database migrations..."
cd /app/packages/server
npx prisma migrate deploy 2>&1 || echo "Karya: WARNING - Migration failed or no migrations to run"
cd /app

echo "Karya: Starting server..."
exec node packages/server/dist/index.js
