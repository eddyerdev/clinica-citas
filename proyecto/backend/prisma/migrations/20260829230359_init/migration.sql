-- CreateEnum
CREATE TYPE "EstadoCita" AS ENUM ('pendiente', 'confirmada', 'cancelada', 'atendida');

-- CreateEnum
CREATE TYPE "CanalNotificacion" AS ENUM ('sms', 'email', 'whatsapp');

-- CreateEnum
CREATE TYPE "EstadoNotificacion" AS ENUM ('pendiente', 'enviada', 'fallida');

-- CreateTable
CREATE TABLE "pacientes" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "documento" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "canalPreferido" "CanalNotificacion" NOT NULL DEFAULT 'email',
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pacientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medicos" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "especialidad" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "medicos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "citas" (
    "id" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "medicoId" TEXT NOT NULL,
    "fechaHora" TIMESTAMP(3) NOT NULL,
    "estado" "EstadoCita" NOT NULL DEFAULT 'pendiente',
    "motivo" TEXT,
    "creadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadaEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "citas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificaciones" (
    "id" TEXT NOT NULL,
    "citaId" TEXT NOT NULL,
    "canal" "CanalNotificacion" NOT NULL,
    "estado" "EstadoNotificacion" NOT NULL DEFAULT 'pendiente',
    "intentos" INTEGER NOT NULL DEFAULT 0,
    "creadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "enviadaEn" TIMESTAMP(3),

    CONSTRAINT "notificaciones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pacientes_documento_key" ON "pacientes"("documento");

-- CreateIndex
CREATE UNIQUE INDEX "pacientes_email_key" ON "pacientes"("email");

-- CreateIndex
CREATE INDEX "citas_pacienteId_idx" ON "citas"("pacienteId");

-- CreateIndex
CREATE INDEX "citas_estado_idx" ON "citas"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "citas_medicoId_fechaHora_key" ON "citas"("medicoId", "fechaHora");

-- CreateIndex
CREATE INDEX "notificaciones_citaId_idx" ON "notificaciones"("citaId");

-- CreateIndex
CREATE INDEX "notificaciones_estado_idx" ON "notificaciones"("estado");

-- AddForeignKey
ALTER TABLE "citas" ADD CONSTRAINT "citas_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "pacientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citas" ADD CONSTRAINT "citas_medicoId_fkey" FOREIGN KEY ("medicoId") REFERENCES "medicos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificaciones" ADD CONSTRAINT "notificaciones_citaId_fkey" FOREIGN KEY ("citaId") REFERENCES "citas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
