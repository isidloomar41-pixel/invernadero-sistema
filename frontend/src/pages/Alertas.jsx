import { useEffect, useState } from "react";

import {
  Alert,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Stack,
  Typography,
} from "@mui/material";

import MainLayout from "../layouts/MainLayout";
import api from "../services/api";
import {
  alertaExito,
  alertaError,
} from "../utils/alertas";

function Alertas({ setPagina }) {
  const [alertas, setAlertas] = useState({
    deudas: [],
    solicitudes: [],
    stockBajo: [],
  });

  async function obtenerAlertas() {
    const respuesta = await api.get("/alertas");
    setAlertas(respuesta.data);
  }

  useEffect(() => {
    obtenerAlertas();
  }, []);

  async function enviarRecordatorio(pedidoId) {
  try {
    await api.post(
      `/alertas/deuda/${pedidoId}/enviar`
    );

    await alertaExito(
      "Recordatorio enviado al correo del cliente"
    );

    obtenerAlertas();
  } catch (error) {
    alertaError(
      error.response?.data?.error ||
      "Error al enviar recordatorio"
    );
  }
}

  return (
    <MainLayout setPagina={setPagina}>
      <Typography variant="h4" fontWeight="bold" mb={4}>
        Alertas del sistema
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Deudas pendientes: {alertas.deudas.length}
          </Alert>

          <Stack spacing={2}>
            {alertas.deudas.map((pedido) => (
              <Card key={pedido.id}>
                <CardContent>
                  <Typography fontWeight="bold">
                    {pedido.cliente}
                  </Typography>

                  <Typography>Pedido #{pedido.id}</Typography>
                  <Typography>Total: ${Number(pedido.total).toFixed(2)}</Typography>
                  <Typography>Pagado: ${Number(pedido.pagado).toFixed(2)}</Typography>
                  <Typography color="error">
                    Debe: ${Number(pedido.restante).toFixed(2)}
                  </Typography>

                  <Button
                    variant="contained"
                    sx={{ mt: 2, backgroundColor: "#6F4E37" }}
                    onClick={() => enviarRecordatorio(pedido.id)}
                  >
                    Enviar correo recordatorio
                  </Button>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </Grid>

        <Grid item xs={12} md={4}>
          <Alert severity="info" sx={{ mb: 2 }}>
            Solicitudes pendientes: {alertas.solicitudes.length}
          </Alert>

          <Stack spacing={2}>
            {alertas.solicitudes.map((solicitud) => (
              <Card key={solicitud.id}>
                <CardContent>
                  <Typography fontWeight="bold">
                    {solicitud.cliente}
                  </Typography>

                  <Typography>Solicitud #{solicitud.id}</Typography>
                  <Typography>Correo: {solicitud.correo}</Typography>

                  <Chip
                    label="Pendiente"
                    color="warning"
                    sx={{ mt: 1 }}
                  />

                  <Button
                    variant="contained"
                    sx={{ mt: 2 }}
                    onClick={() => setPagina("solicitudes")}
                  >
                    Revisar solicitud
                  </Button>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </Grid>

        <Grid item xs={12} md={4}>
          <Alert severity="error" sx={{ mb: 2 }}>
            Productos con stock bajo: {alertas.stockBajo.length}
          </Alert>

          <Stack spacing={2}>
            {alertas.stockBajo.map((producto) => (
              <Card key={producto.id}>
                <CardContent>
                  <Typography fontWeight="bold">
                    {producto.nombre}
                  </Typography>

                  <Typography>Stock actual: {producto.stock}</Typography>
                  <Typography>Stock mínimo: {producto.stock_minimo}</Typography>

                  <Button
                    variant="contained"
                    sx={{ mt: 2 }}
                    onClick={() => setPagina("inventario")}
                  >
                    Ver inventario
                  </Button>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </Grid>
      </Grid>
    </MainLayout>
  );
}

export default Alertas;