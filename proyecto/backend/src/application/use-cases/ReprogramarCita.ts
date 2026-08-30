import { CitaRepository } from "../../domain/repositories/CitaRepository.js";
import { EntidadNoEncontradaError, ConflictoHorarioError } from "../../domain/errors/DomainError.js";
import { Cita } from "../../domain/entities/Cita.js";

export interface ReprogramarCitaInput {
  citaId: string;
  nuevaFechaHora: Date;
}

/**
 * Caso de Uso: Reprogramar Cita (parte de HU-03)
 * Igual que en AgendarCita, la validación de choque de horario necesita
 * consultar OTRAS citas (I/O), por eso se verifica aquí antes de delegar
 * la transición de estado a la entidad.
 */
export class ReprogramarCita {
  constructor(private readonly citaRepository: CitaRepository) {}

  async ejecutar(input: ReprogramarCitaInput): Promise<Cita> {
    const cita = await this.citaRepository.buscarPorId(input.citaId);
    if (!cita) {
      throw new EntidadNoEncontradaError("Cita", input.citaId);
    }

    const conflicto = await this.citaRepository.buscarConflicto(
      cita.getMedicoId(),
      input.nuevaFechaHora
    );
    if (conflicto && conflicto.getId() !== cita.getId()) {
      throw new ConflictoHorarioError(cita.getMedicoId(), input.nuevaFechaHora);
    }

    cita.reprogramar(input.nuevaFechaHora); // valida fecha futura y estado no-final

    await this.citaRepository.guardar(cita);

    return cita;
  }
}