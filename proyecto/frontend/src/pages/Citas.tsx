import { useEffect, useState } from "react";
import {
  listarPacientes,
  listarMedicos,
  agendarCita,
  cancelarCita,
  enviarRecordatorio,
  reprogramarCita,
  listarCitasPorPaciente,
  Paciente,
  Medico,
  Cita,
} from "../api/client";


export default function Citas() {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const [citaAReprogramar, setCitaAReprogramar] = useState<string | null>(null);
  const [nuevaFecha, setNuevaFecha] = useState("");

  const [form, setForm] = useState({
    pacienteId: "",
    medicoId: "",
    fechaHora: "",
    motivo: "",
  });

  useEffect(() => {
    listarPacientes().then(setPacientes).catch(() => setError("No se pudo cargar pacientes."));
    listarMedicos().then(setMedicos).catch(() => setError("No se pudo cargar médicos."));
  }, []);

  async function cargarCitasDe(pacienteId: string) {
    if (!pacienteId) {
      setCitas([]);
      return;
    }
    const data = await listarCitasPorPaciente(pacienteId);
    setCitas(data);
  }

  useEffect(() => {
    cargarCitasDe(pacienteSeleccionado);
  }, [pacienteSeleccionado]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    setMensaje(null);
    try {
      await agendarCita({
        ...form,
        fechaHora: new Date(form.fechaHora).toISOString(),
      });
      setMensaje("Cita agendada correctamente.");
      setForm({ pacienteId: "", medicoId: "", fechaHora: "", motivo: "" });
      if (form.pacienteId === pacienteSeleccionado) {
        await cargarCitasDe(pacienteSeleccionado);
      }
    } catch (err) {
      const mensajeError =
        (err as { response?: { data?: { mensaje?: string } } })?.response?.data?.mensaje ??
        "Error al agendar la cita.";
      setError(mensajeError);
    } finally {
      setEnviando(false);
    }
  }

  async function handleCancelar(citaId: string) {
    setError(null);
    try {
      await cancelarCita(citaId);
      setMensaje("Cita cancelada.");
      await cargarCitasDe(pacienteSeleccionado);
    } catch {
      setError("No se pudo cancelar la cita.");
    }
  }

  async function handleRecordatorio(citaId: string) {
    setError(null);
    try {
      await enviarRecordatorio(citaId);
      setMensaje("Recordatorio enviado (simulado).");
    } catch {
      setError("No se pudo enviar el recordatorio.");
    }
  }

    async function handleConfirmarReprogramar(citaId: string) {
    if (!nuevaFecha) return;
    setError(null);
    try {
      await reprogramarCita(citaId, new Date(nuevaFecha).toISOString());
      setMensaje("Cita reprogramada correctamente.");
      setCitaAReprogramar(null);
      setNuevaFecha("");
      await cargarCitasDe(pacienteSeleccionado);
    } catch (err) {
      const mensajeError =
        (err as { response?: { data?: { mensaje?: string } } })?.response?.data?.mensaje ??
        "No se pudo reprogramar la cita.";
      setError(mensajeError);
    }
  }

  return (
    <div className="page">
      <h2>Citas</h2>

      <form className="form-card" onSubmit={handleSubmit}>
        <h3>Agendar nueva cita (HU-02)</h3>
        <div className="form-grid">
          <select
            value={form.pacienteId}
            onChange={(e) => setForm({ ...form, pacienteId: e.target.value })}
            required
          >
            <option value="">Seleccionar paciente</option>
            {pacientes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>

          <select
            value={form.medicoId}
            onChange={(e) => setForm({ ...form, medicoId: e.target.value })}
            required
          >
            <option value="">Seleccionar médico</option>
            {medicos.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nombre} ({m.especialidad})
              </option>
            ))}
          </select>

          <input
            type="datetime-local"
            value={form.fechaHora}
            onChange={(e) => setForm({ ...form, fechaHora: e.target.value })}
            required
          />

          <input
            placeholder="Motivo de la consulta"
            value={form.motivo}
            onChange={(e) => setForm({ ...form, motivo: e.target.value })}
          />
        </div>
        <button type="submit" disabled={enviando}>
          {enviando ? "Agendando..." : "Agendar cita"}
        </button>
      </form>

      {error && <p className="error">{error}</p>}
      {mensaje && <p className="success">{mensaje}</p>}

      <h3>Ver citas de un paciente</h3>
      <select
        value={pacienteSeleccionado}
        onChange={(e) => setPacienteSeleccionado(e.target.value)}
      >
        <option value="">Seleccionar paciente</option>
        {pacientes.map((p) => (
          <option key={p.id} value={p.id}>
            {p.nombre}
          </option>
        ))}
      </select>

      <table>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Estado</th>
            <th>Motivo</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {citas.map((c) => (
            <tr key={c.id}>
              <td>{new Date(c.fechaHora).toLocaleString("es-PE")}</td>
              <td>{c.estado}</td>
              <td>{c.motivo ?? "-"}</td>
                            <td>
                {citaAReprogramar === c.id ? (
                  <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                    <input
                      type="datetime-local"
                      value={nuevaFecha}
                      onChange={(e) => setNuevaFecha(e.target.value)}
                    />
                    <button onClick={() => handleConfirmarReprogramar(c.id)}>Confirmar</button>
                    <button onClick={() => setCitaAReprogramar(null)}>Cancelar</button>
                  </div>
                ) : (
                  <>
                    {c.estado !== "cancelada" && c.estado !== "atendida" && (
                      <>
                        <button onClick={() => handleCancelar(c.id)}>Cancelar</button>
                        <button onClick={() => setCitaAReprogramar(c.id)}>Reprogramar</button>
                      </>
                    )}
                    <button onClick={() => handleRecordatorio(c.id)}>Enviar recordatorio</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}