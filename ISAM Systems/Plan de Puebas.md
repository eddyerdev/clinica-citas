
# Plan de Pruebas — Proyecto Integrador SOA Salud

## Estrategia: Pirámide de Pruebas

Se aplica el modelo de la Pirámide de Pruebas, priorizando una base amplia de pruebas unitarias (rápidas y económicas de mantener), una capa intermedia de pruebas de integración, y un vértice reducido de pruebas end-to-end (más lentas y costosas, reservadas para los flujos más críticos del negocio).

```
              /\
             /  \      E2E (pocas)
            /----\     Flujo completo agendar → notificar (Postman/Newman)
           /      \
          /--------\   Integración (moderadas)
         /          \  Endpoints HTTP + Prisma + Postgres real
        /            \
       /--------------\ Unitarias (muchas)
      /                \ Entidades, Value Objects, Casos de Uso
     /------------------\
```

**Proporción objetivo:** ~70% unitarias, ~20% integración, ~10% E2E — proporcional a la velocidad de ejecución y al costo de mantenimiento de cada capa.

---

## 1. Pruebas Unitarias (base de la pirámide)

**Objetivo:** validar la lógica de negocio de forma aislada, sin base de datos, sin red, sin Fastify — ejecutándose en milisegundos.

**Herramienta:** [Vitest](https://vitest.dev/) (v4.x) — se eligió sobre Jest por su integración nativa con el stack TypeScript + ESM del proyecto (mismo motor que usa Vite en el frontend), configuración mínima, y mejor rendimiento en watch mode durante desarrollo.

**Qué se prueba en esta capa (gracias a la arquitectura DDD ya implementada):**

- **Value Objects** (`Email`, `Telefono`, `EstadoCita`): validación de formato, transiciones de estado permitidas/prohibidas.
    - Ejemplo: `EstadoCita.pendiente().transicionarA("atendida")` debe lanzar error (no se puede saltar de pendiente a atendida sin pasar por confirmada).
- **Entidades** (`Cita`, `Paciente`, `Notificacion`): reglas propias de la entidad.
    - Ejemplo: `Cita.crear()` con una fecha pasada debe lanzar error.
    - Ejemplo: `cita.cancelar()` sobre una cita en estado `atendida` debe lanzar `TransicionEstadoInvalidaError`.
- **Casos de Uso** (`AgendarCita`, `CancelarCita`, `RegistrarPaciente`, etc.): orquestación de reglas, usando **repositorios falsos en memoria** (implementaciones simples de las interfaces `PacienteRepository`, `CitaRepository`, etc. que solo usan un array/Map, sin Prisma ni Postgres).
    - Ejemplo clave: `AgendarCita.ejecutar()` con un `CitaRepository` falso que ya tiene una cita en el mismo horario debe lanzar `ConflictoHorarioError` (verifica HU-02 sin tocar la base de datos real).
    - Esto es posible exactamente porque los casos de uso reciben los repositorios por constructor (inyección de dependencias) — se les puede pasar un fake en el test y el real (Prisma) en producción, sin cambiar una línea del caso de uso.

**Cobertura esperada:** ≥80% en las capas `domain` y `application`, medida con `@vitest/coverage-v8`.

---

## 2. Pruebas de Integración (capa intermedia)

**Objetivo:** validar que las piezas reales se conectan correctamente entre sí — sobre todo la traducción entre el dominio y Prisma/Postgres, y el comportamiento real de los endpoints HTTP.

**Herramientas:**

- **Vitest** (mismo runner, para mantener un solo framework en el proyecto).
- **Supertest** — para hacer requests HTTP reales contra la instancia de Fastify sin necesidad de levantar el servidor en un puerto expuesto.
- **Base de datos de prueba:** una instancia separada de Postgres en Docker (mismo `docker-compose`, con un servicio adicional `db_test` o una base de datos distinta dentro del mismo contenedor), para no contaminar los datos de desarrollo/demo.

**Qué se prueba en esta capa:**

- **Repositorios Prisma** (`PrismaCitaRepository`, etc.): que `buscarConflicto()` efectivamente detecte una cita existente en la base de datos real, que `guardar()` persista correctamente, etc.
- **Endpoints HTTP completos**: request → validación Zod → caso de uso → Prisma → respuesta HTTP, verificando código de estado y forma del body.
    - Ejemplo: `POST /citas` con un body inválido debe responder `400` con el detalle de Zod.
    - Ejemplo: `POST /citas` duplicando un horario debe responder `409`.
    - Ejemplo: `DELETE /citas/:id` sobre una cita ya atendida debe responder `400` (no `500`), verificando que el manejador global de errores mapea bien `DomainError`.

**Estrategia de limpieza de datos:** cada test de integración corre dentro de una transacción que se revierte al final (`prisma.$transaction` + rollback), o se limpia la base de datos de prueba entre archivos de test (`beforeEach` con `TRUNCATE`), para que los tests sean independientes entre sí y repetibles.

---

## 3. Pruebas End-to-End / Funcionales (vértice de la pirámide)

**Objetivo:** validar los flujos de negocio más críticos de punta a punta, tal como los viviría un usuario real, incluyendo el frontend y la comunicación entre los 3 contenedores.

**Herramientas:**

- **Colección de Postman** (ya construida como parte del Entregable 3) ejecutada con **Newman** (el runner de línea de comandos de Postman), para poder correrla de forma automatizada/reproducible en vez de manualmente.
- Alternativa considerada: Playwright para pruebas E2E sobre la UI real (React) — se deja como trabajo futuro dado el alcance del prototipo; por ahora el flujo crítico se valida a nivel de API con Postman/Newman, que es lo que exige explícitamente el Entregable 3.

**Flujo crítico cubierto (el más importante del negocio, según HU-02):**

1. Registrar un paciente nuevo.
2. Agendar una cita con un médico en un horario disponible → debe confirmar con `201`.
3. Intentar agendar otra cita con el mismo médico en el mismo horario → debe rechazar con `409` (validación de HU-02 end-to-end, con los 3 servicios reales corriendo en Docker).
4. Enviar un recordatorio de la cita agendada → debe registrar la notificación.
5. Cancelar la cita → debe cambiar su estado y liberar el horario para futuras solicitudes.

Este flujo se ejecuta contra el sistema completo levantado con `docker-compose up`, validando la integración real entre frontend, backend y base de datos — no solo el backend de forma aislada.

---

## Resumen de herramientas por capa

|Capa|Herramienta(s)|Qué valida|Velocidad|
|---|---|---|---|
|Unitarias|Vitest|Dominio y casos de uso, sin I/O|Milisegundos|
|Integración|Vitest + Supertest + Postgres de prueba|Repositorios Prisma + endpoints HTTP reales|Segundos|
|E2E|Postman + Newman|Flujo de negocio completo sobre los 3 contenedores|Decenas de segundos|

## Justificación de la proporción (pirámide, no "helado invertido")

Se evita deliberadamente depender principalmente de pruebas E2E (el error común llamado "cono de helado invertido"), porque son lentas, frágiles ante cambios de UI, y difíciles de depurar cuando fallan. La arquitectura DDD del backend fue diseñada pensando en esto desde el inicio: al aislar el dominio de la infraestructura mediante interfaces de repositorio, la mayor parte de la lógica de negocio (incluida la regla crítica de HU-02) puede validarse con pruebas unitarias rápidas, dejando que las pruebas de integración y E2E confirmen únicamente que las piezas reales encajan entre sí.