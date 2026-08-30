import { useEffect, useState } from "react";
import {
  listarPacientes,
  listarCitasPorPaciente,
  listarNotificacionesPorCita,
  procesarNotificacionesPendientes,
  Paciente,
  Cita,
  Notificacion,
} from "../api/client";

const CANAL_LABEL: Record<string, string> = {
  email: "correo electrónico",
  sms: "SMS",
  whatsapp: "WhatsApp",
};

const ESTADO_LABEL: Record<string, string> = {
  enviada: "✅ Enviada",
  pendiente: "🕓 Pendiente",
  fallida: "❌ Fallida (reintentando)",
};

export default function Notificaciones() {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState("");
  const [citas, setCitas] = useState<Cita[]>([]);
  const [citaSeleccionada, setCitaSeleccionada] = useState("");
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [procesando, setProcesando] = useState(false);
  const [resultadoProceso, setResultadoProceso] = useState<string | null>(null);

  useEffect(() => {
    listarPacientes().then(setPacientes);
  }, []);

  useEffect(() => {
    if (!pacienteSeleccionado) {
      setCitas([]);
      return;
    }
    listarCitasPorPaciente(pacienteSeleccionado).then(setCitas);
  }, [pacienteSeleccionado]);

  async function cargarNotificaciones(citaId: string) {
    if (!citaId) {
      setNotificaciones([]);
      return;
    }
    const data = await listarNotificacionesPorCita(citaId);
    setNotificaciones(data);
  }

  useEffect(() => {
    cargarNotificaciones(citaSeleccionada);
  }, [citaSeleccionada]);

  async function handleProcesarPendientes() {
    setProcesando(true);
    setResultadoProceso(null);
    try {
      const resultado = await procesarNotificacionesPendientes();
      setResultadoProceso(
        `Se procesaron ${resultado.procesadas} notificación(es): ${resultado.exitosas} enviada(s), ${resultado.fallidas} fallida(s) (reintentando automáticamente).`
      );
      await cargarNotificaciones(citaSeleccionada);
    } finally {
      setProcesando(false);
    }
  }

  const paciente = pacientes.find((p) => p.id === pacienteSeleccionado);

  return (
    <div className="page">
      <h2>Notificaciones (HU-04)</h2>
      <p style={{ color: "#555" }}>
        Simulación del envío de recordatorios y del mecanismo de reintentos ante fallos
        (diseño para el fallo, Entregable 2).
      </p>

      <div className="form-card">
        <h3>Ver notificaciones de una cita</h3>
        <div className="form-grid">
          <select
            value={pacienteSeleccionado}
            onChange={(e) => {
              setPacienteSeleccionado(e.target.value);
              setCitaSeleccionada("");
            }}
          >
            <option value="">Seleccionar paciente</option>
            {pacientes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>

          <select value={citaSeleccionada} onChange={(e) => setCitaSeleccionada(e.target.value)}>
            <option value="">Seleccionar cita</option>
            {citas.map((c) => (
              <option key={c.id} value={c.id}>
                {new Date(c.fechaHora).toLocaleString("es-PE")} — {c.estado}
              </option>
            ))}
          </select>
        </div>

        <button onClick={handleProcesarPendientes} disabled={procesando}>
          {procesando ? "Procesando..." : "Reintentar notificaciones pendientes/fallidas"}
        </button>

        {resultadoProceso && <p className="success" style={{ marginTop: "0.75rem" }}>{resultadoProceso}</p>}
      </div>

      {citaSeleccionada && (
        <>
          <h3>Historial de notificaciones</h3>
          {notificaciones.length === 0 ? (
            <p>Aún no se ha enviado ninguna notificación para esta cita.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {notificaciones.map((n) => (
                <div key={n.id} className="form-card" style={{ margin: 0 }}>
                  <p style={{ margin: 0 }}>
                    {n.estado === "enviada"
                      ? `Se envió una notificación a ${paciente?.nombre ?? "el paciente"} vía ${CANAL_LABEL[n.canal]}.`
                      : `Se intentó notificar a ${paciente?.nombre ?? "el paciente"} vía ${CANAL_LABEL[n.canal]}.`}
                  </p>
                  <p style={{ margin: "0.4rem 0 0 0", fontSize: "0.85rem", color: "#555" }}>
                    Estado: <strong>{ESTADO_LABEL[n.estado]}</strong> · Intentos: {n.intentos}
                  </p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}