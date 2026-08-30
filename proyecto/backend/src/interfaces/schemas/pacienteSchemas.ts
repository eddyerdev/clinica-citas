import { z } from "zod";

/**
 * Schemas de validación (Zod) para el servicio de Pacientes.
 * Corresponde a HU-01: valida formato de email y teléfono antes de guardar,
 * tal como pide el criterio de aceptación.
 */

export const registrarPacienteSchema = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  documento: z.string().min(1, "El documento es obligatorio"),
  telefono: z.string().min(9, "El teléfono debe tener al menos 9 dígitos"),
  email: z.string().email("El email no tiene un formato válido"),
  canalPreferido: z.enum(["sms", "email", "whatsapp"]).optional(),
});

export type RegistrarPacienteDTO = z.infer<typeof registrarPacienteSchema>;

export const pacienteIdParamSchema = z.object({
  id: z.string().uuid({ message: "id debe ser un UUID válido" }),
});