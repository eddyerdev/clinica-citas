import { CitaRepository } from "../../domain/repositories/CitaRepository.js";
import { PacienteRepository } from "../../domain/repositories/PacienteRepository.js";
import { EntidadNoEncontradaError } from "../../domain/errors/DomainError.js";
import { Cita } from "../../domain/entities/Cita.js";

/**
 * Caso de Uso: Consultar Historial de Citas (HU-05)
 * Como médico, quiero ver el historial de citas de un paciente
 * (pasadas y futuras, con su estado) antes de la consulta.
 */
export class ConsultarHistorialCitas {
  constructor(
    private readonly citaRepository: CitaRepository,
    private readonly pacienteRepository: PacienteRepository
  ) {}

  async ejecutar(pacienteId: string): Promise<Cita[]> {
    const paciente = await this.pacienteRepository.buscarPorId(pacienteId);
    if (!paciente) {
      throw new EntidadNoEncontradaError("Paciente", pacienteId);
    }

    return this.citaRepository.listarPorPaciente(pacienteId);
  }
}