/**
 * Value Object: Telefono
 * Encapsula la validación de un número de teléfono de contacto.
 * Se usa tanto para el teléfono del paciente como, potencialmente,
 * para futuros canales de notificación (SMS/WhatsApp).
 */
export class Telefono {
  private readonly valor: string;

  private constructor(valor: string) {
    this.valor = valor;
  }

  static crear(valor: string): Telefono {
    const limpio = valor.trim().replace(/[\s-]/g, "");

    if (!Telefono.esValido(limpio)) {
      throw new Error(`Teléfono inválido: "${valor}"`);
    }

    return new Telefono(limpio);
  }

  private static esValido(valor: string): boolean {
    // Acepta formato internacional opcional (+) y entre 9 y 15 dígitos
    const regex = /^\+?[0-9]{9,15}$/;
    return regex.test(valor);
  }

  public getValor(): string {
    return this.valor;
  }

  public equals(otro: Telefono): boolean {
    return this.valor === otro.valor;
  }

  public toString(): string {
    return this.valor;
  }
}