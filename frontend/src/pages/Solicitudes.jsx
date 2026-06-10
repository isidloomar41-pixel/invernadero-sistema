import { useEffect, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import MainLayout from "../layouts/MainLayout";
import api from "../services/api";
import {
  alertaExito,
  alertaError,
  confirmarEliminacion,
} from "../utils/alertas";
function Solicitudes({ setPagina }) {
  const [solicitudes, setSolicitudes] = useState([]);
  const [detalle, setDetalle] = useState([]);
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);
  const [open, setOpen] = useState(false);

  const [medioPago, setMedioPago] = useState("efectivo");
  const [tipoPago, setTipoPago] = useState("completo");
  const [pagado, setPagado] = useState("");

  async function obtenerSolicitudes() {
    try {
      const respuesta = await api.get("/solicitudes");
      setSolicitudes(respuesta.data);
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    obtenerSolicitudes();
  }, []);

  async function verDetalle(solicitud) {
    try {
      const respuesta = await api.get(`/solicitudes/${solicitud.id}`);

      setDetalle(respuesta.data);
      setSolicitudSeleccionada(solicitud);
      setMedioPago("efectivo");
      setTipoPago("completo");
      setPagado("");
      setOpen(true);
    } catch (error) {
      console.error(error);
    }
  }

  async function rechazarSolicitud(id) {
  const confirmar =
    await confirmarEliminacion(
      "¿Deseas rechazar esta solicitud?"
    );

  if (!confirmar) return;

  try {
    await api.put(
      `/solicitudes/${id}/rechazar`
    );

    await alertaExito(
      "Solicitud rechazada correctamente"
    );

    obtenerSolicitudes();
  } catch (error) {
    alertaError(
      error.response?.data?.error ||
        "Error al rechazar solicitud"
    );
  }
}

async function autorizarSolicitud() {
  const confirmar =
    await confirmarEliminacion(
      "¿Deseas autorizar esta solicitud?"
    );

  if (!confirmar) return;

  try {
    if (!solicitudSeleccionada) return;

    await api.put(
      `/solicitudes/${solicitudSeleccionada.id}/autorizar`,
      {
        medio_pago: medioPago,
        tipo_pago: tipoPago,
        pagado:
          Number(pagado) || 0,
      }
    );

    await alertaExito(
      "Solicitud autorizada. Se generó el pedido y la nota."
    );

    setOpen(false);
    setDetalle([]);
    setSolicitudSeleccionada(
      null
    );

    obtenerSolicitudes();
   } catch (error) {
    alertaError(
      error.response?.data?.error ||
        "Error al autorizar solicitud"
    );
  }
}

function colorEstado(estado) {
    if (estado === "pendiente") return "warning";
    if (estado === "autorizado") return "success";
    if (estado === "rechazado") return "error";

    return "default";
  }

  const total = detalle.reduce((suma, item) => {
    const precioNormal = Number(item.precio) * Number(item.cantidad);
    const descuento = Number(item.cantidad) >= 30 ? precioNormal * 0.1 : 0;
    return suma + (precioNormal - descuento);
  }, 0);

  const restante = Math.max(total - (Number(pagado) || 0), 0);

  return (
    <MainLayout setPagina={setPagina}>
      <Typography variant="h4" mb={4} fontWeight="bold">
        Solicitudes pendientes
      </Typography>

      <Grid container spacing={3}>
        {solicitudes.map((solicitud) => (
          <Grid item xs={12} md={6} key={solicitud.id}>
            <Card sx={{ borderRadius: 4 }}>
              <CardContent>
                <Stack spacing={1}>
                  <Typography variant="h6" fontWeight="bold">
                    {solicitud.cliente}
                  </Typography>

                  <Typography>Correo: {solicitud.correo}</Typography>
                  <Typography>Teléfono: {solicitud.telefono}</Typography>
                  <Typography>Dirección: {solicitud.direccion}</Typography>
                  <Typography>
                    Fecha: {new Date(solicitud.fecha).toLocaleString()}
                  </Typography>

                  <Box>
                    <Chip
                      label={solicitud.estado}
                      color={colorEstado(solicitud.estado)}
                    />
                  </Box>

                  {solicitud.observaciones && (
                    <Typography>
                      Observaciones:
                      <br />
                      {solicitud.observaciones}
                    </Typography>
                  )}

                  <Stack direction="row" spacing={2}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => verDetalle(solicitud)}
                    >
                      VER PRODUCTOS
                    </Button>

                    {solicitud.estado === "pendiente" && (
                      <Button
                        variant="contained"
                        color="error"
                        onClick={() => rechazarSolicitud(solicitud.id)}
                      >
                        RECHAZAR
                      </Button>
                    )}
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Autorizar solicitud</DialogTitle>

        <DialogContent>
          <Stack spacing={2}>
            {solicitudSeleccionada && (
              <Alert severity="info">
                Cliente: {solicitudSeleccionada.cliente}
              </Alert>
            )}

            {detalle.map((item) => (
              <Card key={item.id}>
                <CardContent>
                  <Typography variant="h6">{item.nombre}</Typography>
                  <Typography>Cantidad solicitada: {item.cantidad}</Typography>
                  <Typography>Precio actual: ${item.precio}</Typography>
                  <Typography>Stock actual: {item.stock}</Typography>
                  <Typography>
                    Subtotal: $
                    {(
                      Number(item.precio) * Number(item.cantidad)
                    ).toFixed(2)}
                  </Typography>
                </CardContent>
              </Card>
            ))}

            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Medio de pago</InputLabel>
                  <Select
                    value={medioPago}
                    label="Medio de pago"
                    onChange={(e) => setMedioPago(e.target.value)}
                  >
                    <MenuItem value="efectivo">Efectivo</MenuItem>
                    <MenuItem value="transferencia">Transferencia</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Tipo de pago</InputLabel>
                  <Select
                    value={tipoPago}
                    label="Tipo de pago"
                    onChange={(e) => setTipoPago(e.target.value)}
                  >
                    <MenuItem value="completo">Completo</MenuItem>
                    <MenuItem value="apartado">Apartado</MenuItem>
                    <MenuItem value="fiado">Fiado</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Cantidad pagada"
                  value={pagado}
                  onChange={(e) => setPagado(e.target.value)}
                />
              </Grid>
            </Grid>

            <Alert severity={restante > 0 ? "warning" : "success"}>
              Total: ${total.toFixed(2)} | Pagado: $
              {(Number(pagado) || 0).toFixed(2)} | Restante: $
              {restante.toFixed(2)}
            </Alert>

            {solicitudSeleccionada?.estado === "pendiente" && (
              <Button
                variant="contained"
                sx={{ backgroundColor: "#1B5E20" }}
                onClick={autorizarSolicitud}
              >
                AUTORIZAR Y GENERAR NOTA
              </Button>
            )}
          </Stack>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );

}

export default Solicitudes;