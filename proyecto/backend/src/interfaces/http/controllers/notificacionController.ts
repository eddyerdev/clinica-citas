import { FastifyReply, FastifyRequest } from "fastify";
import { EnviarRecordatorio } from "../../../application/use-cases/EnviarRecordatorio.js";
import { ProcesarNotificacionesPendientes } from "../../../application/use-cases/ProcesarNotificacionesPendientes.js";
import { NotificacionRepository } from "../../../domain/repositories/NotificacionRepository.js";
import { citaIdParamSchema } from "../../schemas/citaSchemas.js";
import { Notificacion } from "../../../domain/entities/Notificacion.js";

export class NotificacionController {
  constructor(
    private readonly enviarRecordatorio: EnviarRecordatorio,
    private readonly procesarNotificacionesPendientes: ProcesarNotificacionesPendientes,
    private readonly notificacionRepository: NotificacionRepository
  ) {}

  /** Dispara manualmente el recordatorio de una cita puntual (HU-04). */
  enviarPorCita = async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = citaIdParamSchema.parse(request.params);

    const notificacion = await this.enviarRecordatorio.ejecutar(id);

    return reply.status(201).send(this.aRespuesta(notificacion));
  };

  /** Procesa todas las pendientes/fallidas con reintentos disponibles (diseño para el fallo). */
  procesarPendientes = async (_request: FastifyRequest, reply: FastifyReply) => {
    const resultado = await this.procesarNotificacionesPendientes.ejecutar();
    return reply.status(200).send(resultado);
  };

  listarPorCita = async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = citaIdParamSchema.parse(request.params);

    const notificaciones = await this.notificacionRepository.listarPorCita(id);

    return reply.status(200).send(notificaciones.map((n) => this.aRespuesta(n)));
  };

  private aRespuesta(notificacion: Notificacion) {
    return {
      id: notificacion.getId(),
      citaId: notificacion.getCitaId(),
      canal: notificacion.getCanal(),
      estado: notificacion.getEstado(),
      intentos: notificacion.getIntentos(),
    };
  }
}