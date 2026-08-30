FROM node:22-alpine

WORKDIR /app

# Habilita pnpm vía corepack (ya viene con Node 22, no hay que instalarlo aparte)
RUN corepack enable && corepack prepare pnpm@9.11.0 --activate

# Copiamos solo los manifiestos primero, para aprovechar el cache de Docker:
# si no cambian las dependencias, no se vuelve a correr `pnpm install`.
COPY package.json pnpm-lock.yaml* ./
COPY prisma ./prisma

RUN pnpm install

# El código fuente NO se copia aquí a propósito — en desarrollo lo monta
# docker-compose como volumen (bind mount), así los cambios se reflejan
# al instante sin rebuildear la imagen.

EXPOSE 3000

CMD ["pnpm", "run", "docker:dev"]