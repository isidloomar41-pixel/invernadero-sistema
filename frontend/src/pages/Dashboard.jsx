import { useEffect, useState } from "react";

import { Box, Grid, Paper, Typography } from "@mui/material";

import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import InventoryIcon from "@mui/icons-material/Inventory";
import PeopleIcon from "@mui/icons-material/People";
import PaidIcon from "@mui/icons-material/Paid";

import MainLayout from "../layouts/MainLayout";
import api from "../services/api";
import logo from "../assets/logo.jpeg";

function Dashboard({ setPagina }) {
  const usuario = JSON.parse(localStorage.getItem("usuario"));
  const esCliente = usuario?.rol === "cliente";

  const [resumen, setResumen] = useState({
    pedidosDia: 0,
    productos: 0,
    clientes: 0,
    ventasMes: 0,
  });

  async function obtenerResumen() {
    try {
      const respuesta = await api.get("/dashboard/resumen");
      setResumen(respuesta.data);
    } catch (error) {
      console.error("Error al cargar resumen", error);
    }
  }

  useEffect(() => {
    if (!esCliente) obtenerResumen();
  }, []);

  const fondoLogo = {
    position: "relative",
    overflow: "hidden",
    minHeight: "calc(100vh - 100px)",
    "&::before": {
      content: '""',
      position: "absolute",
      inset: 0,
      backgroundImage: `url(${logo})`,
      backgroundRepeat: "no-repeat",
      backgroundPosition: "center",
      backgroundSize: "420px",
      opacity: 0.08,
      zIndex: 0,
    },
    "& > *": {
      position: "relative",
      zIndex: 1,
    },
  };

  if (esCliente) {
    return (
      <MainLayout setPagina={setPagina}>
        <Box sx={fondoLogo}>
          <Typography variant="h4" fontWeight="bold" mb={2} color="#5A4438">
            Bienvenido, {usuario.nombre}
          </Typography>

          <Typography variant="h6" color="#6F4E37" mb={4}>
            Puedes consultar el catálogo del invernadero y revisar tus notas.
          </Typography>

          <Grid container spacing={3}>
           <Grid size={{ xs: 12, md: 6 }}>
              <Paper
                onClick={() => setPagina("catalogo")}
                sx={{
                  p: 4,
                  borderRadius: 4,
                  cursor: "pointer",
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E8CFC1",
                }}
              >
                <Typography variant="h5" fontWeight="bold" color="#5A4438">
                  Ver catálogo
                </Typography>
                <Typography color="#6F4E37">
                  Consulta las flores y productos disponibles.
                </Typography>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Paper
                onClick={() => setPagina("notas")}
                sx={{
                  p: 4,
                  borderRadius: 4,
                  cursor: "pointer",
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E8CFC1",
                }}
              >
                <Typography variant="h5" fontWeight="bold" color="#5A4438">
                  Mis notas
                </Typography>
                <Typography color="#6F4E37">
                  Consulta tus notas generadas.
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </MainLayout>
    );
  }

 const tarjetas = [
  {
    titulo: "Pedidos del día",
    valor: resumen.pedidosDia,
    icono: <ShoppingCartIcon sx={{ fontSize: 40 }} />,
    color: "#6F8A5B",
    pagina: "pedidos",
  },
  {
    titulo: "Productos",
    valor: resumen.productos,
    icono: <InventoryIcon sx={{ fontSize: 40 }} />,
    color: "#C98B73",
    pagina: "productos",
  },
  {
    titulo: "Clientes",
    valor: resumen.clientes,
    icono: <PeopleIcon sx={{ fontSize: 40 }} />,
    color: "#8B5E4A",
    pagina: "clientes",
  },
  {
    titulo: "Ventas del mes",
    valor: `$${Number(resumen.ventasMes).toFixed(2)}`,
    icono: <PaidIcon sx={{ fontSize: 40 }} />,
    color: "#5A4438",
    pagina: "reportes",
  },
];

  return (
    <MainLayout setPagina={setPagina}>
      <Box sx={fondoLogo}>
        <Typography variant="h4" fontWeight="bold" mb={4} color="#5A4438">
          Bienvenido, {usuario.nombre}
        </Typography>

        <Grid container spacing={3}>
          {tarjetas.map((tarjeta, index) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
             <Paper
  elevation={4}
  onClick={() => setPagina(tarjeta.pagina)}
  sx={{
    p: 3,
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
    border: "1px solid #E8CFC1",
    cursor: "pointer",
    transition: "0.2s",
    "&:hover": {
      transform: "translateY(-4px)",
      boxShadow: 8,
    },
  }}
>
                <Box
  sx={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  }}
>
                  <Box>
                    <Typography color="#6F4E37">{tarjeta.titulo}</Typography>

                    <Typography variant="h4" fontWeight="bold" color="#3F332D">
                      {tarjeta.valor}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      backgroundColor: tarjeta.color,
                      color: "white",
                      p: 2,
                      borderRadius: 3,
                    }}
                  >
                    {tarjeta.icono}
                  </Box>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>
    </MainLayout>
  );
}

export default Dashboard;