import { Paciente } from "../entities/Paciente.js";

/**
 * Contrato del repositorio de Pacientes.
 * El dominio y los casos de uso dependen de esta interfaz, NUNCA de Prisma
 * directamente. Esto es la aplicación del Principio de Inversión de
 * Dependencias (la "D" de SOLID) dentro de DDD: la capa de dominio no sabe
 * qué motor de base de datos existe detrás.
 */
export interface PacienteRepository {
  guardar(paciente: Paciente): Promise<void>;
  buscarPorId(id: string): Promise<Paciente | null>;
  buscarPorDocumento(documento: string): Promise<Paciente | null>;
  listar(): Promise<Paciente[]>;
}