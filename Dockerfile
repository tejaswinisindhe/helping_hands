FROM node:18-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* pnpm-lock.yaml* ./
RUN npm install
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
RUN npm install -g serve
WORKDIR /app
COPY --from=builder /app/dist ./dist
CMD ["serve", "-s", "dist", "-l", "8000"]
