import { NotificacionSender } from "../../domain/services/NotificacionSender.js";
import { CanalNotificacion } from "../../domain/entities/Notificacion.js";

/**
 * Implementación Mock de NotificacionSender.
 * Para el prototipo, "envía" simulando el llamado a un proveedor externo
 * (Twilio/SendGrid/WhatsApp API) sin hacerlo realmente. Simula además
 * fallos aleatorios ocasionales, para poder demostrar el mecanismo de
 * reintentos del diseño para el fallo (Entregable 2) en la demo.
 *
 * En un entorno real, esta clase se reemplazaría por una que sí llame
 * a la API del proveedor (ej. TwilioNotificacionSender), sin tocar
 * nada del dominio ni de los casos de uso.
 */
export class MockNotificacionSender implements NotificacionSender {
  async enviar(params: {
    destinatarioEmail: string;
    destinatarioTelefono: string;
    canal: CanalNotificacion;
    mensaje: string;
  }): Promise<boolean> {
    const destino =
      params.canal === "email" ? params.destinatarioEmail : params.destinatarioTelefono;

    console.log(`[MockNotificacionSender] Enviando por ${params.canal} a ${destino}:`);
    console.log(`  "${params.mensaje}"`);

    // Simula latencia de red real
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Simula una tasa de fallo del 15% para poder demostrar reintentos
    const exito = Math.random() > 0.15;

    if (!exito) {
      console.log(`[MockNotificacionSender] Falló el envío (simulado)`);
    }

    return exito;
  }
}