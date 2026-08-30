import { randomUUID } from "node:crypto";
import { Notificacion } from "../../domain/entities/Notificacion.js";
import { NotificacionRepository } from "../../domain/repositories/NotificacionRepository.js";
import { CitaRepository } from "../../domain/repositories/CitaRepository.js";
import { PacienteRepository } from "../../domain/repositories/PacienteRepository.js";
import { NotificacionSender } from "../../domain/services/NotificacionSender.js";
import { EntidadNoEncontradaError } from "../../domain/errors/DomainError.js";

/**
 * Caso de Uso: Enviar Recordatorio de Cita (HU-04)
 * Orquesta: buscar la cita y el paciente, construir el mensaje según
 * el canal preferido del paciente, intentar el envío, y registrar
 * el resultado (éxito o fallo) en la entidad Notificacion.
 */
export class EnviarRecordatorio {
  constructor(
    private readonly notificacionRepository: NotificacionRepository,
    private readonly citaRepository: CitaRepository,
    private readonly pacienteRepository: PacienteRepository,
    private readonly sender: NotificacionSender
  ) {}

  async ejecutar(citaId: string): Promise<Notificacion> {
    const cita = await this.citaRepository.buscarPorId(citaId);
    if (!cita) {
      throw new EntidadNoEncontradaError("Cita", citaId);
    }

    const paciente = await this.pacienteRepository.buscarPorId(cita.getPacienteId());
    if (!paciente) {
      throw new EntidadNoEncontradaError("Paciente", cita.getPacienteId());
    }

    const notificacion = Notificacion.crear({
      id: randomUUID(),
      citaId: cita.getId(),
      canal: paciente.getCanalPreferido(),
    });

    const mensaje = `Recordatorio: tiene una cita el ${cita
      .getFechaHora()
      .toLocaleString("es-PE")}. Motivo: ${cita.getMotivo() ?? "consulta general"}.`;

    const exito = await this.sender.enviar({
      destinatarioEmail: paciente.getEmail().getValor(),
      destinatarioTelefono: paciente.getTelefono().getValor(),
      canal: paciente.getCanalPreferido(),
      mensaje,
    });

    if (exito) {
      notificacion.marcarComoEnviada();
    } else {
      notificacion.registrarIntentoFallido();
    }

    await this.notificacionRepository.guardar(notificacion);

    return notificacion;
  }
}