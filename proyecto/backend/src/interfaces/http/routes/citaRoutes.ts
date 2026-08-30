import { FastifyInstance } from "fastify";
import { CitaController } from "../controllers/citaController.js";

/**
 * Rutas del servicio de Citas.
 * Coinciden exactamente con los paths definidos en el OpenAPI
 * del Entregable 2: POST/GET /citas, GET/PATCH/DELETE /citas/{id}.
 */
export async function citaRoutes(fastify: FastifyInstance, controller: CitaController) {
  fastify.post("/citas", controller.crear);
  fastify.get("/citas", controller.listar);
  fastify.get("/citas/:id", controller.obtener);
  fastify.patch("/citas/:id", controller.reprogramar);
  fastify.delete("/citas/:id", controller.cancelar);
}