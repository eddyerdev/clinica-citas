## 1.1 Definición del Ecosistema de Servicios

Se identifican tres servicios clave para la red de clínicas:

### Servicio de Pacientes

Gestiona el registro, historial básico y datos demográficos de los pacientes. **Justificación de autonomía:** Los datos del paciente (identidad, contacto, historial) tienen un ciclo de vida independiente de una cita puntual. Un paciente existe en el sistema sin necesidad de tener citas activas, y su información no depende de si se le notifica algo o no. Puede evolucionar (agregar historiales clínicos, cambiar de clínica) sin afectar a los otros servicios.

### Servicio de Citas

Gestiona la programación, reprogramación, cancelación y validación de disponibilidad de citas médicas. **Justificación de autonomía:** La lógica de negocio de agendamiento (choques de horario, disponibilidad de médicos, duración de consultas) es un dominio propio y complejo que cambia por razones distintas a los datos del paciente o al envío de notificaciones. Puede escalar independientemente en horas pico (ej. lunes en la mañana) sin que los otros servicios necesiten la misma capacidad.

### Servicio de Notificaciones

Gestiona el envío de recordatorios, confirmaciones y alertas (SMS, email, push) a pacientes y médicos. **Justificación de autonomía:** Es un servicio de soporte transversal, consumido por Citas y Pacientes, pero con su propia lógica de reintentos, colas de mensajes y proveedores externos (Twilio, SendGrid, etc.). Su caída no debe tumbar la capacidad de agendar citas (principio de diseño para el fallo); solo debe degradar el envío de avisos.

**Bajo acoplamiento:** los tres servicios se comunican mediante eventos/API REST (ej. "CitaConfirmada" dispara una notificación) y no comparten base de datos, lo que permite desplegar, escalar y modificar cada uno sin afectar a los demás (Database per Service).

---

## 1.2 Recolección de Información

### Técnica 1: Entrevista al personal médico

**Objetivo:** Identificar fricciones en el proceso actual de agendamiento y atención. **Perfil entrevistado:** Médicos generales y personal de admisión de 2 clínicas de la red. **Preguntas clave:**

1. ¿Cómo gestionan actualmente los choques de horario o citas duplicadas?
2. ¿Qué tan frecuente es que un paciente falte a su cita sin avisar?
3. ¿Qué información del paciente necesitan ver antes de la consulta?

**Hallazgos principales:**

- El 30% de las inasistencias se debe a que el paciente olvidó la cita (no hubo recordatorio automático).
- El registro de pacientes está duplicado entre clínicas de la misma red, generando historiales fragmentados.
- El personal de admisión pierde tiempo confirmando manualmente por teléfono.

### Técnica 2: Encuesta a pacientes

**Objetivo:** Medir la experiencia del paciente al agendar y ser atendido. **Método:** Encuesta digital de 8 preguntas cerradas + 1 abierta, aplicada a una muestra de pacientes recientes. **Preguntas clave (ejemplos):**

1. ¿Qué canal prefiere para recibir recordatorios de citas? (SMS / Email / WhatsApp / Llamada)
2. En una escala del 1 al 5, ¿qué tan fácil fue agendar su última cita?
3. ¿Ha tenido que reprogramar una cita en el último año? ¿Por qué motivo?

**Hallazgos principales:**

- 68% prefiere recibir recordatorios por WhatsApp/SMS antes que llamada.
- La mayoría califica el agendamiento actual (telefónico) como "regular" (3/5).
- Un porcentaje relevante reprogramó por falta de aviso con anticipación suficiente.

---

## 1.3 Especificación de Requerimientos

### Requerimientos Funcionales (Historias de Usuario)

**HU-01: Registro de paciente**

> Como personal de admisión, quiero registrar a un nuevo paciente con sus datos básicos, para poder asociarlo a citas futuras. **Criterios de aceptación:**

- Dado que ingreso nombre, documento de identidad, teléfono y email, cuando guardo el registro, entonces el sistema crea el paciente y rechaza documentos duplicados.
- El sistema valida formato de email y teléfono antes de guardar.

**HU-02: Agendar cita médica**

> Como paciente, quiero agendar una cita con un médico disponible, para recibir atención en la fecha que me convenga. **Criterios de aceptación:**

- Dado un médico y un horario, cuando solicito la cita, entonces el sistema verifica disponibilidad antes de confirmar.
- Si el horario ya está ocupado, el sistema rechaza la solicitud y sugiere horarios alternativos.

**HU-03: Cancelar o reprogramar cita**

> Como paciente, quiero cancelar o reprogramar una cita existente, para ajustar mi atención según mi disponibilidad. **Criterios de aceptación:**

- Dado que la cita existe y no ha pasado, cuando la cancelo, entonces el sistema libera el horario y notifica al médico.
- El sistema no permite cancelar una cita que ya fue atendida.

**HU-04: Recibir recordatorio de cita**

> Como paciente, quiero recibir un recordatorio automático antes de mi cita, para no olvidarla. **Criterios de aceptación:**

- Dado que una cita está confirmada, cuando faltan 24 horas para la cita, entonces el sistema envía un recordatorio por el canal preferido del paciente.
- Si el envío falla, el sistema reintenta hasta 3 veces antes de marcarlo como fallido.

**HU-05: Consultar historial de citas**

> Como médico, quiero ver el historial de citas de un paciente, para tener contexto antes de la consulta. **Criterios de aceptación:**

- Dado un paciente identificado, cuando accedo a su perfil, entonces veo la lista de citas pasadas y futuras con estado (atendida, cancelada, pendiente).
- La información se muestra en menos de 2 segundos.

### Requerimientos No Funcionales (SMART)

**RNF-01 (Rendimiento):** El servicio de Citas debe responder al 95% de las solicitudes de agendamiento en menos de 500 ms, medido bajo una carga de 100 solicitudes concurrentes, evaluado mensualmente mediante pruebas de carga.

**RNF-02 (Seguridad):** Toda comunicación entre servicios y con el cliente debe utilizar HTTPS/TLS 1.2+, y los datos sensibles del paciente deben almacenarse cifrados en reposo (AES-256), verificado en cada auditoría de seguridad trimestral.

**RNF-03 (Disponibilidad):** El servicio de Citas debe mantener una disponibilidad de 99.5% mensual (máximo ~3.6 horas de caída al mes), monitoreado mediante healthchecks cada 30 segundos y reportado en un dashboard de uptime.

### Priorización MoSCoW

|Requerimiento|Prioridad|Justificación|
|---|---|---|
|HU-02 Agendar cita|**Must**|Es el core del negocio, sin esto no hay sistema.|
|HU-01 Registro de paciente|**Must**|Requisito previo para poder agendar.|
|HU-03 Cancelar/reprogramar|**Must**|Evita choques de horario y libera capacidad.|
|HU-04 Recordatorio automático|**Should**|Reduce inasistencias significativamente, pero el sistema funciona sin él.|
|HU-05 Historial de citas|**Should**|Mejora la atención médica, no bloquea el flujo principal.|
|Notificación multicanal (SMS+Email+WhatsApp)|**Could**|Valor agregado, se puede lanzar solo con un canal inicialmente.|
|Panel de analítica de inasistencias|**Won't (esta fase)**|Valioso a futuro, fuera del alcance del prototipo actual.|