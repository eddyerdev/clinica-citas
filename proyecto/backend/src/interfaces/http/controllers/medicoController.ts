import { FastifyReply, FastifyRequest } from "fastify";
import { MedicoRepository } from "../../../domain/repositories/MedicoRepository.js";
import { Medico } from "../../../domain/entities/Medico.js";

export class MedicoController {
  constructor(private readonly medicoRepository: MedicoRepository) {}

  listar = async (_request: FastifyRequest, reply: FastifyReply) => {
    const medicos = await this.medicoRepository.listar();
    return reply.status(200).send(medicos.map((m) => this.aRespuesta(m)));
  };

  private aRespuesta(medico: Medico) {
    return {
      id: medico.getId(),
      nombre: medico.getNombre(),
      especialidad: medico.getEspecialidad(),
    };
  }
}