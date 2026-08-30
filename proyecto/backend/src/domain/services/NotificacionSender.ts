import { CanalNotificacion } from "../entities/Notificacion.js";

/**
 * Puerto de Dominio: NotificacionSender
 * Define el contrato para "enviar" una notificación por un canal dado,
 * sin que el dominio sepa si detrás hay Twilio, SendGrid, WhatsApp
 * Business API, o un mock. Es el mismo patrón que los repositorios:
 * el dominio depende de la abstracción, no de la implementación.
 */
export interface NotificacionSender {
  enviar(params: {
    destinatarioEmail: string;
    destinatarioTelefono: string;
    canal: CanalNotificacion;
    mensaje: string;
  }): Promise<boolean>; // true = envío exitoso, false = falló
}