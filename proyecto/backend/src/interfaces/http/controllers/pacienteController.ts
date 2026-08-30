import { FastifyReply, FastifyRequest } from "fastify";
import { RegistrarPaciente } from "../../../application/use-cases/RegistrarPaciente.js";
import { ConsultarHistorialCitas } from "../../../application/use-cases/ConsultarHistorialCitas.js";
import { PacienteRepository } from "../../../domain/repositories/PacienteRepository.js";
import { registrarPacienteSchema, pacienteIdParamSchema } from "../../schemas/pacienteSchemas.js";
import { EntidadNoEncontradaError } from "../../../domain/errors/DomainError.js";
import { Paciente } from "../../../domain/entities/Paciente.js";

export class PacienteController {
  constructor(
    private readonly registrarPaciente: RegistrarPaciente,
    private readonly consultarHistorialCitas: ConsultarHistorialCitas,
    private readonly pacienteRepository: PacienteRepository
  ) {}

  crear = async (request: FastifyRequest, reply: FastifyReply) => {
    const datos = registrarPacienteSchema.parse(request.body);

    const paciente = await this.registrarPaciente.ejecutar(datos);

    return reply.status(201).send(this.aRespuesta(paciente));
  };

  listar = async (_request: FastifyRequest, reply: FastifyReply) => {
    const pacientes = await this.pacienteRepository.listar();
    return reply.status(200).send(pacientes.map((p) => this.aRespuesta(p)));
  };

  obtener = async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = pacienteIdParamSchema.parse(request.params);

    const paciente = await this.pacienteRepository.buscarPorId(id);
    if (!paciente) {
      throw new EntidadNoEncontradaError("Paciente", id);
    }

    return reply.status(200).send(this.aRespuesta(paciente));
  };

  /** HU-05: historial de citas de un paciente, visto por el médico. */
  historialCitas = async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = pacienteIdParamSchema.parse(request.params);

    const citas = await this.consultarHistorialCitas.ejecutar(id);

    return reply.status(200).send(
      citas.map((c) => ({
        id: c.getId(),
        medicoId: c.getMedicoId(),
        fechaHora: c.getFechaHora().toISOString(),
        estado: c.getEstado().getValor(),
        motivo: c.getMotivo() ?? null,
      }))
    );
  };

  private aRespuesta(paciente: Paciente) {
    return {
      id: paciente.getId(),
      nombre: paciente.getNombre(),
      documento: paciente.getDocumento(),
      telefono: paciente.getTelefono().getValor(),
      email: paciente.getEmail().getValor(),
      canalPreferido: paciente.getCanalPreferido(),
    };
  }
}