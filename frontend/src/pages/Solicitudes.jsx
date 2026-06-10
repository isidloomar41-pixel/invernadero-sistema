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
  Grid,
  Stack,
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
   async function autorizarSolicitud(id) {
  const confirmar =
    await confirmarEliminacion(
      "¿Deseas aceptar esta solicitud?"
    );

  if (!confirmar) return;

  try {
    await api.put(
      `/solicitudes/${id}/autorizar`,
      {}
    );

    await alertaExito(
      "Solicitud aceptada correctamente"
    );

    obtenerSolicitudes();
  } catch (error) {
    console.log(error);

    alertaError(
      error.response?.data?.error ||
      error.response?.data?.mensaje ||
      "Error al aceptar solicitud"
    );
  }
}

function colorEstado(estado) {
    if (estado === "pendiente") return "warning";
    if (estado === "autorizado") return "success";
    if (estado === "rechazado") return "error";

    return "default";
  }

 

  return (
    <MainLayout setPagina={setPagina}>
      <Typography variant="h4" mb={4} fontWeight="bold">
        Solicitudes pendientes
      </Typography>

      <Grid container spacing={3}>
       {solicitudes
  .filter(
    (solicitud) =>
      solicitud.estado === "pendiente"
  )
  .map((solicitud) => (
          <Grid item xs={12} md={6} key={solicitud.id}>
            <Card sx={{ borderRadius: 4 }}>
              <CardContent>
                <Stack spacing={1}>
                  <Typography variant="h6" fontWeight="bold">
                    {solicitud.cliente}
                  </Typography>
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
    VER
  </Button>

  {solicitud.estado === "pendiente" && (
    <>
      <Button
        variant="contained"
        color="success"
        onClick={() =>
          autorizarSolicitud(solicitud.id)
        }
      >
        ACEPTAR
      </Button>

      <Button
        variant="contained"
        color="error"
        onClick={() =>
          rechazarSolicitud(solicitud.id)
        }
      >
        RECHAZAR
      </Button>
    </>
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
  maxWidth="sm"
  fullWidth
>
  <DialogTitle>
    Productos solicitados
  </DialogTitle>

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
            <Typography
              variant="h6"
              fontWeight="bold"
            >
              {item.nombre}
            </Typography>

            <Typography>
              Cantidad solicitada: {item.cantidad}
            </Typography>
          </CardContent>
        </Card>
      ))}

      <Button
        variant="contained"
        onClick={() => setOpen(false)}
      >
        CERRAR
      </Button>
    </Stack>
  </DialogContent>
</Dialog>
    </MainLayout>
  );

}

export default Solicitudes;