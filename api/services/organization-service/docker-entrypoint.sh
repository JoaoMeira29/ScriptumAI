#!/bin/sh
set -e

echo "🔄 Running Prisma migrations..."
npx prisma migrate deploy

echo "✅ Migrations completed successfully!"
echo "🚀 Starting application..."

# Execute o comando passado como argumento (npm run start:dev ou start:prod)
exec "$@"
