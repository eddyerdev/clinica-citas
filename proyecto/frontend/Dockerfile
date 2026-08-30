# --- Etapa 1: build ---
FROM node:22-alpine AS build

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.11.0 --activate

COPY package.json pnpm-lock.yaml* ./
RUN pnpm install

COPY . .
RUN pnpm run build

# --- Etapa 2: producción (solo el estático + Nginx) ---
FROM nginx:1.31-alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80