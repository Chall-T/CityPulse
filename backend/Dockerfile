FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json tsconfig*.json prisma ./
COPY src ./src
RUN npm install --production && npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY prisma ./prisma
ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "dist/app.js"]