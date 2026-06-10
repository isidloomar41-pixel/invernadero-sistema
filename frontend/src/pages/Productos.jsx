import { useEffect, useState } from "react";
import {
  Button,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

import MainLayout from "../layouts/MainLayout";
import api from "../services/api";
import Buscador from "../components/Buscador";  
import {
  alertaExito,
  alertaError,
  alertaAdvertencia,
  confirmarEliminacion,
} from "../utils/alertas";

function Productos({ setPagina }) {
  const usuario = JSON.parse(localStorage.getItem("usuario"));
  const esJefe = usuario?.rol === "jefe";

  const [productos, setProductos] = useState([]);
  const [editandoId, setEditandoId] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [formulario, setFormulario] = useState({
    nombre: "",
    temporada: "",
    stock: "",
    stock_minimo: "",
    precio: "",
    costo: "",
    descripcion: "",
  });
async function obtenerProductos() {
  try {
    const respuesta = await api.get("/productos");
    setProductos(respuesta.data);
  } catch (error) {
    await alertaError("Error al cargar productos");
  }
}

useEffect(() => {
  obtenerProductos();
}, []);

const productosFiltrados = productos.filter((producto) => {
  const texto = busqueda.toLowerCase();

  return (
    producto.nombre?.toLowerCase().includes(texto) ||
    producto.temporada?.toLowerCase().includes(texto) ||
    producto.descripcion?.toLowerCase().includes(texto) ||
    String(producto.stock).includes(texto) ||
    String(producto.precio).includes(texto) ||
    String(producto.costo).includes(texto)
  );
});


  function manejarCambio(e) {
    setFormulario({
      ...formulario,
      [e.target.name]: e.target.value,
    });
  }

  function limpiarFormulario() {
    setFormulario({
      nombre: "",
      temporada: "",
      stock: "",
      stock_minimo: "",
      precio: "",
      costo: "",
      descripcion: "",
    });

    setEditandoId(null);
  }
async function guardarProducto(e) {
  e.preventDefault();

  if (
    !formulario.nombre.trim() ||
    !formulario.temporada.trim() ||
    !formulario.stock ||
    !formulario.stock_minimo ||
    !formulario.precio ||
    !formulario.costo
  ) {
    return alertaAdvertencia(
      "Todos los campos obligatorios deben ser llenados"
    );
  }

  try {
    if (editandoId) {
      await api.put(`/productos/${editandoId}`, formulario);

      await alertaExito(
        "Producto actualizado correctamente"
      );
    } else {
      await api.post("/productos", formulario);

      await alertaExito(
        "Producto agregado correctamente"
      );
    }

    limpiarFormulario();
    obtenerProductos();
  } catch (error) {
    await alertaError(
      error.response?.data?.mensaje ||
      "Error al guardar producto"
    );
  }
}

  function cargarProducto(producto) {
    setEditandoId(producto.id);

    setFormulario({
      nombre: producto.nombre || "",
      temporada: producto.temporada || "",
      stock: producto.stock || "",
      stock_minimo: producto.stock_minimo || "",
      precio: producto.precio || "",
      costo: producto.costo || "",
      descripcion: producto.descripcion || "",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function eliminarProducto(id) {
  const confirmar = await confirmarEliminacion(
    "¿Seguro que deseas eliminar este producto?"
  );

  if (!confirmar) return;

  try {
    await api.delete(`/productos/${id}`);

    await alertaExito(
      "Producto eliminado correctamente"
    );

    obtenerProductos();
  } catch (error) {
    await alertaError(
      "No se pudo eliminar el producto. Puede estar relacionado con pedidos."
    );
  }
}

  return (
    <MainLayout setPagina={setPagina}>
      <Typography variant="h4" fontWeight="bold" mb={4}>
        Flores / Productos
      </Typography>

      <Paper sx={{ p: 3, mb: 4, borderRadius: 4 }}>
        <Typography variant="h6" fontWeight="bold" mb={2}>
          {editandoId ? "Editar producto" : "Agregar producto"}
        </Typography>

        <form onSubmit={guardarProducto}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Nombre"
                name="nombre"
                value={formulario.nombre}
                onChange={manejarCambio}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Temporada"
                name="temporada"
                value={formulario.temporada}
                onChange={manejarCambio}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Stock"
                name="stock"
                value={formulario.stock}
                onChange={manejarCambio}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Stock mínimo"
                name="stock_minimo"
                value={formulario.stock_minimo}
                onChange={manejarCambio}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Precio de venta"
                name="precio"
                value={formulario.precio}
                onChange={manejarCambio}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Costo de compra/producción"
                name="costo"
                value={formulario.costo}
                onChange={manejarCambio}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Descripción"
                name="descripcion"
                value={formulario.descripcion}
                onChange={manejarCambio}
              />
            </Grid>

            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                sx={{ backgroundColor: "#1B5E20", mr: 2 }}
              >
                {editandoId ? "Actualizar producto" : "Agregar producto"}
              </Button>

              {editandoId && (
                <Button variant="outlined" color="error" onClick={limpiarFormulario}>
                  Cancelar
                </Button>
              )}
            </Grid>
          </Grid>
        </form>
      </Paper>
              <Paper sx={{ p: 2, mb: 2, borderRadius: 4 }}>
  <Buscador
    value={busqueda}
    onChange={setBusqueda}
    label="Buscar producto por nombre, temporada, stock, precio o descripción..."
  />
</Paper>
      <TableContainer component={Paper} sx={{ borderRadius: 4 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Temporada</TableCell>
              <TableCell>Stock</TableCell>
              <TableCell>Costo</TableCell>
              <TableCell>Venta</TableCell>
              <TableCell>Ganancia por planta</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>

        <TableBody>
  {productosFiltrados.map((producto) => (
    <TableRow key={producto.id}>
                <TableCell>{producto.nombre}</TableCell>
                <TableCell>{producto.temporada}</TableCell>
                <TableCell>{producto.stock}</TableCell>
                <TableCell>${producto.costo}</TableCell>
                <TableCell>${producto.precio}</TableCell>
                <TableCell>
                  ${Number(producto.precio) - Number(producto.costo)}
                </TableCell>

                <TableCell>
                  <Button
                    variant="contained"
                    size="small"
                    sx={{ mr: 1, backgroundColor: "#1565C0" }}
                    onClick={() => cargarProducto(producto)}
                  >
                    Editar
                  </Button>

                  {esJefe && (
                    <Button
                      variant="contained"
                      color="error"
                      size="small"
                      onClick={() => eliminarProducto(producto.id)}
                    >
                      Eliminar
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </MainLayout>
  );
}

export default Productos;