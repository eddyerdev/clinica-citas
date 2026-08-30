import { CitaRepository } from "../../domain/repositories/CitaRepository.js";
import { EntidadNoEncontradaError } from "../../domain/errors/DomainError.js";
import { Cita } from "../../domain/entities/Cita.js";

/**
 * Caso de Uso: Cancelar Cita (HU-03)
 * La regla de "no cancelar una cita atendida" ya vive dentro de la
 * entidad Cita (método .cancelar()), así que este caso de uso solo
 * se encarga de orquestar: buscar, delegar la regla al dominio, y persistir.
 */
export class CancelarCita {
  constructor(private readonly citaRepository: CitaRepository) {}

  async ejecutar(citaId: string): Promise<Cita> {
    const cita = await this.citaRepository.buscarPorId(citaId);
    if (!cita) {
      throw new EntidadNoEncontradaError("Cita", citaId);
    }

    cita.cancelar(); // la regla de negocio vive en la entidad, no aquí

    await this.citaRepository.guardar(cita);

    return cita;
  }
}