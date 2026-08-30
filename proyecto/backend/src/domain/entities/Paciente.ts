import { Email } from "../value-objects/Email.js";
import { Telefono } from "../value-objects/Telefono.js";

export type CanalNotificacion = "sms" | "email" | "whatsapp";

interface PacienteProps {
  id: string;
  nombre: string;
  documento: string;
  telefono: Telefono;
  email: Email;
  canalPreferido: CanalNotificacion;
}

/**
 * Entidad de Dominio: Paciente
 * A diferencia de un Value Object, una Entidad SÍ tiene identidad (id) y
 * puede cambiar de estado a lo largo del tiempo, pero sigue siendo el mismo
 * Paciente. Esta clase es independiente de Prisma/DB: no sabe cómo se
 * persiste, solo contiene las reglas de negocio propias de un paciente.
 */
export class Paciente {
  private readonly id: string;
  private nombre: string;
  private readonly documento: string;
  private telefono: Telefono;
  private email: Email;
  private canalPreferido: CanalNotificacion;

  private constructor(props: PacienteProps) {
    this.id = props.id;
    this.nombre = props.nombre;
    this.documento = props.documento;
    this.telefono = props.telefono;
    this.email = props.email;
    this.canalPreferido = props.canalPreferido;
  }

  static crear(props: {
    id: string;
    nombre: string;
    documento: string;
    telefono: string;
    email: string;
    canalPreferido?: CanalNotificacion;
  }): Paciente {
    if (!props.nombre || props.nombre.trim().length < 2) {
      throw new Error("El nombre del paciente debe tener al menos 2 caracteres.");
    }

    if (!props.documento || props.documento.trim().length === 0) {
      throw new Error("El documento de identidad es obligatorio.");
    }

    return new Paciente({
      id: props.id,
      nombre: props.nombre.trim(),
      documento: props.documento.trim(),
      telefono: Telefono.crear(props.telefono),
      email: Email.crear(props.email),
      canalPreferido: props.canalPreferido ?? "email",
    });
  }

  public actualizarContacto(telefono: string, email: string): void {
    this.telefono = Telefono.crear(telefono);
    this.email = Email.crear(email);
  }

  public cambiarCanalPreferido(canal: CanalNotificacion): void {
    this.canalPreferido = canal;
  }

  // Getters (necesarios para que la capa de infraestructura pueda leer
  // el estado y mapearlo hacia Prisma, sin exponer los setters directos)
  public getId(): string {
    return this.id;
  }

  public getNombre(): string {
    return this.nombre;
  }

  public getDocumento(): string {
    return this.documento;
  }

  public getTelefono(): Telefono {
    return this.telefono;
  }

  public getEmail(): Email {
    return this.email;
  }

  public getCanalPreferido(): CanalNotificacion {
    return this.canalPreferido;
  }
}