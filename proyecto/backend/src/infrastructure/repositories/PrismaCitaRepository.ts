import { PrismaClient } from "@prisma/client";
import { Cita } from "../../domain/entities/Cita.js";
import { CitaRepository } from "../../domain/repositories/CitaRepository.js";
import { EstadoCitaValor } from "../../domain/value-objects/EstadoCita.js";

export class PrismaCitaRepository implements CitaRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async guardar(cita: Cita): Promise<void> {
    await this.prisma.cita.upsert({
      where: { id: cita.getId() },
      create: {
        id: cita.getId(),
        pacienteId: cita.getPacienteId(),
        medicoId: cita.getMedicoId(),
        fechaHora: cita.getFechaHora(),
        estado: cita.getEstado().getValor(),
        motivo: cita.getMotivo(),
      },
      update: {
        fechaHora: cita.getFechaHora(),
        estado: cita.getEstado().getValor(),
        motivo: cita.getMotivo(),
      },
    });
  }

  async buscarPorId(id: string): Promise<Cita | null> {
    const registro = await this.prisma.cita.findUnique({ where: { id } });
    return registro ? this.aDominio(registro) : null;
  }

  async listarPorPaciente(pacienteId: string): Promise<Cita[]> {
    const registros = await this.prisma.cita.findMany({
      where: { pacienteId },
      orderBy: { fechaHora: "desc" },
    });
    return registros.map((r) => this.aDominio(r));
  }

  async listarPorMedico(medicoId: string): Promise<Cita[]> {
    const registros = await this.prisma.cita.findMany({
      where: { medicoId },
      orderBy: { fechaHora: "asc" },
    });
    return registros.map((r) => this.aDominio(r));
  }

  /**
   * Soporta HU-02: busca una cita activa (no cancelada) del mismo médico
   * en el mismo horario exacto. Es la consulta que usa el caso de uso
   * AgendarCita para rechazar choques de horario.
   */
  async buscarConflicto(medicoId: string, fechaHora: Date): Promise<Cita | null> {
    const registro = await this.prisma.cita.findFirst({
      where: {
        medicoId,
        fechaHora,
        estado: { not: "cancelada" },
      },
    });
    return registro ? this.aDominio(registro) : null;
  }

  async listarHorariosOcupados(medicoId: string, fecha: Date): Promise<Date[]> {
    const inicioDelDia = new Date(fecha);
    inicioDelDia.setHours(0, 0, 0, 0);
    const finDelDia = new Date(fecha);
    finDelDia.setHours(23, 59, 59, 999);

    const registros = await this.prisma.cita.findMany({
      where: {
        medicoId,
        fechaHora: { gte: inicioDelDia, lte: finDelDia },
        estado: { not: "cancelada" },
      },
      select: { fechaHora: true },
    });

    return registros.map((r) => r.fechaHora);
  }

  private aDominio(registro: {
    id: string;
    pacienteId: string;
    medicoId: string;
    fechaHora: Date;
    estado: string;
    motivo: string | null;
  }): Cita {
    return Cita.reconstruir({
      id: registro.id,
      pacienteId: registro.pacienteId,
      medicoId: registro.medicoId,
      fechaHora: registro.fechaHora,
      estado: registro.estado as EstadoCitaValor,
      motivo: registro.motivo ?? undefined,
    });
  }
}