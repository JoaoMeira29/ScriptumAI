FROM node:20-alpine AS development

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npx prisma generate

# Copiar e dar permissões ao script de entrypoint
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["npm", "run", "start:dev"]

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .
RUN npx prisma generate
RUN npx nest build

# Copiar script de entrypoint
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

RUN npm prune --production

EXPOSE 3000

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["npm", "run", "start:prod"]
