export type CanalNotificacion = "sms" | "email" | "whatsapp";
export type EstadoNotificacion = "pendiente" | "enviada" | "fallida";

interface NotificacionProps {
  id: string;
  citaId: string;
  canal: CanalNotificacion;
  estado: EstadoNotificacion;
  intentos: number;
}

const MAX_INTENTOS = 3;

/**
 * Entidad de Dominio: Notificacion
 * Soporta directamente HU-04 (recordatorio automático) y el principio
 * de "diseño para el fallo" del Entregable 2: encapsula la lógica de
 * reintentos, para que no quede dispersa en el servicio de envío.
 */
export class Notificacion {
  private readonly id: string;
  private readonly citaId: string;
  private readonly canal: CanalNotificacion;
  private estado: EstadoNotificacion;
  private intentos: number;

  private constructor(props: NotificacionProps) {
    this.id = props.id;
    this.citaId = props.citaId;
    this.canal = props.canal;
    this.estado = props.estado;
    this.intentos = props.intentos;
  }

  static crear(props: { id: string; citaId: string; canal: CanalNotificacion }): Notificacion {
    return new Notificacion({
      id: props.id,
      citaId: props.citaId,
      canal: props.canal,
      estado: "pendiente",
      intentos: 0,
    });
  }

  static reconstruir(props: NotificacionProps): Notificacion {
    return new Notificacion(props);
  }

  public marcarComoEnviada(): void {
    this.estado = "enviada";
  }

  public registrarIntentoFallido(): void {
    this.intentos += 1;
    if (this.intentos >= MAX_INTENTOS) {
      this.estado = "fallida";
    }
  }

  public puedeReintentar(): boolean {
    return this.estado !== "enviada" && this.intentos < MAX_INTENTOS;
  }

  public getId(): string {
    return this.id;
  }

  public getCitaId(): string {
    return this.citaId;
  }

  public getCanal(): CanalNotificacion {
    return this.canal;
  }

  public getEstado(): EstadoNotificacion {
    return this.estado;
  }

  public getIntentos(): number {
    return this.intentos;
  }
}