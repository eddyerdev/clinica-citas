import { Medico } from "../entities/Medico.js";

export interface MedicoRepository {
  guardar(medico: Medico): Promise<void>;
  buscarPorId(id: string): Promise<Medico | null>;
  listar(): Promise<Medico[]>;
}