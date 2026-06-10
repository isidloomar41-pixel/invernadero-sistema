import { useEffect, useState } from "react";

import {
  Grid,
  Paper,
  Typography,
} from "@mui/material";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import MainLayout from "../layouts/MainLayout";
import api from "../services/api";

function Reportes({ setPagina }) {
  const [reporte, setReporte] = useState({
    ventas_mes_actual: 0,
    ventas_mes_anterior: 0,
    utilidad_mes_actual: 0,
    utilidad_mes_anterior: 0,
    crecimiento_ventas: 0,
    crecimiento_utilidad: 0,
    grafica: [],
  });

  async function obtenerReporte() {
    try {
      const respuesta = await api.get(
        "/reportes/ventas"
      );

      setReporte(respuesta.data);
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    obtenerReporte();
  }, []);

  return (
    <MainLayout setPagina={setPagina}>
      <Typography
        variant="h4"
        fontWeight="bold"
        mb={4}
      >
        Comparativo de Ventas y Utilidades
      </Typography>

      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={3}>
          <Paper
            sx={{
              p: 3,
              borderRadius: 4,
            }}
          >
            <Typography color="text.secondary">
              Ventas del mes
            </Typography>

            <Typography
              variant="h4"
              fontWeight="bold"
              color="primary"
            >
              $
              {Number(
                reporte.ventas_mes_actual
              ).toFixed(2)}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={3}>
          <Paper
            sx={{
              p: 3,
              borderRadius: 4,
            }}
          >
            <Typography color="text.secondary">
              Utilidad del mes
            </Typography>

            <Typography
              variant="h4"
              fontWeight="bold"
              color="success.main"
            >
              $
              {Number(
                reporte.utilidad_mes_actual
              ).toFixed(2)}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={3}>
          <Paper
            sx={{
              p: 3,
              borderRadius: 4,
            }}
          >
            <Typography color="text.secondary">
              Crecimiento ventas
            </Typography>

            <Typography
              variant="h4"
              fontWeight="bold"
              color={
                reporte.crecimiento_ventas >= 0
                  ? "success.main"
                  : "error.main"
              }
            >
              {reporte.crecimiento_ventas}%
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
            >
              vs mes anterior
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={3}>
          <Paper
            sx={{
              p: 3,
              borderRadius: 4,
            }}
          >
            <Typography color="text.secondary">
              Crecimiento utilidad
            </Typography>

            <Typography
              variant="h4"
              fontWeight="bold"
              color={
                reporte.crecimiento_utilidad >= 0
                  ? "success.main"
                  : "error.main"
              }
            >
              {reporte.crecimiento_utilidad}%
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
            >
              vs mes anterior
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Paper
        sx={{
          p: 3,
          borderRadius: 4,
          height: 450,
        }}
      >
        <Typography
          variant="h6"
          fontWeight="bold"
          mb={2}
        >
          Ventas por Mes
        </Typography>

        <ResponsiveContainer
          width="100%"
          height="90%"
        >
          <BarChart
            data={reporte.grafica}
          >
            <XAxis dataKey="mes" />
            <YAxis />
            <Tooltip />

            <Bar
              dataKey="ventas"
              fill="#4CAF50"
            />
          </BarChart>
        </ResponsiveContainer>
      </Paper>
    </MainLayout>
  );
}

export default Reportes;