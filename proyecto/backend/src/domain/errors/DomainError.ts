/**
 * Errores de Dominio
 * Clases de error específicas del negocio, en vez de usar `Error` genérico.
 * Esto permite que la capa de interfaces (controllers HTTP) distinga el
 * tipo de error y responda con el código HTTP correcto (ej. 409 para
 * conflictos de negocio, 400 para validación, 404 para no encontrado),
 * sin acoplar el dominio a conceptos de HTTP.
 */

export abstract class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** Se lanza cuando una entidad no cumple una regla de validación básica. */
export class ValidationError extends DomainError {}

/** Se lanza cuando se intenta agendar una cita en un horario ya ocupado (HU-02). */
export class ConflictoHorarioError extends DomainError {
  constructor(medicoId: string, fechaHora: Date) {
    super(
      `El médico ${medicoId} ya tiene una cita agendada el ${fechaHora.toISOString()}.`
    );
  }
}

/** Se lanza cuando se intenta una transición de estado no permitida (ej. cancelar una cita atendida, HU-03). */
export class TransicionEstadoInvalidaError extends DomainError {
  constructor(estadoActual: string, estadoDestino: string) {
    super(`No se puede pasar de "${estadoActual}" a "${estadoDestino}".`);
  }
}

/** Se lanza cuando no se encuentra una entidad solicitada. */
export class EntidadNoEncontradaError extends DomainError {
  constructor(entidad: string, id: string) {
    super(`${entidad} con id "${id}" no fue encontrado(a).`);
  }
}