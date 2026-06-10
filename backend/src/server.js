import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// JOBS
import "./jobs/backupDiario.js";
import { iniciarRecordatoriosAutomaticos } from "./jobs/recordatorios.js";

// CONFIG
import { pool } from "./config/db.js";

// ROUTES
import authRoutes from "./routes/auth.routes.js";
import usuariosRoutes from "./routes/usuarios.routes.js";
import productosRoutes from "./routes/productos.routes.js";
import clientesRoutes from "./routes/clientes.routes.js";
import pedidosRoutes from "./routes/pedidos.routes.js";
import notasRoutes from "./routes/notas.routes.js";
import perdidasRoutes from "./routes/perdidas.routes.js";
import reportesRoutes from "./routes/reportes.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import solicitudesRoutes from "./routes/solicitudes.routes.js";
import alertasRoutes from "./routes/alertas.routes.js";
import backupRoutes from "./routes/backups.routes.js";

// MIDDLEWARES
app.use(cors());
app.use(express.json());

// ROUTES
app.use("/auth", authRoutes);
app.use("/usuarios", usuariosRoutes);
app.use("/productos", productosRoutes);
app.use("/clientes", clientesRoutes);
app.use("/pedidos", pedidosRoutes);
app.use("/notas", notasRoutes);
app.use("/perdidas", perdidasRoutes);
app.use("/reportes", reportesRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/solicitudes", solicitudesRoutes);
app.use("/alertas", alertasRoutes);
app.use("/backups", backupRoutes);

// RUTA PRINCIPAL
app.get("/", (req, res) => {
  res.json({
    mensaje: "Servidor funcionando correctamente",
  });
});

// TEST POSTGRESQL
app.get("/test-db", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT NOW() AS fecha"
    );

    res.json({
      mensaje: "Conexión PostgreSQL correcta",
      fecha: result.rows[0].fecha,
    });
  } catch (error) {
    res.status(500).json({
      mensaje: "Error PostgreSQL",
      error: error.message,
    });
  }
});

// INICIAR RECORDATORIOS
iniciarRecordatoriosAutomaticos();

// SERVIDOR
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(
    `🚀 Servidor corriendo en http://localhost:${PORT}`
  );
});