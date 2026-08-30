import { randomUUID } from "node:crypto";
import { Paciente, CanalNotificacion } from "../../domain/entities/Paciente.js";
import { PacienteRepository } from "../../domain/repositories/PacienteRepository.js";
import { ValidationError } from "../../domain/errors/DomainError.js";

export interface RegistrarPacienteInput {
  nombre: string;
  documento: string;
  telefono: string;
  email: string;
  canalPreferido?: CanalNotificacion;
}

/**
 * Caso de Uso: Registrar Paciente (HU-01)
 * Regla de negocio: no se permiten documentos de identidad duplicados
 * (criterio de aceptación explícito de HU-01). Esta verificación requiere
 * consultar el repositorio, por eso vive aquí y no en la entidad Paciente.
 */
export class RegistrarPaciente {
  constructor(private readonly pacienteRepository: PacienteRepository) {}

  async ejecutar(input: RegistrarPacienteInput): Promise<Paciente> {
    const existente = await this.pacienteRepository.buscarPorDocumento(input.documento);
    if (existente) {
      throw new ValidationError(
        `Ya existe un paciente registrado con el documento "${input.documento}".`
      );
    }

    const paciente = Paciente.crear({
      id: randomUUID(),
      nombre: input.nombre,
      documento: input.documento,
      telefono: input.telefono,
      email: input.email,
      canalPreferido: input.canalPreferido,
    });

    await this.pacienteRepository.guardar(paciente);

    return paciente;
  }
}