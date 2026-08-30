import axios from "axios";

/**
 * Cliente HTTP centralizado hacia el backend.
 * En desarrollo (Vite), usa el proxy "/api" definido en vite.config.ts.
 * En producción (Nginx), "/api" lo resuelve el reverse proxy de nginx.conf.
 * Así el código de la app nunca necesita saber el host/puerto real del backend.
 */
export const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

// --- Tipos que coinciden con las respuestas del backend ---

export interface Paciente {
  id: string;
  nombre: string;
  documento: string;
  telefono: string;
  email: string;
  canalPreferido: "sms" | "email" | "whatsapp";
}

export interface Cita {
  id: string;
  pacienteId: string;
  medicoId: string;
  fechaHora: string;
  estado: "pendiente" | "confirmada" | "cancelada" | "atendida";
  motivo: string | null;
}

export interface Medico {
  id: string;
  nombre: string;
  especialidad: string;
}

// --- Funciones de llamada a la API ---

export async function listarPacientes(): Promise<Paciente[]> {
  const { data } = await api.get<Paciente[]>("/pacientes");
  return data;
}

export async function registrarPaciente(input: {
  nombre: string;
  documento: string;
  telefono: string;
  email: string;
  canalPreferido: "sms" | "email" | "whatsapp";
}): Promise<Paciente> {
  const { data } = await api.post<Paciente>("/pacientes", input);
  return data;
}

export async function listarCitasPorPaciente(pacienteId: string): Promise<Cita[]> {
  const { data } = await api.get<Cita[]>("/citas", { params: { pacienteId } });
  return data;
}

export async function agendarCita(input: {
  pacienteId: string;
  medicoId: string;
  fechaHora: string;
  motivo?: string;
}): Promise<Cita> {
  const { data } = await api.post<Cita>("/citas", input);
  return data;
}

export async function cancelarCita(citaId: string): Promise<void> {
  await api.delete(`/citas/${citaId}`);
}

export async function enviarRecordatorio(citaId: string): Promise<void> {
  await api.post(`/citas/${citaId}/recordatorio`);
}

export async function listarMedicos(): Promise<Medico[]> {
  const { data } = await api.get<Medico[]>("/medicos");
  return data;
}

export interface Notificacion {
  id: string;
  citaId: string;
  canal: "sms" | "email" | "whatsapp";
  estado: "pendiente" | "enviada" | "fallida";
  intentos: number;
}

export async function reprogramarCita(citaId: string, nuevaFechaHora: string): Promise<Cita> {
  const { data } = await api.patch<Cita>(`/citas/${citaId}`, { nuevaFechaHora });
  return data;
}

export async function listarNotificacionesPorCita(citaId: string): Promise<Notificacion[]> {
  const { data } = await api.get<Notificacion[]>(`/citas/${citaId}/notificaciones`);
  return data;
}

export async function procesarNotificacionesPendientes(): Promise<{
  procesadas: number;
  exitosas: number;
  fallidas: number;
}> {
  const { data } = await api.post("/notificaciones/procesar-pendientes");
  return data;
}