import { useState } from "react";
import Pacientes from "./pages/Pacientes";
import Citas from "./pages/Citas";
import Notificaciones from "./pages/Notificaciones";

type Tab = "pacientes" | "citas" | "notificaciones";

function App() {
  const [tab, setTab] = useState<Tab>("pacientes");

  return (
    <div className="app">
      <header className="header">
        <h1>Clínica Red de Salud — Gestión de Citas</h1>
        <nav>
          <button className={tab === "pacientes" ? "active" : ""} onClick={() => setTab("pacientes")}>
            Pacientes
          </button>
          <button className={tab === "citas" ? "active" : ""} onClick={() => setTab("citas")}>
            Citas
          </button>
          <button
            className={tab === "notificaciones" ? "active" : ""}
            onClick={() => setTab("notificaciones")}
          >
            Notificaciones
          </button>
        </nav>
      </header>

      <main>
        {tab === "pacientes" && <Pacientes />}
        {tab === "citas" && <Citas />}
        {tab === "notificaciones" && <Notificaciones />}
      </main>
    </div>
  );
}

export default App;