import { TransicionEstadoInvalidaError } from "../errors/DomainError.js";

/**
 * Value Object: EstadoCita
 * Encapsula los estados válidos de una cita y las transiciones permitidas
 * entre ellos. Esto evita que la regla de negocio "de qué estado a qué
 * estado se puede pasar" quede dispersa en controllers o casos de uso.
 */
export type EstadoCitaValor = "pendiente" | "confirmada" | "cancelada" | "atendida";

const TRANSICIONES_VALIDAS: Record<EstadoCitaValor, EstadoCitaValor[]> = {
  pendiente: ["confirmada", "cancelada"],
  confirmada: ["cancelada", "atendida"],
  cancelada: [], // estado final, no se puede transicionar desde aquí
  atendida: [],  // estado final, no se puede transicionar desde aquí
};

export class EstadoCita {
  private readonly valor: EstadoCitaValor;

  private constructor(valor: EstadoCitaValor) {
    this.valor = valor;
  }

  static crear(valor: EstadoCitaValor): EstadoCita {
    return new EstadoCita(valor);
  }

  static pendiente(): EstadoCita {
    return new EstadoCita("pendiente");
  }

  public puedeTransicionarA(nuevoEstado: EstadoCitaValor): boolean {
    return TRANSICIONES_VALIDAS[this.valor].includes(nuevoEstado);
  }

      public transicionarA(nuevoEstado: EstadoCitaValor): EstadoCita {
    if (!this.puedeTransicionarA(nuevoEstado)) {
      throw new TransicionEstadoInvalidaError(this.valor, nuevoEstado);
    }
    return new EstadoCita(nuevoEstado);
  }

  public esFinal(): boolean {
    return this.valor === "cancelada" || this.valor === "atendida";
  }

  public getValor(): EstadoCitaValor {
    return this.valor;
  }

  public equals(otro: EstadoCita): boolean {
    return this.valor === otro.valor;
  }

  public toString(): string {
    return this.valor;
  }
}