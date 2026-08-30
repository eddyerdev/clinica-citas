# ENTREGABLE 2: Modelado y Diseño de la Solución

## 2.1 Principios de Diseño

### Diseño Orientado al Dominio (DDD)

Cada servicio representa un **Bounded Context** con su propio lenguaje ubicuo:

- **Pacientes**: conceptos como "Paciente", "Historial", "Documento de identidad".
- **Citas**: conceptos como "Cita", "Disponibilidad", "Médico", "Horario".
- **Notificaciones**: conceptos como "Recordatorio", "Canal", "Plantilla".

No se comparte un modelo de datos único entre servicios (evita el "modelo anémico compartido"). Cada servicio tiene su propia base de datos (Database per Service) y expone únicamente lo necesario vía API/eventos. Por ejemplo, Citas no necesita saber la dirección del paciente, solo su ID y canal de contacto preferido — este último lo desnormaliza o lo pide a Pacientes cuando lo necesita, evitando acoplar sus modelos internos.

### Diseño para el Fallo

- **Circuit Breaker:** si el servicio de Notificaciones falla repetidamente, Citas deja de intentar llamarlo directamente y encola el evento para reintento posterior, evitando que una caída de Notificaciones bloquee el agendamiento.
- **Retries con backoff exponencial:** en el envío de notificaciones, ante fallos temporales (proveedor SMS caído), se reintenta con espera creciente (1s, 2s, 4s) hasta un máximo de intentos.
- **Timeouts:** toda llamada entre servicios tiene un timeout definido (ej. 3s) para no dejar solicitudes colgadas indefinidamente.
- **Idempotencia:** las operaciones críticas (confirmar cita, enviar notificación) usan un identificador único de operación para evitar duplicados si se reintenta una solicitud.
- **Healthchecks:** cada servicio expone un endpoint `/health` que reporta su estado y el de sus dependencias (ej. conexión a base de datos).

## 2.2 Diagramación Visual (descripción textual / Mermaid)

> Nota: estos bloques usan sintaxis Mermaid. Se pueden pegar en cualquier editor compatible (VS Code, GitHub, Typora, mermaid.live) para exportarlos como imagen y pegarlos en el PDF final.

### Diagrama de Casos de Uso





Diagrama de Flujo: Validación de Citas (proceso crítico)


### 2.3 Diseño de API (Contract-First) — Servicio de Citas

``` yaml
openapi: 3.0.3
info:
  title: Servicio de Citas
  description: API para la gestión de agendamiento, cancelación y consulta de citas médicas.
  version: 1.0.0
servers:
  - url: https://api.clinica.com/citas/v1

paths:
  /citas:
    post:
      summary: Agendar una nueva cita
      operationId: crearCita
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/NuevaCita'
      responses:
        '201':
          description: Cita creada exitosamente
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Cita'
        '409':
          description: Conflicto - horario no disponible
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
        '400':
          description: Solicitud inválida

    get:
      summary: Listar citas (con filtros)
      operationId: listarCitas
      parameters:
        - name: pacienteId
          in: query
          schema:
            type: string
          required: false
        - name: medicoId
          in: query
          schema:
            type: string
          required: false
        - name: estado
          in: query
          schema:
            type: string
            enum: [pendiente, confirmada, cancelada, atendida]
          required: false
      responses:
        '200':
          description: Lista de citas
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Cita'

  /citas/{id}:
    get:
      summary: Obtener detalle de una cita
      operationId: obtenerCita
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Detalle de la cita
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Cita'
        '404':
          description: Cita no encontrada

    patch:
      summary: Reprogramar una cita existente
      operationId: reprogramarCita
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                nuevaFechaHora:
                  type: string
                  format: date-time
      responses:
        '200':
          description: Cita reprogramada
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Cita'
        '409':
          description: Nuevo horario no disponible

    delete:
      summary: Cancelar una cita
      operationId: cancelarCita
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        '204':
          description: Cita cancelada exitosamente
        '404':
          description: Cita no encontrada
        '400':
          description: No se puede cancelar una cita ya atendida

  /citas/disponibilidad:
    get:
      summary: Consultar horarios disponibles de un médico
      operationId: consultarDisponibilidad
      parameters:
        - name: medicoId
          in: query
          required: true
          schema:
            type: string
        - name: fecha
          in: query
          required: true
          schema:
            type: string
            format: date
      responses:
        '200':
          description: Horarios disponibles
          content:
            application/json:
              schema:
                type: array
                items:
                  type: string
                  format: date-time

components:
  schemas:
    NuevaCita:
      type: object
      required: [pacienteId, medicoId, fechaHora]
      properties:
        pacienteId:
          type: string
        medicoId:
          type: string
        fechaHora:
          type: string
          format: date-time
        motivo:
          type: string

    Cita:
      type: object
      properties:
        id:
          type: string
        pacienteId:
          type: string
        medicoId:
          type: string
        fechaHora:
          type: string
          format: date-time
        estado:
          type: string
          enum: [pendiente, confirmada, cancelada, atendida]
        motivo:
          type: string
        creadaEn:
          type: string
          format: date-time

    Error:
      type: object
      properties:
        codigo:
          type: string
        mensaje:
          type: string
```

