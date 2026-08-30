import { z } from "zod";

/**
 * Schemas de validación (Zod) para el servicio de Citas.
 * Validan la forma de los datos ANTES de que lleguen al caso de uso,
 * siguiendo el contrato definido en el OpenAPI del Entregable 2.
 */

export const crearCitaSchema = z.object({
  pacienteId: z.string().uuid({ message: "pacienteId debe ser un UUID válido" }),
  medicoId: z.string().uuid({ message: "medicoId debe ser un UUID válido" }),
  fechaHora: z.coerce.date({ message: "fechaHora debe ser una fecha ISO válida" }),
  motivo: z.string().optional(),
});

export type CrearCitaDTO = z.infer<typeof crearCitaSchema>;

export const reprogramarCitaSchema = z.object({
  nuevaFechaHora: z.coerce.date({ message: "nuevaFechaHora debe ser una fecha ISO válida" }),
});

export type ReprogramarCitaDTO = z.infer<typeof reprogramarCitaSchema>;

export const listarCitasQuerySchema = z.object({
  pacienteId: z.string().uuid().optional(),
  medicoId: z.string().uuid().optional(),
  estado: z.enum(["pendiente", "confirmada", "cancelada", "atendida"]).optional(),
});

export type ListarCitasQueryDTO = z.infer<typeof listarCitasQuerySchema>;

export const citaIdParamSchema = z.object({
  id: z.string().uuid({ message: "id debe ser un UUID válido" }),
});