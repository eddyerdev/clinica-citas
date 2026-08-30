# Entregable 4: Sustentación Visual — Contenido para Diapositivas

> Este documento contiene el contenido listo para pasar a PowerPoint/Google Slides, dividido en dos presentaciones según la audiencia pedida: **Gerencia Clínica** (enfoque de negocio) y **Equipo Técnico** (enfoque de arquitectura). Cada bloque representa una diapositiva: título + contenido + nota de guion (lo que dirías al presentarla).

---

# PARTE 1: Presentación para Gerencia Clínica

**Enfoque:** el problema, los beneficios del desacoplamiento, y el valor de negocio. Sin jerga técnica.

## Diapositiva 1 — Portada

**Título:** Modernización del Sistema de Citas Médicas **Subtítulo:** Una solución basada en servicios para la Red de Clínicas **Nota de guion:** Presentación de la propuesta de arquitectura de servicios que resuelve los problemas actuales de agendamiento e inasistencia de pacientes.

## Diapositiva 2 — El Problema Actual

**Contenido:**

- 30% de inasistencias se deben a que el paciente olvida su cita (sin recordatorio automático).
- El registro de pacientes está duplicado entre clínicas de la red, generando historiales fragmentados.
- El personal de admisión pierde tiempo confirmando citas manualmente por teléfono.
- Agendamiento telefónico calificado como "regular" por los propios pacientes (encuesta interna).

**Nota de guion:** Estos datos salen de las entrevistas al personal médico y la encuesta a pacientes que hicimos como parte del levantamiento de requerimientos.

## Diapositiva 3 — Impacto de estos problemas en el negocio

**Contenido:**

- Inasistencias = tiempo médico desperdiciado = menor capacidad de atención diaria.
- Historiales fragmentados = riesgo clínico y experiencia de paciente deficiente.
- Tiempo del personal de admisión en tareas manuales = costo operativo evitable.

**Nota de guion:** Aquí se traduce el problema técnico a impacto económico y de calidad de atención, que es lo que le importa a gerencia.

## Diapositiva 4 — La Solución Propuesta

**Contenido:**

- Sistema de agendamiento digital con validación automática de disponibilidad.
- Recordatorios automáticos por el canal que el paciente prefiere (SMS, email, WhatsApp).
- Historial de citas centralizado, accesible para el personal médico al instante.
- Arquitectura dividida en 3 servicios independientes: Pacientes, Citas, Notificaciones.

**Nota de guion:** No es un sistema monolítico rígido — está diseñado en piezas independientes que se pueden mejorar o escalar por separado sin detener todo el sistema.

## Diapositiva 5 — ¿Por qué servicios independientes? (explicado sin jerga)

**Contenido:**

- Cada parte del sistema (Pacientes, Citas, Notificaciones) funciona de forma autónoma.
- Si el servicio de notificaciones tuviera un problema (ej. el proveedor de SMS está caído), **el agendamiento de citas sigue funcionando con normalidad**.
- Se pueden hacer mejoras a un servicio (por ejemplo, agregar un nuevo canal de notificación) sin arriesgar romper el resto del sistema.

**Nota de guion:** Este es el argumento de negocio clave del "bajo acoplamiento": resiliencia operativa. Un fallo en una parte no tumba todo el sistema.

## Diapositiva 6 — Beneficios esperados

**Contenido:**

- Reducción esperada de inasistencias gracias a recordatorios automáticos.
- Menor carga operativa para el personal de admisión.
- Datos de pacientes unificados en toda la red de clínicas.
- Sistema preparado para crecer (agregar más clínicas, más canales, más funcionalidades) sin rediseñar todo desde cero.

## Diapositiva 7 — Estado actual del proyecto

**Contenido:**

- Prototipo funcional construido y probado: registro de pacientes, agendamiento, cancelación/reprogramación, recordatorios, historial.
- Documentación completa de requerimientos y diseño técnico.
- Plan de pruebas definido para garantizar calidad antes de un despliegue real.

**Nota de guion:** Se cierra mostrando que esto no es solo una propuesta en papel — ya existe un prototipo funcionando que demuestra la viabilidad técnica.

## Diapositiva 8 — Próximos pasos sugeridos

**Contenido:**

- Piloto en una clínica de la red antes de desplegar a toda la cadena.
- Integración con un proveedor real de SMS/WhatsApp para notificaciones (actualmente simulado en el prototipo).
- Capacitación del personal de admisión en la nueva herramienta.

---

# PARTE 2: Presentación para Equipo Técnico

**Enfoque:** diagramas de arquitectura, diseño de API, y decisiones tecnológicas (trade-offs).

## Diapositiva 1 — Portada

**Título:** Arquitectura Orientada a Servicios — Sistema de Citas Médicas **Subtítulo:** Diseño técnico, decisiones de arquitectura y prototipo

## Diapositiva 2 — Ecosistema de Servicios

**Contenido:**

- **Pacientes**: identidad, contacto, historial básico. Autónomo — no depende de citas ni notificaciones.
- **Citas**: agendamiento, disponibilidad, transiciones de estado. Dominio con lógica de negocio propia.
- **Notificaciones**: envío de recordatorios, reintentos, múltiples canales. Servicio de soporte transversal.
- Comunicación entre servicios vía API REST / eventos, sin base de datos compartida (Database per Service).

## Diapositiva 3 — Diseño Orientado al Dominio (DDD)

**Contenido:**

- Cada servicio = un Bounded Context con lenguaje ubicuo propio.
- Backend estructurado en 4 capas: `domain` → `application` → `infrastructure` → `interfaces`.
- El dominio (entidades, value objects, reglas de negocio) no depende de Prisma ni de Fastify — se puede testear en aislamiento.
- Ejemplo: la regla "no se puede cancelar una cita atendida" vive en la entidad `Cita`, no en un controller.

**Nota de guion:** Aquí mostrar el diagrama de carpetas del backend como apoyo visual.

## Diapositiva 4 — Diseño para el Fallo

**Contenido:**

- Reintentos con límite (máx. 3 intentos) en el envío de notificaciones.
- Timeouts y manejo explícito de errores de dominio (`DomainError` → código HTTP correcto).
- Healthcheck (`GET /health`) verificando conexión real a base de datos.
- Restricción a nivel de base de datos (`@@unique([medicoId, fechaHora])`) como última línea de defensa contra choques de horario, además de la validación en el caso de uso.

## Diapositiva 5 — Diagrama de Casos de Uso

**(Insertar aquí la imagen exportada del diagrama Mermaid del Entregable 2: actores Paciente, Médico, Sistema)**

## Diapositiva 6 — Diagrama de Flujo: Validación de Citas

**(Insertar aquí la imagen exportada del flowchart del Entregable 2: solicitud → validar disponibilidad → confirmar → notificar)**

## Diapositiva 7 — Diseño de API (Contract-First)

**Contenido:**

- Se definió el contrato OpenAPI del servicio de Citas **antes** de escribir código.
- Endpoints: `POST /citas`, `GET /citas`, `GET/PATCH/DELETE /citas/{id}`, `GET /citas/disponibilidad`.
- Códigos de respuesta explícitos: `201` creación, `409` conflicto de horario, `404` no encontrado, `400` validación.
- El código del backend implementa exactamente este contrato — verificado con la colección de Postman.

## Diapositiva 8 — Stack Tecnológico y Decisiones (Trade-offs)

**Contenido:**

|Decisión|Elegido|Alternativa considerada|Por qué|
|---|---|---|---|
|Backend|Node.js + Fastify|Express|Mejor rendimiento, validación nativa con schemas|
|ORM|Prisma 6.x (estable)|Prisma 7.x (última)|v7 exige adaptadores de driver y config nueva; sin beneficio para el alcance del prototipo|
|Base de datos|PostgreSQL|MongoDB|Relaciones claras entre Paciente-Cita-Médico; integridad referencial|
|Contenedores|3 servicios independientes (docker-compose)|Todo en un solo contenedor|Aislamiento real, se acerca más a una arquitectura de microservicios genuina|
|Frontend|React + Vite|Next.js|No se necesita SSR para este alcance; Vite es más simple y rápido|

## Diapositiva 9 — Demo / Prototipo

**Contenido:**

- Flujo en vivo: registrar paciente → agendar cita → intentar choque de horario (rechazo 409) → enviar recordatorio → ver notificación.
- Mostrar los 3 contenedores corriendo de forma independiente (`docker ps`).
- Mostrar la colección de Postman como mock funcional de la API.

## Diapositiva 10 — Estrategia de Pruebas

**Contenido:**

- Pirámide de pruebas: unitarias (Vitest, dominio y casos de uso con repositorios fake) → integración (Vitest + Supertest + Postgres real) → E2E (Postman + Newman).
- La arquitectura DDD permite testear la regla de choque de horarios (HU-02) sin tocar base de datos real.

## Diapositiva 11 — Limitaciones y Trabajo Futuro

**Contenido:**

- Envío de notificaciones simulado (mock) — pendiente integrar proveedor real (Twilio/SendGrid).
- Recordatorios disparados manualmente vía endpoint — pendiente automatizar con scheduler/cron.
- Sin autenticación/autorización implementada — fuera del alcance definido para este prototipo académico.