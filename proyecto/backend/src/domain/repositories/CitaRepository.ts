import { Cita } from "../entities/Cita.js";

export interface CitaRepository {
  guardar(cita: Cita): Promise<void>;
  buscarPorId(id: string): Promise<Cita | null>;
  listarPorPaciente(pacienteId: string): Promise<Cita[]>;
  listarPorMedico(medicoId: string): Promise<Cita[]>;

  /**
   * Busca si existe una cita activa (no cancelada) para un médico
   * en un horario exacto. Es la consulta que soporta la validación
   * de HU-02 (evitar choque de horarios) desde el caso de uso.
   */
  buscarConflicto(medicoId: string, fechaHora: Date): Promise<Cita | null>;

  /** Horarios ya ocupados de un médico en una fecha, para el endpoint de disponibilidad. */
  listarHorariosOcupados(medicoId: string, fecha: Date): Promise<Date[]>;
}