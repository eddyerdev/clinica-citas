import { Notificacion } from "../entities/Notificacion.js";

export interface NotificacionRepository {
  guardar(notificacion: Notificacion): Promise<void>;
  buscarPorId(id: string): Promise<Notificacion | null>;
  listarPorCita(citaId: string): Promise<Notificacion[]>;
  listarPendientesParaReintento(): Promise<Notificacion[]>;
}