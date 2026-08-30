import { Notificacion } from "../../domain/entities/Notificacion.js";
import { NotificacionRepository } from "../../domain/repositories/NotificacionRepository.js";
import { CitaRepository } from "../../domain/repositories/CitaRepository.js";
import { PacienteRepository } from "../../domain/repositories/PacienteRepository.js";
import { NotificacionSender } from "../../domain/services/NotificacionSender.js";

/**
 * Caso de Uso: Procesar Notificaciones Pendientes
 * Implementa el mecanismo de reintentos del diseño para el fallo
 * (Entregable 2): busca notificaciones que no se enviaron o fallaron
 * (con intentos < 3), y reintenta el envío para cada una.
 *
 * En producción, este caso de uso lo dispararía un cron/scheduler
 * cada cierto tiempo. En el prototipo, lo exponemos como un endpoint
 * manual (POST /notificaciones/procesar-pendientes) — limitación
 * conocida documentada para el Entregable 3.
 */
export class ProcesarNotificacionesPendientes {
  constructor(
    private readonly notificacionRepository: NotificacionRepository,
    private readonly citaRepository: CitaRepository,
    private readonly pacienteRepository: PacienteRepository,
    private readonly sender: NotificacionSender
  ) {}

  async ejecutar(): Promise<{ procesadas: number; exitosas: number; fallidas: number }> {
    const pendientes = await this.notificacionRepository.listarPendientesParaReintento();

    let exitosas = 0;
    let fallidas = 0;

    for (const notificacion of pendientes) {
      const resultado = await this.procesarUna(notificacion);
      if (resultado) exitosas++;
      else fallidas++;
    }

    return { procesadas: pendientes.length, exitosas, fallidas };
  }

  private async procesarUna(notificacion: Notificacion): Promise<boolean> {
    const cita = await this.citaRepository.buscarPorId(notificacion.getCitaId());
    if (!cita) return false;

    const paciente = await this.pacienteRepository.buscarPorId(cita.getPacienteId());
    if (!paciente) return false;

    const mensaje = `Recordatorio: tiene una cita el ${cita
      .getFechaHora()
      .toLocaleString("es-PE")}. Motivo: ${cita.getMotivo() ?? "consulta general"}.`;

    const exito = await this.sender.enviar({
      destinatarioEmail: paciente.getEmail().getValor(),
      destinatarioTelefono: paciente.getTelefono().getValor(),
      canal: notificacion.getCanal(),
      mensaje,
    });

    if (exito) {
      notificacion.marcarComoEnviada();
    } else {
      notificacion.registrarIntentoFallido();
    }

    await this.notificacionRepository.guardar(notificacion);

    return exito;
  }
}