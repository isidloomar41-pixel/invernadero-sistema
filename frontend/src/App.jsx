import { useState } from "react";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Clientes from "./pages/Clientes";
import Productos from "./pages/Productos";
import Pedidos from "./pages/Pedidos";
import Notas from "./pages/Notas";
import Inventario from "./pages/Inventario";
import Perdidas from "./pages/Perdidas";
import Reportes from "./pages/Reportes";
import Usuarios from "./pages/Usuarios";
import Catalogo from "./pages/Catalogo";
import Solicitudes from "./pages/Solicitudes";
import Alertas from "./pages/Alertas";
import Respaldos from "./pages/Respaldos";

function App() {
  const token = localStorage.getItem("token");
  const usuarioGuardado = localStorage.getItem("usuario");

  const [pagina, setPagina] = useState("dashboard");

  if (!token || !usuarioGuardado) {
    return <Login />;
  }

  function renderPagina() {
    switch (pagina) {
      case "dashboard":
        return <Dashboard setPagina={setPagina} />;

      case "clientes":
        return <Clientes setPagina={setPagina} />;

      case "productos":
        return <Productos setPagina={setPagina} />;

      case "pedidos":
        return <Pedidos setPagina={setPagina} />;

      case "notas":
        return <Notas setPagina={setPagina} />;

      case "inventario":
        return <Inventario setPagina={setPagina} />;

      case "perdidas":
        return <Perdidas setPagina={setPagina} />;

      case "reportes":
        return <Reportes setPagina={setPagina} />;

      case "usuarios":
        return <Usuarios setPagina={setPagina} />;

      case "catalogo":
        return <Catalogo setPagina={setPagina} />;

      case "solicitudes":
        return <Solicitudes setPagina={setPagina} />;

      case "alertas":
        return <Alertas setPagina={setPagina} />;

      case "respaldos":
        return <Respaldos setPagina={setPagina} />;

      default:
        return <Dashboard setPagina={setPagina} />;
    }
  }

  return renderPagina();
}

export default App;