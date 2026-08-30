import { useEffect, useState } from "react";
import { listarPacientes, registrarPaciente, Paciente } from "../api/client";

export default function Pacientes() {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const [form, setForm] = useState({
    nombre: "",
    documento: "",
    telefono: "",
    email: "",
    canalPreferido: "email" as "sms" | "email" | "whatsapp",
  });

  async function cargarPacientes() {
    setCargando(true);
    try {
      const data = await listarPacientes();
      setPacientes(data);
      setError(null);
    } catch {
      setError("No se pudo cargar la lista de pacientes.");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarPacientes();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      await registrarPaciente(form);
      setForm({ nombre: "", documento: "", telefono: "", email: "", canalPreferido: "email" });
      await cargarPacientes();
    } catch (err) {
      const mensaje =
        (err as { response?: { data?: { mensaje?: string } } })?.response?.data?.mensaje ??
        "Error al registrar el paciente.";
      setError(mensaje);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="page">
      <h2>Pacientes</h2>

      <form className="form-card" onSubmit={handleSubmit}>
        <h3>Registrar nuevo paciente (HU-01)</h3>
        <div className="form-grid">
          <input
            placeholder="Nombre completo"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            required
          />
          <input
            placeholder="Documento de identidad"
            value={form.documento}
            onChange={(e) => setForm({ ...form, documento: e.target.value })}
            required
          />
          <input
            placeholder="Teléfono (+51...)"
            value={form.telefono}
            onChange={(e) => setForm({ ...form, telefono: e.target.value })}
            required
          />
          <input
            type="email"
            placeholder="Correo electrónico"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <select
            value={form.canalPreferido}
            onChange={(e) =>
              setForm({ ...form, canalPreferido: e.target.value as "sms" | "email" | "whatsapp" })
            }
          >
            <option value="email">Email</option>
            <option value="sms">SMS</option>
            <option value="whatsapp">WhatsApp</option>
          </select>
        </div>
        <button type="submit" disabled={enviando}>
          {enviando ? "Registrando..." : "Registrar paciente"}
        </button>
      </form>

      {error && <p className="error">{error}</p>}

      <h3>Pacientes registrados</h3>
      {cargando ? (
        <p>Cargando...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Documento</th>
              <th>Teléfono</th>
              <th>Email</th>
              <th>Canal preferido</th>
            </tr>
          </thead>
          <tbody>
            {pacientes.map((p) => (
              <tr key={p.id}>
                <td>{p.nombre}</td>
                <td>{p.documento}</td>
                <td>{p.telefono}</td>
                <td>{p.email}</td>
                <td>{p.canalPreferido}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}