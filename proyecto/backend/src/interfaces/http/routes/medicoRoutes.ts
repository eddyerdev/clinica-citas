import { FastifyInstance } from "fastify";
import { MedicoController } from "../controllers/medicoController.js";

export async function medicoRoutes(fastify: FastifyInstance, controller: MedicoController) {
  fastify.get("/medicos", controller.listar);
}