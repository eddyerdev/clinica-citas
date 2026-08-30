/**
 * Value Object: Email
 * Encapsula la validación y las reglas de un correo electrónico válido.
 * En DDD, un Value Object no tiene identidad propia (no tiene `id`),
 * se compara por su valor, y es inmutable una vez creado.
 */
export class Email {
  private readonly valor: string;

  private constructor(valor: string) {
    this.valor = valor;
  }

  static crear(valor: string): Email {
    const email = valor.trim().toLowerCase();

    if (!Email.esValido(email)) {
      throw new Error(`Email inválido: "${valor}"`);
    }

    return new Email(email);
  }

  private static esValido(valor: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(valor);
  }

  public getValor(): string {
    return this.valor;
  }

  public equals(otro: Email): boolean {
    return this.valor === otro.valor;
  }

  public toString(): string {
    return this.valor;
  }
}