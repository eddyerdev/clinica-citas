import { FastifyReply, FastifyRequest } from "fastify";
import { AgendarCita } from "../../../application/use-cases/AgendarCita.js";
import { CancelarCita } from "../../../application/use-cases/CancelarCita.js";
import { ReprogramarCita } from "../../../application/use-cases/ReprogramarCita.js";
import { CitaRepository } from "../../../domain/repositories/CitaRepository.js";
import {
  crearCitaSchema,
  reprogramarCitaSchema,
  listarCitasQuerySchema,
  citaIdParamSchema,
} from "../../schemas/citaSchemas.js";
import { DomainError, EntidadNoEncontradaError } from "../../../domain/errors/DomainError.js";
import { Cita } from "../../../domain/entities/Cita.js";

/**
 * Controller de Citas: traduce HTTP <-> Casos de Uso.
 * No contiene lógica de negocio, solo:
 * 1. Valida el input con Zod.
 * 2. Llama al caso de uso correspondiente.
 * 3. Mapea el resultado (o el error de dominio) a una respuesta HTTP.
 */
export class CitaController {
  constructor(
    private readonly agendarCita: AgendarCita,
    private readonly cancelarCita: CancelarCita,
    private readonly reprogramarCita: ReprogramarCita,
    private readonly citaRepository: CitaRepository
  ) {}

  crear = async (request: FastifyRequest, reply: FastifyReply) => {
    const datos = crearCitaSchema.parse(request.body);

    const cita = await this.agendarCita.ejecutar(datos);

    return reply.status(201).send(this.aRespuesta(cita));
  };

  listar = async (request: FastifyRequest, reply: FastifyReply) => {
    const query = listarCitasQuerySchema.parse(request.query);

    let citas: Cita[];
    if (query.pacienteId) {
      citas = await this.citaRepository.listarPorPaciente(query.pacienteId);
    } else if (query.medicoId) {
      citas = await this.citaRepository.listarPorMedico(query.medicoId);
    } else {
      citas = [];
    }

    if (query.estado) {
      citas = citas.filter((c) => c.getEstado().getValor() === query.estado);
    }

    return reply.status(200).send(citas.map((c) => this.aRespuesta(c)));
  };

  obtener = async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = citaIdParamSchema.parse(request.params);

    const cita = await this.citaRepository.buscarPorId(id);
    if (!cita) {
      throw new EntidadNoEncontradaError("Cita", id);
    }

    return reply.status(200).send(this.aRespuesta(cita));
  };

  reprogramar = async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = citaIdParamSchema.parse(request.params);
    const { nuevaFechaHora } = reprogramarCitaSchema.parse(request.body);

    const cita = await this.reprogramarCita.ejecutar({ citaId: id, nuevaFechaHora });

    return reply.status(200).send(this.aRespuesta(cita));
  };

  cancelar = async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = citaIdParamSchema.parse(request.params);

    await this.cancelarCita.ejecutar(id);

    return reply.status(204).send();
  };

  /** Mapea la entidad de dominio a la forma de respuesta pública (DTO de salida). */
  private aRespuesta(cita: {
    getId: () => string;
    getPacienteId: () => string;
    getMedicoId: () => string;
    getFechaHora: () => Date;
    getEstado: () => { getValor: () => string };
    getMotivo: () => string | undefined;
  }) {
    return {
      id: cita.getId(),
      pacienteId: cita.getPacienteId(),
      medicoId: cita.getMedicoId(),
      fechaHora: cita.getFechaHora().toISOString(),
      estado: cita.getEstado().getValor(),
      motivo: cita.getMotivo() ?? null,
    };
  }
}

// Re-exportado para que el manejador global de errores (server.ts) lo reconozca
export { DomainError };