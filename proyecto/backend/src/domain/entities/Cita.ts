import { EstadoCita, EstadoCitaValor } from "../value-objects/EstadoCita.js";

interface CitaProps {
  id: string;
  pacienteId: string;
  medicoId: string;
  fechaHora: Date;
  estado: EstadoCita;
  motivo?: string;
}

/**
 * Entidad de Dominio: Cita (Aggregate Root del contexto "Citas")
 * Es el Aggregate Root porque las Notificaciones asociadas a una cita
 * solo tienen sentido a través de ella — no se accede a una notificación
 * sin pasar antes por su cita. Contiene la lógica de negocio central
 * del sistema: transiciones de estado y validación de horario.
 */
export class Cita {
  private readonly id: string;
  private readonly pacienteId: string;
  private readonly medicoId: string;
  private fechaHora: Date;
  private estado: EstadoCita;
  private motivo?: string;

  private constructor(props: CitaProps) {
    this.id = props.id;
    this.pacienteId = props.pacienteId;
    this.medicoId = props.medicoId;
    this.fechaHora = props.fechaHora;
    this.estado = props.estado;
    this.motivo = props.motivo;
  }

  static crear(props: {
    id: string;
    pacienteId: string;
    medicoId: string;
    fechaHora: Date;
    motivo?: string;
  }): Cita {
    if (props.fechaHora.getTime() <= Date.now()) {
      throw new Error("No se puede agendar una cita en una fecha pasada.");
    }

    return new Cita({
      id: props.id,
      pacienteId: props.pacienteId,
      medicoId: props.medicoId,
      fechaHora: props.fechaHora,
      estado: EstadoCita.pendiente(),
      motivo: props.motivo,
    });
  }

  /**
   * Reconstruye una Cita ya existente desde la base de datos.
   * Se usa en el repositorio de infraestructura (Prisma -> Dominio),
   * a diferencia de `crear()` que es solo para citas nuevas.
   */
  static reconstruir(props: {
    id: string;
    pacienteId: string;
    medicoId: string;
    fechaHora: Date;
    estado: EstadoCitaValor;
    motivo?: string;
  }): Cita {
    return new Cita({
      id: props.id,
      pacienteId: props.pacienteId,
      medicoId: props.medicoId,
      fechaHora: props.fechaHora,
      estado: EstadoCita.crear(props.estado),
      motivo: props.motivo,
    });
  }

  public confirmar(): void {
    this.estado = this.estado.transicionarA("confirmada");
  }

  public cancelar(): void {
    // Soporta directamente HU-03: no se puede cancelar una cita ya atendida
    // (EstadoCita.transicionarA ya lo impide, pero el mensaje aquí es más claro)
    if (this.estado.getValor() === "atendida") {
      throw new Error("No se puede cancelar una cita que ya fue atendida.");
    }
    this.estado = this.estado.transicionarA("cancelada");
  }

  public marcarComoAtendida(): void {
    this.estado = this.estado.transicionarA("atendida");
  }

  public reprogramar(nuevaFechaHora: Date): void {
    if (this.estado.esFinal()) {
      throw new Error(
        `No se puede reprogramar una cita en estado "${this.estado.getValor()}".`
      );
    }
    if (nuevaFechaHora.getTime() <= Date.now()) {
      throw new Error("No se puede reprogramar a una fecha pasada.");
    }
    this.fechaHora = nuevaFechaHora;
    this.estado = EstadoCita.pendiente();
  }

  /**
   * Regla de negocio central (HU-02): dos citas del mismo médico
   * no pueden coincidir en el mismo horario exacto.
   * Nota: esta validación de conflicto contra OTRAS citas requiere
   * consultar el repositorio (no puede resolverse solo con el estado
   * interno de esta instancia), por eso vive como caso de uso en
   * application/use-cases/AgendarCita, no aquí. Este método solo
   * expone el dato necesario para esa validación externa.
   */
  public coincideEnHorarioCon(otraFechaHora: Date, otroMedicoId: string): boolean {
    return (
      this.medicoId === otroMedicoId &&
      this.fechaHora.getTime() === otraFechaHora.getTime()
    );
  }

  public getId(): string {
    return this.id;
  }

  public getPacienteId(): string {
    return this.pacienteId;
  }

  public getMedicoId(): string {
    return this.medicoId;
  }

  public getFechaHora(): Date {
    return this.fechaHora;
  }

  public getEstado(): EstadoCita {
    return this.estado;
  }

  public getMotivo(): string | undefined {
    return this.motivo;
  }
}