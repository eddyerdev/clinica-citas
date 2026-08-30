# Proyecto Integrador — Arquitectura Orientada a Servicios en Salud

Sistema de gestión de citas para una red de clínicas, compuesto por 3 servicios independientes: **Pacientes**, **Citas** y **Notificaciones**, implementados como un backend único (Fastify + DDD) respaldado por PostgreSQL, y un frontend en React que los consume.

## Arquitectura

```
proyecto/
├── docker-compose.yml       # Orquesta los 3 contenedores
├── .env                     # Variables de entorno compartidas
├── backend/                 # API REST (Node.js + Fastify + TypeScript + Prisma), arquitectura DDD
│   ├── src/
│   │   ├── domain/          # Entidades, Value Objects, interfaces de repositorio (sin dependencias externas)
│   │   ├── application/     # Casos de uso (orquestación de reglas de negocio)
│   │   ├── infrastructure/  # Implementaciones con Prisma y el sender de notificaciones
│   │   └── interfaces/      # Rutas HTTP, controllers, validación con Zod
│   └── prisma/schema.prisma # Modelo de datos
└── frontend/                # React + Vite + TypeScript, servido en producción por Nginx
```

**Stack:**
- Backend: Node.js 22, Fastify 5, TypeScript, Prisma 6, Zod
- Base de datos: PostgreSQL 18
- Frontend: React 19, Vite, Axios
- Contenedores: Docker + Docker Compose (3 servicios independientes)

## Requisitos previos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado y corriendo.
- Puertos libres en el host: `5432` (o el configurado en `.env`), `3000` y `8080` — si ya los usas en otro proyecto, cámbialos en `.env` antes de levantar.

No necesitas instalar Node, pnpm, ni Postgres en tu máquina para correr el sistema completo vía Docker (sí los necesitas si quieres desarrollar el backend/frontend fuera de contenedores, ver sección "Desarrollo local").

## Configuración

1. Clona o descomprime el proyecto.
2. En la raíz (`proyecto/`), crea el archivo `.env` con este contenido (ajusta credenciales si lo deseas):

```bash
# Base de datos
POSTGRES_USER=admin
POSTGRES_PASSWORD=changeme123
POSTGRES_DB=clinica_citas
POSTGRES_PORT=5432

# URL de conexión que usará Prisma dentro de Docker
DATABASE_URL="postgresql://admin:changeme123@db:5432/clinica_citas?schema=public"

# Backend
BACKEND_PORT=3000
NODE_ENV=development

# Frontend
FRONTEND_PORT=8080
```

> **Nota:** si el puerto `5432` ya está en uso en tu máquina (por otro Postgres local o de otro proyecto), cambia `POSTGRES_PORT` a uno libre (ej. `5435`) — no afecta la comunicación interna entre contenedores, solo el acceso desde tu máquina (por ejemplo, desde DataGrip).

## Levantar el sistema completo

Desde la carpeta `proyecto/`:

```bash
docker-compose up -d --build
```

Esto construye y levanta 3 contenedores:
- `clinica_db` — PostgreSQL
- `clinica_backend` — API REST en `http://localhost:3000`
- `clinica_frontend` — interfaz web en `http://localhost:8080`

Verifica que los 3 estén corriendo:

```bash
docker ps
```

## Migraciones de base de datos

La primera vez que levantas el proyecto, las tablas no existen aún. Ejecuta la migración de Prisma dentro del contenedor del backend:

```bash
docker exec -it clinica_backend npx prisma migrate deploy
```

(Solo es necesario la primera vez, o cuando se agreguen cambios nuevos al `schema.prisma`.)

## Datos de prueba (seed manual)

El proyecto no incluye un script de seed automático. Para probar el sistema, inserta un médico de ejemplo directamente en la base de datos (por ejemplo, con DataGrip, TablePlus, o `psql`):

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO medicos (id, nombre, especialidad, "creadoEn")
VALUES (gen_random_uuid(), 'Dra. Carla Mendoza', 'Medicina General', now());
```

Los pacientes se pueden crear directamente desde la interfaz web (pestaña "Pacientes") o vía la API (`POST /pacientes`).

## Uso

1. Abre `http://localhost:8080` en el navegador.
2. Pestaña **Pacientes**: registra un paciente nuevo.
3. Pestaña **Citas**: agenda una cita eligiendo paciente, médico y horario. Puedes reprogramar, cancelar, o enviar un recordatorio simulado.
4. Pestaña **Notificaciones**: revisa el historial de recordatorios enviados y fuerza el reprocesamiento de los pendientes/fallidos.

## Probar la API directamente

Se incluye una colección de Postman (`Clinica-Citas.postman_collection.json`) con todos los endpoints, organizados por servicio (Pacientes, Citas, Notificaciones), incluyendo un caso de prueba explícito para el rechazo de choque de horarios (HU-02).

Importa el archivo en Postman y ejecuta los requests contra `http://localhost:3000` con el backend ya corriendo.

## Administrar servicios de forma independiente

Cada servicio puede detenerse/iniciarse sin afectar a los demás:

```bash
# Detener solo el backend (la DB y el frontend siguen corriendo)
docker-compose stop backend

# Volver a iniciarlo
docker-compose start backend

# Ver logs de un servicio puntual
docker logs clinica_backend --tail 50 -f
```

## Conectarse a la base de datos desde un cliente externo (DataGrip, TablePlus, etc.)

| Campo | Valor |
|---|---|
| Host | `localhost` |
| Port | El valor de `POSTGRES_PORT` en tu `.env` |
| Database | `clinica_citas` |
| User | `admin` |
| Password | `changeme123` |

## Detener y limpiar el entorno

```bash
# Detener todos los contenedores (conserva los datos)
docker-compose down

# Detener y borrar también los volúmenes (borra los datos de Postgres)
docker-compose down -v
```

## Desarrollo local (fuera de Docker, opcional)

Si prefieres desarrollar el backend o frontend con recarga en vivo fuera de contenedores:

**Backend:**
```bash
cd backend
pnpm install
# En backend/.env, usa localhost en vez de "db" como host:
# DATABASE_URL="postgresql://admin:changeme123@localhost:5432/clinica_citas?schema=public"
npx prisma migrate dev
pnpm dev
```

**Frontend:**
```bash
cd frontend
pnpm install
pnpm dev
```
Esto levanta el frontend en `http://localhost:5173` con proxy automático hacia el backend en `localhost:3000` (configurado en `vite.config.ts`).

> Nota: en este modo, la base de datos sigue corriendo en Docker (`docker-compose up -d db`); solo el backend/frontend corren nativos en tu máquina para aprovechar la recarga en vivo durante el desarrollo.

## Limitaciones conocidas (prototipo académico)

- El envío de notificaciones (`MockNotificacionSender`) es simulado — no se integra con un proveedor real de SMS/Email/WhatsApp. Simula una tasa de fallo del 15% para poder demostrar el mecanismo de reintentos.
- El disparo de recordatorios (HU-04) es manual vía endpoint (`POST /citas/:id/recordatorio`), en vez de automático por un cron/scheduler cada 24h antes de la cita — queda documentado como mejora futura.
- No existe un CRUD de médicos desde la interfaz (se gestionan como datos semilla insertados directamente en la base de datos), ya que no fue definido como Historia de Usuario en el Entregable 1.