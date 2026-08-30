import { FastifyInstance } from "fastify";
import { NotificacionController } from "../controllers/notificacionController.js";

export async function notificacionRoutes(fastify: FastifyInstance, controller: NotificacionController) {
  fastify.post("/citas/:id/recordatorio", controller.enviarPorCita);
  fastify.get("/citas/:id/notificaciones", controller.listarPorCita);
  fastify.post("/notificaciones/procesar-pendientes", controller.procesarPendientes);
}