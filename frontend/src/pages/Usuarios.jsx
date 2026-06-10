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
    Chip,
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

  function Usuarios({ setPagina }) {
    const [usuarios, setUsuarios] = useState([]);
    const [editandoId, setEditandoId] = useState(null);
    const [busqueda, setBusqueda] = useState("");

    const [formulario, setFormulario] = useState({
      nombre: "",
      correo: "",
      password: "",
      rol: "vendedor",
      telefono: "",
      activo: 1,
    });

  async function obtenerUsuarios() {
    try {
      const respuesta = await api.get("/usuarios");
      setUsuarios(respuesta.data);
    } catch (error) {
      await alertaError("Error al obtener trabajadores");
    }
  } 

    useEffect(() => {
      obtenerUsuarios();
    }, []);
    const usuariosFiltrados = usuarios.filter((usuario) => {
  const texto = busqueda.toLowerCase();

  return (
    String(usuario.id).includes(texto) ||
    usuario.nombre?.toLowerCase().includes(texto) ||
    usuario.correo?.toLowerCase().includes(texto) ||
    usuario.rol?.toLowerCase().includes(texto) ||
    usuario.telefono?.toLowerCase().includes(texto)
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
        password: "",
        rol: "vendedor",
        telefono: "",
        activo: 1,
      });

      setEditandoId(null);
    }

    async function guardarUsuario(e) {
    e.preventDefault();

    if (
      !formulario.nombre.trim() ||
      !formulario.correo.trim() ||
      (!editandoId && !formulario.password.trim()) ||
      !formulario.telefono.trim()
    ) {
      return alertaAdvertencia("Todos los campos son obligatorios");
    }

    try {
      if (editandoId) {
        await api.put(`/usuarios/${editandoId}`, formulario);

        await alertaExito(
          "Trabajador actualizado correctamente"
        );
      } else {
        await api.post("/usuarios", formulario);

        await alertaExito(
          "Trabajador creado correctamente"
        );
      }

      limpiarFormulario();
      obtenerUsuarios();
    } catch (error) {
      await alertaError(
        error.response?.data?.mensaje ||
        "Error al guardar trabajador"
      );
    }
  }
    function cargarUsuario(usuario) {
      setEditandoId(usuario.id);

      setFormulario({
        nombre: usuario.nombre || "",
        correo: usuario.correo || "",
        password: "",
        rol: usuario.rol || "vendedor",
        telefono: usuario.telefono || "",
        activo: usuario.activo,
      });

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }

  async function darDeBajaUsuario(id) {
    const confirmar = await confirmarEliminacion(
      "¿Seguro que deseas dar de baja este trabajador?"
    );

    if (!confirmar) return;

    try {
      await api.delete(`/usuarios/${id}`);

      await alertaExito(
        "Trabajador dado de baja correctamente"
      );

      obtenerUsuarios();
    } catch (error) {
      await alertaError(
        error.response?.data?.mensaje ||
        "Error al dar de baja trabajador"
      );
    }
  }

    return (
      <MainLayout setPagina={setPagina}>
        <Typography variant="h4" fontWeight="bold" mb={4}>
          Usuarios / Trabajadores
        </Typography>

        <Paper sx={{ p: 3, mb: 4, borderRadius: 4 }}>
          <Typography variant="h6" fontWeight="bold" mb={2}>
            {editandoId ? "Editar trabajador" : "Dar de alta trabajador"}
          </Typography>

          <form onSubmit={guardarUsuario}>
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
                  label="Correo"
                  name="correo"
                  value={formulario.correo}
                  onChange={manejarCambio}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label={
                    editandoId
                      ? "Nueva contraseña opcional"
                      : "Contraseña"
                  }
                  name="password"
                  type="password"
                  value={formulario.password}
                  onChange={manejarCambio}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Teléfono"
                  name="telefono"
                  value={formulario.telefono}
                  onChange={manejarCambio}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Rol</InputLabel>
                  <Select
                    name="rol"
                    value={formulario.rol}
                    label="Rol"
                    onChange={manejarCambio}
                  >
                    <MenuItem value="jefe">Jefe</MenuItem>
                    <MenuItem value="encargado">Encargado</MenuItem>
                    <MenuItem value="vendedor">Vendedor</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {editandoId && (
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Estado</InputLabel>
                    <Select
                      name="activo"
                      value={formulario.activo}
                      label="Estado"
                      onChange={manejarCambio}
                    >
                      <MenuItem value={1}>Activo</MenuItem>
                      <MenuItem value={0}>Inactivo</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              )}

              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  sx={{
                    backgroundColor: "#1B5E20",
                    mr: 2,
                  }}
                >
                  {editandoId
                    ? "Actualizar trabajador"
                    : "Crear trabajador"}
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
    label="Buscar trabajador por ID, nombre, correo, rol o teléfono..."
  />
</Paper>
        <TableContainer component={Paper} sx={{ borderRadius: 4 }}>
          <Table>
            <TableHead>
  <TableRow>
    <TableCell>ID</TableCell>
    <TableCell>Nombre</TableCell>
    <TableCell>Correo</TableCell>
    <TableCell>Rol</TableCell>
    <TableCell>Teléfono</TableCell>
    <TableCell>Acciones</TableCell>
  </TableRow>
</TableHead>

            <TableBody>
              {usuariosFiltrados.map((usuario) => (
                <TableRow key={usuario.id}>
                  <TableCell>{usuario.id}</TableCell>
                  <TableCell>{usuario.nombre}</TableCell>
                  <TableCell>{usuario.correo}</TableCell>
                  <TableCell>{usuario.rol}</TableCell>
                  <TableCell>{usuario.telefono}</TableCell>

                  <TableCell>
                    <Button
                      variant="contained"
                      size="small"
                      sx={{
                        mr: 1,
                        backgroundColor: "#1565C0",
                      }}
                      onClick={() => cargarUsuario(usuario)}
                    >
                      Editar
                    </Button>

                    {Number(usuario.activo) === 1 && (
                      <Button
                        variant="contained"
                        color="error"
                        size="small"
                        onClick={() => darDeBajaUsuario(usuario.id)}
                      >
                        Desactivar
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

  export default Usuarios;