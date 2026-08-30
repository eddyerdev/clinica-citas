interface MedicoProps {
  id: string;
  nombre: string;
  especialidad: string;
}

/**
 * Entidad de Dominio: Medico
 * Representa al profesional de salud dentro del contexto de Citas.
 * Nota: en este bounded context (Citas), solo nos interesan los datos
 * mínimos del médico necesarios para agendar. Si en el futuro existiera
 * un servicio propio de "Personal Médico" con más detalle (horarios,
 * licencias, etc.), este modelo seguiría siendo la vista simplificada
 * que necesita el contexto de Citas — no se duplica el dominio completo.
 */
export class Medico {
  private readonly id: string;
  private nombre: string;
  private especialidad: string;

  private constructor(props: MedicoProps) {
    this.id = props.id;
    this.nombre = props.nombre;
    this.especialidad = props.especialidad;
  }

  static crear(props: { id: string; nombre: string; especialidad: string }): Medico {
    if (!props.nombre || props.nombre.trim().length < 2) {
      throw new Error("El nombre del médico debe tener al menos 2 caracteres.");
    }

    if (!props.especialidad || props.especialidad.trim().length === 0) {
      throw new Error("La especialidad del médico es obligatoria.");
    }

    return new Medico({
      id: props.id,
      nombre: props.nombre.trim(),
      especialidad: props.especialidad.trim(),
    });
  }

  public actualizarEspecialidad(especialidad: string): void {
    if (!especialidad || especialidad.trim().length === 0) {
      throw new Error("La especialidad no puede estar vacía.");
    }
    this.especialidad = especialidad.trim();
  }

  public getId(): string {
    return this.id;
  }

  public getNombre(): string {
    return this.nombre;
  }

  public getEspecialidad(): string {
    return this.especialidad;
  }
}