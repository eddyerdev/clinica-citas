import Fastify from "fastify";
import { prisma } from "./infrastructure/database/prismaClient.js";

// Repositorios (infraestructura)
import { PrismaPacienteRepository } from "./infrastructure/repositories/PrismaPacienteRepository.js";
import { PrismaMedicoRepository } from "./infrastructure/repositories/PrismaMedicoRepository.js";
import { PrismaCitaRepository } from "./infrastructure/repositories/PrismaCitaRepository.js";

// Casos de uso (aplicación)
import { AgendarCita } from "./application/use-cases/AgendarCita.js";
import { CancelarCita } from "./application/use-cases/CancelarCita.js";
import { ReprogramarCita } from "./application/use-cases/ReprogramarCita.js";
import { RegistrarPaciente } from "./application/use-cases/RegistrarPaciente.js";
import { ConsultarHistorialCitas } from "./application/use-cases/ConsultarHistorialCitas.js";

// Controllers e interfaces (HTTP)
import { CitaController } from "./interfaces/http/controllers/citaController.js";
import { PacienteController } from "./interfaces/http/controllers/pacienteController.js";
import { citaRoutes } from "./interfaces/http/routes/citaRoutes.js";
import { pacienteRoutes } from "./interfaces/http/routes/pacienteRoutes.js";

import { DomainError, EntidadNoEncontradaError, ConflictoHorarioError } from "./domain/errors/DomainError.js";
import { ZodError } from "zod";

// imports for notification service (if needed in the future)
import { PrismaNotificacionRepository } from "./infrastructure/repositories/PrismaNotificacionRepository.js";
import { MockNotificacionSender } from "./infrastructure/services/MockNotificacionSender.js";
import { EnviarRecordatorio } from "./application/use-cases/EnviarRecordatorio.js";
import { ProcesarNotificacionesPendientes } from "./application/use-cases/ProcesarNotificacionesPendientes.js";
import { NotificacionController } from "./interfaces/http/controllers/notificacionController.js";
import { notificacionRoutes } from "./interfaces/http/routes/notificacionRoutes.js";

import { MedicoController } from "./interfaces/http/controllers/medicoController.js";
import { medicoRoutes } from "./interfaces/http/routes/medicoRoutes.js";

const fastify = Fastify({ logger: true });

// --- Composición de dependencias (Inyección manual, sin framework de DI) ---
const pacienteRepository = new PrismaPacienteRepository(prisma);
const medicoRepository = new PrismaMedicoRepository(prisma);
const citaRepository = new PrismaCitaRepository(prisma);
const notificacionRepository = new PrismaNotificacionRepository(prisma);
const notificacionSender = new MockNotificacionSender();

const agendarCita = new AgendarCita(citaRepository, pacienteRepository, medicoRepository);
const cancelarCita = new CancelarCita(citaRepository);
const reprogramarCita = new ReprogramarCita(citaRepository);
const registrarPaciente = new RegistrarPaciente(pacienteRepository);
const consultarHistorialCitas = new ConsultarHistorialCitas(citaRepository, pacienteRepository);
const enviarRecordatorio = new EnviarRecordatorio(notificacionRepository, citaRepository, pacienteRepository, notificacionSender);
const procesarNotificacionesPendientes = new ProcesarNotificacionesPendientes(notificacionRepository, citaRepository, pacienteRepository, notificacionSender);

const citaController = new CitaController(agendarCita, cancelarCita, reprogramarCita, citaRepository);
const pacienteController = new PacienteController(registrarPaciente, consultarHistorialCitas, pacienteRepository);
const notificacionController = new NotificacionController(enviarRecordatorio, procesarNotificacionesPendientes, notificacionRepository);

const medicoController = new MedicoController(medicoRepository);

// --- Rutas ---
citaRoutes(fastify, citaController);
pacienteRoutes(fastify, pacienteController);

// Rutas para notificaciones
notificacionRoutes(fastify, notificacionController);

medicoRoutes(fastify, medicoController);

// Healthcheck (soporta el RNF-03 de disponibilidad monitoreada)
fastify.get("/health", async () => {
  await prisma.$queryRaw`SELECT 1`;
  return { status: "ok", timestamp: new Date().toISOString() };
});

// --- Manejador global de errores ---
// Traduce errores de dominio a códigos HTTP correctos, sin que los
// controllers necesiten saber nada de HTTP status codes por error.
fastify.setErrorHandler((error, _request, reply) => {
  if (error instanceof ZodError) {
    return reply.status(400).send({
      codigo: "VALIDATION_ERROR",
      mensaje: "Datos de entrada inválidos",
      detalles: error.issues,
    });
  }

  if (error instanceof EntidadNoEncontradaError) {
    return reply.status(404).send({ codigo: "NOT_FOUND", mensaje: error.message });
  }

  if (error instanceof ConflictoHorarioError) {
    return reply.status(409).send({ codigo: "CONFLICT", mensaje: error.message });
  }

  if (error instanceof DomainError) {
    return reply.status(400).send({ codigo: "DOMAIN_ERROR", mensaje: error.message });
  }

  fastify.log.error(error);
  return reply.status(500).send({ codigo: "INTERNAL_ERROR", mensaje: "Error interno del servidor" });
});

// --- Arranque del servidor ---
const PORT = Number(process.env.BACKEND_PORT) || 3000;

fastify
  .listen({ port: PORT, host: "0.0.0.0" })
  .then(() => console.log(`Servidor corriendo en http://localhost:${PORT}`))
  .catch((err) => {
    fastify.log.error(err);
    process.exit(1);
  });

// Cierre limpio de la conexión a Prisma al detener el proceso
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});