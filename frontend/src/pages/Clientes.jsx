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
  confirmarEliminacion,
} from "../utils/alertas";

function Clientes({ setPagina }) {
  const usuario = JSON.parse(localStorage.getItem("usuario"));
  const esJefe = usuario?.rol === "jefe";
  const puedeEditar = usuario?.rol === "jefe" || usuario?.rol === "encargado";

  const [clientes, setClientes] = useState([]);
  const [editandoId, setEditandoId] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [formulario, setFormulario] = useState({
    nombre: "",
    correo: "",
    telefono: "",
    direccion: "",
    tipo_cliente: "minorista",
  });

  async function obtenerClientes() {
  try {
    const respuesta = await api.get("/clientes");
    setClientes(respuesta.data);
  } catch (error) {
    await alertaError(
      error.response?.data?.mensaje || "Error al obtener clientes"
    );
  }
}
  useEffect(() => {
    obtenerClientes();
  }, []);

  const clientesFiltrados = clientes.filter((cliente) => {
  const texto = busqueda.toLowerCase();

  return (
    String(cliente.id).includes(texto) ||
    cliente.nombre?.toLowerCase().includes(texto) ||
    cliente.correo?.toLowerCase().includes(texto) ||
    cliente.telefono?.toLowerCase().includes(texto) ||
    cliente.direccion?.toLowerCase().includes(texto) ||
    cliente.tipo_cliente?.toLowerCase().includes(texto)
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
      correo: "",
      telefono: "",
      direccion: "",
      tipo_cliente: "minorista",
    });

    setEditandoId(null);
  }

 function validarFormulario() {
  if (
    !formulario.nombre.trim() ||
    !formulario.correo.trim() ||
    !formulario.telefono.trim() ||
    !formulario.direccion.trim() ||
    !formulario.tipo_cliente.trim()
  ) {
    alertaAdvertencia("Todos los campos son obligatorios");
    return false;
  }

  const correoValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!correoValido.test(formulario.correo.trim())) {
    alertaAdvertencia("Ingresa un correo válido");
    return false;
  }

  const telefonoSoloNumeros = formulario.telefono.replace(/\D/g, "");

  if (telefonoSoloNumeros.length !== 10) {
    alertaAdvertencia("El teléfono debe tener 10 dígitos");
    return false;
  }

  return true;
}
async function guardarCliente(e) {
  e.preventDefault();

  if (!validarFormulario()) return;

  try {
    const datosCliente = {
      nombre: formulario.nombre.trim(),
      correo: formulario.correo.trim(),
      telefono: formulario.telefono.trim(),
      direccion: formulario.direccion.trim(),
      tipo_cliente: formulario.tipo_cliente,
    };

    if (editandoId) {
      await api.put(`/clientes/${editandoId}`, datosCliente);
      await alertaExito("Cliente actualizado correctamente");
    } else {
      await api.post("/clientes", datosCliente);
      await alertaExito("Cliente agregado correctamente");
    }

    limpiarFormulario();
    obtenerClientes();
  } catch (error) {
    await alertaError(
      error.response?.data?.mensaje || "Error al guardar cliente"
    );
  }
}

  function cargarCliente(cliente) {
    setEditandoId(cliente.id);

    setFormulario({
      nombre: cliente.nombre || "",
      correo: cliente.correo || "",
      telefono: cliente.telefono || "",
      direccion: cliente.direccion || "",
      tipo_cliente: cliente.tipo_cliente || "minorista",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function eliminarCliente(id) {
  const confirmar = await confirmarEliminacion(
    "¿Seguro que deseas eliminar este cliente?"
  );

  if (!confirmar) return;

  try {
    await api.delete(`/clientes/${id}`);

    await alertaExito("Cliente eliminado correctamente");

    obtenerClientes();
  } catch (error) {
    await alertaError(
      error.response?.data?.mensaje ||
        "No se pudo eliminar el cliente porque puede tener pedidos relacionados"
    );
  }
}

  return (
    <MainLayout setPagina={setPagina}>
      <Typography variant="h4" fontWeight="bold" mb={4}>
        Clientes
      </Typography>

      <Paper sx={{ p: 3, mb: 4, borderRadius: 4 }}>
        <Typography variant="h6" fontWeight="bold" mb={2}>
          {editandoId ? "Editar cliente" : "Agregar cliente"}
        </Typography>

        <form onSubmit={guardarCliente}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                required
                label="Nombre"
                name="nombre"
                value={formulario.nombre}
                onChange={manejarCambio}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                required
                type="email"
                label="Correo"
                name="correo"
                value={formulario.correo}
                onChange={manejarCambio}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                required
                label="Teléfono"
                name="telefono"
                value={formulario.telefono}
                onChange={manejarCambio}
                inputProps={{
                  maxLength: 10,
                }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth required>
                <InputLabel>Tipo de cliente</InputLabel>
                <Select
                  name="tipo_cliente"
                  value={formulario.tipo_cliente}
                  label="Tipo de cliente"
                  onChange={manejarCambio}
                >
                  <MenuItem value="minorista">Minorista</MenuItem>
                  <MenuItem value="mayorista">Mayorista</MenuItem>
                  <MenuItem value="frecuente">Frecuente</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                required
                multiline
                rows={3}
                label="Dirección"
                name="direccion"
                value={formulario.direccion}
                onChange={manejarCambio}
              />
            </Grid>

            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                sx={{ backgroundColor: "#1B5E20", mr: 2 }}
              >
                {editandoId ? "Actualizar cliente" : "Agregar cliente"}
              </Button>

              {editandoId && (
                <Button
                  variant="outlined"
                  color="error"
                  onClick={limpiarFormulario}
                >
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
    label="Buscar cliente por ID, nombre, correo, teléfono, dirección o tipo..."
  />
</Paper>
      <TableContainer component={Paper} sx={{ borderRadius: 4 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell>Correo</TableCell>
              <TableCell>Teléfono</TableCell>
              <TableCell>Dirección</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Deuda</TableCell>
              {puedeEditar && <TableCell>Acciones</TableCell>}
            </TableRow>
          </TableHead>

          <TableBody>
{clientesFiltrados.map((cliente) => (              <TableRow key={cliente.id}>
                <TableCell>{cliente.id}</TableCell>
                <TableCell>{cliente.nombre}</TableCell>
                <TableCell>{cliente.correo}</TableCell>
                <TableCell>{cliente.telefono}</TableCell>
                <TableCell>{cliente.direccion}</TableCell>
                <TableCell>{cliente.tipo_cliente}</TableCell>
                <TableCell>
                  ${Number(cliente.deuda_total || 0).toFixed(2)}
                </TableCell>

                {puedeEditar && (
                  <TableCell>
                    <Button
                      variant="contained"
                      size="small"
                      sx={{ mr: 1, backgroundColor: "#1565C0" }}
                      onClick={() => cargarCliente(cliente)}
                    >
                      Editar
                    </Button>

                    {esJefe && (
                      <Button
                        variant="contained"
                        color="error"
                        size="small"
                        onClick={() => eliminarCliente(cliente.id)}
                      >
                        Eliminar
                      </Button>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </MainLayout>
  );
}

export default Clientes;