import { PrismaClient } from "@prisma/client";
import { Paciente } from "../../domain/entities/Paciente.js";
import { PacienteRepository } from "../../domain/repositories/PacienteRepository.js";

/**
 * Implementación concreta de PacienteRepository usando Prisma.
 * Es la única clase que sabe traducir entre el modelo de persistencia
 * (tabla `pacientes` de Postgres) y la entidad de dominio `Paciente`.
 * El resto del sistema (casos de uso) solo conoce la interfaz.
 */
export class PrismaPacienteRepository implements PacienteRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async guardar(paciente: Paciente): Promise<void> {
    await this.prisma.paciente.upsert({
      where: { id: paciente.getId() },
      create: {
        id: paciente.getId(),
        nombre: paciente.getNombre(),
        documento: paciente.getDocumento(),
        telefono: paciente.getTelefono().getValor(),
        email: paciente.getEmail().getValor(),
        canalPreferido: paciente.getCanalPreferido(),
      },
      update: {
        nombre: paciente.getNombre(),
        telefono: paciente.getTelefono().getValor(),
        email: paciente.getEmail().getValor(),
        canalPreferido: paciente.getCanalPreferido(),
      },
    });
  }

  async buscarPorId(id: string): Promise<Paciente | null> {
    const registro = await this.prisma.paciente.findUnique({ where: { id } });
    return registro ? this.aDominio(registro) : null;
  }

  async buscarPorDocumento(documento: string): Promise<Paciente | null> {
    const registro = await this.prisma.paciente.findUnique({ where: { documento } });
    return registro ? this.aDominio(registro) : null;
  }

  async listar(): Promise<Paciente[]> {
    const registros = await this.prisma.paciente.findMany();
    return registros.map((r) => this.aDominio(r));
  }

  /** Mapea un registro de Prisma hacia la entidad de dominio. */
  private aDominio(registro: {
    id: string;
    nombre: string;
    documento: string;
    telefono: string;
    email: string;
    canalPreferido: string;
  }): Paciente {
    return Paciente.crear({
      id: registro.id,
      nombre: registro.nombre,
      documento: registro.documento,
      telefono: registro.telefono,
      email: registro.email,
      canalPreferido: registro.canalPreferido as "sms" | "email" | "whatsapp",
    });
  }
}