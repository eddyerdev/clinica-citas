import { FastifyInstance } from "fastify";
import { PacienteController } from "../controllers/pacienteController.js";

/**
 * Rutas del servicio de Pacientes.
 * Incluye el endpoint de historial (HU-05), que en el OpenAPI original
 * se documentaría como parte del recurso Paciente.
 */
export async function pacienteRoutes(fastify: FastifyInstance, controller: PacienteController) {
  fastify.post("/pacientes", controller.crear);
  fastify.get("/pacientes", controller.listar);
  fastify.get("/pacientes/:id", controller.obtener);
  fastify.get("/pacientes/:id/citas", controller.historialCitas);
}