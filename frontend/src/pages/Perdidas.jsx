import { useEffect, useState } from "react";

import {
Button,
Grid,
MenuItem,
Paper,
Select,
Table,
TableBody,
TableCell,
TableContainer,
TableHead,
TableRow,
TextField,
Typography,
InputLabel,
FormControl,
} from "@mui/material";

import MainLayout from "../layouts/MainLayout";
import api from "../services/api";
import Buscador from "../components/Buscador";

import {
alertaExito,
alertaError,
alertaAdvertencia,
} from "../utils/alertas";

function Perdidas({ setPagina }) {
const [productos, setProductos] = useState([]);
const [perdidas, setPerdidas] = useState([]);
const [busqueda, setBusqueda] = useState("");

const [formulario, setFormulario] = useState({
producto_id: "",
cantidad: "",
motivo: "",
});

async function cargarDatos() {
try {
const resProductos = await api.get("/productos");
const resPerdidas = await api.get("/perdidas");


  setProductos(resProductos.data);
  setPerdidas(resPerdidas.data);
} catch (error) {
  await alertaError("Error al cargar información");
}


}

useEffect(() => {
cargarDatos();
}, []);

const perdidasFiltradas = perdidas.filter((perdida) => {
const texto = busqueda.toLowerCase();


return (
  perdida.producto?.toLowerCase().includes(texto) ||
  perdida.motivo?.toLowerCase().includes(texto) ||
  perdida.usuario?.toLowerCase().includes(texto) ||
  String(perdida.cantidad).includes(texto) ||
  String(perdida.costo_perdida).includes(texto) ||
  new Date(perdida.fecha)
    .toLocaleDateString()
    .toLowerCase()
    .includes(texto)
);


});

function manejarCambio(e) {
setFormulario({
...formulario,
[e.target.name]: e.target.value,
});
}

async function registrarPerdida(e) {
e.preventDefault();


if (
  !formulario.producto_id ||
  !formulario.cantidad ||
  !formulario.motivo.trim()
) {
  return alertaAdvertencia(
    "Todos los campos son obligatorios"
  );
}

try {
  await api.post("/perdidas", formulario);

  await alertaExito(
    "Pérdida registrada correctamente"
  );

  setFormulario({
    producto_id: "",
    cantidad: "",
    motivo: "",
  });

  await cargarDatos();
} catch (error) {
  await alertaError(
    error.response?.data?.error ||
      "Error al registrar pérdida"
  );
}


}

return (
  <MainLayout setPagina={setPagina}>
    <Typography
      variant="h4"
      fontWeight="bold"
      mb={4}
    >
      Pérdidas de plantas
    </Typography>

    <Paper sx={{ p: 3, mb: 4, borderRadius: 4 }}>
      <form onSubmit={registrarPerdida}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Producto</InputLabel>

              <Select
                name="producto_id"
                value={formulario.producto_id}
                label="Producto"
                onChange={manejarCambio}
              >
                {productos.map((producto) => (
                  <MenuItem
                    key={producto.id}
                    value={producto.id}
                  >
                    {producto.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              type="number"
              label="Cantidad perdida"
              name="cantidad"
              value={formulario.cantidad}
              onChange={manejarCambio}
            />
          </Grid>

          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              label="Motivo"
              name="motivo"
              value={formulario.motivo}
              onChange={manejarCambio}
            />
          </Grid>

          <Grid item xs={12} sm={2}>
            <Button
              fullWidth
              type="submit"
              variant="contained"
              color="error"
              sx={{
                height: 56,
                borderRadius: 3,
                fontWeight: "bold",
                fontSize: "1rem",
                background:
                  "linear-gradient(135deg,#D32F2F,#F44336)",

                "&:hover": {
                  background:
                    "linear-gradient(135deg,#B71C1C,#D32F2F)",
                },
              }}
            >
              Registrar pérdida
            </Button>
          </Grid>
        </Grid>
      </form>
    </Paper>

    <Paper sx={{ p: 2, mb: 2, borderRadius: 4 }}>
      <Buscador
        value={busqueda}
        onChange={setBusqueda}
        label="Buscar por producto, motivo, usuario, cantidad, costo o fecha..."
      />
    </Paper>

    <TableContainer component={Paper} sx={{ borderRadius: 4 }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Producto</TableCell>
            <TableCell>Cantidad</TableCell>
            <TableCell>Motivo</TableCell>
            <TableCell>Costo pérdida</TableCell>
            <TableCell>Registró</TableCell>
            <TableCell>Fecha</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {perdidasFiltradas.map((perdida) => (
            <TableRow key={perdida.id}>
              <TableCell>{perdida.producto}</TableCell>
              <TableCell>{perdida.cantidad}</TableCell>
              <TableCell>{perdida.motivo}</TableCell>
              <TableCell>
                ${Number(perdida.costo_perdida).toFixed(2)}
              </TableCell>
              <TableCell>{perdida.usuario}</TableCell>
              <TableCell>
                {new Date(perdida.fecha).toLocaleString()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  </MainLayout>


);
}

export default Perdidas;
