import { PrismaClient } from "@prisma/client";
import { Notificacion } from "../../domain/entities/Notificacion.js";
import { NotificacionRepository } from "../../domain/repositories/NotificacionRepository.js";

export class PrismaNotificacionRepository implements NotificacionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async guardar(notificacion: Notificacion): Promise<void> {
    await this.prisma.notificacion.upsert({
      where: { id: notificacion.getId() },
      create: {
        id: notificacion.getId(),
        citaId: notificacion.getCitaId(),
        canal: notificacion.getCanal(),
        estado: notificacion.getEstado(),
        intentos: notificacion.getIntentos(),
      },
      update: {
        estado: notificacion.getEstado(),
        intentos: notificacion.getIntentos(),
      },
    });
  }

  async buscarPorId(id: string): Promise<Notificacion | null> {
    const registro = await this.prisma.notificacion.findUnique({ where: { id } });
    return registro ? this.aDominio(registro) : null;
  }

  async listarPorCita(citaId: string): Promise<Notificacion[]> {
    const registros = await this.prisma.notificacion.findMany({ where: { citaId } });
    return registros.map((r) => this.aDominio(r));
  }

  /**
   * Soporta HU-04 y el diseño para el fallo: trae las notificaciones
   * que aún no se enviaron (o fallaron pero no agotaron sus reintentos)
   * para que un worker/cron las vuelva a procesar.
   */
  async listarPendientesParaReintento(): Promise<Notificacion[]> {
    const registros = await this.prisma.notificacion.findMany({
      where: {
        estado: { in: ["pendiente", "fallida"] },
        intentos: { lt: 3 },
      },
    });
    return registros.map((r) => this.aDominio(r));
  }

  private aDominio(registro: {
    id: string;
    citaId: string;
    canal: string;
    estado: string;
    intentos: number;
  }): Notificacion {
    return Notificacion.reconstruir({
      id: registro.id,
      citaId: registro.citaId,
      canal: registro.canal as "sms" | "email" | "whatsapp",
      estado: registro.estado as "pendiente" | "enviada" | "fallida",
      intentos: registro.intentos,
    });
  }
}