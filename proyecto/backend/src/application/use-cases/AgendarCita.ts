import { randomUUID } from "node:crypto";
import { Cita } from "../../domain/entities/Cita.js";
import { CitaRepository } from "../../domain/repositories/CitaRepository.js";
import { PacienteRepository } from "../../domain/repositories/PacienteRepository.js";
import { MedicoRepository } from "../../domain/repositories/MedicoRepository.js";
import { ConflictoHorarioError, EntidadNoEncontradaError } from "../../domain/errors/DomainError.js";

export interface AgendarCitaInput {
  pacienteId: string;
  medicoId: string;
  fechaHora: Date;
  motivo?: string;
}

/**
 * Caso de Uso: Agendar Cita (HU-02)
 * Orquesta las reglas que involucran a MÁS de una entidad:
 * 1. Verifica que el paciente exista.
 * 2. Verifica que el médico exista.
 * 3. Verifica que no haya conflicto de horario (consulta al repositorio).
 * 4. Recién ahí crea la entidad Cita y la persiste.
 *
 * Esta orquestación NO vive en la entidad Cita porque requiere acceso
 * a los repositorios (I/O), y el dominio puro no debe depender de I/O.
 */
export class AgendarCita {
  constructor(
    private readonly citaRepository: CitaRepository,
    private readonly pacienteRepository: PacienteRepository,
    private readonly medicoRepository: MedicoRepository
  ) {}

  async ejecutar(input: AgendarCitaInput): Promise<Cita> {
    const paciente = await this.pacienteRepository.buscarPorId(input.pacienteId);
    if (!paciente) {
      throw new EntidadNoEncontradaError("Paciente", input.pacienteId);
    }

    const medico = await this.medicoRepository.buscarPorId(input.medicoId);
    if (!medico) {
      throw new EntidadNoEncontradaError("Médico", input.medicoId);
    }

    const conflicto = await this.citaRepository.buscarConflicto(
      input.medicoId,
      input.fechaHora
    );
    if (conflicto) {
      throw new ConflictoHorarioError(input.medicoId, input.fechaHora);
    }

    const cita = Cita.crear({
      id: randomUUID(),
      pacienteId: input.pacienteId,
      medicoId: input.medicoId,
      fechaHora: input.fechaHora,
      motivo: input.motivo,
    });

    await this.citaRepository.guardar(cita);

    return cita;
  }
}