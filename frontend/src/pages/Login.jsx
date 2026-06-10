import { useState } from "react";
import {
  Box,
  Button,
  Container,
  Paper,
  TextField,
  Typography,
} from "@mui/material";

import api from "../services/api";

import {
  alertaExito,
  alertaError,
  alertaAdvertencia,
} from "../utils/alertas";

function Login() {
  const [modoRegistro, setModoRegistro] = useState(false);

  const [login, setLogin] = useState({
    correo: "",
    password: "",
  });

  const [registro, setRegistro] = useState({
    nombre: "",
    correo: "",
    password: "",
    telefono: "",
    direccion: "",
  });

  function cambiarLogin(e) {
    setLogin({
      ...login,
      [e.target.name]: e.target.value,
    });
  }

  function cambiarRegistro(e) {
    setRegistro({
      ...registro,
      [e.target.name]: e.target.value,
    });
  }

  async function iniciarSesion(e) {
    e.preventDefault();

    if (!login.correo.trim() || !login.password.trim()) {
      return alertaAdvertencia(
        "Ingresa tu correo y contraseña"
      );
    }

    try {
      const respuesta = await api.post(
        "/auth/login",
        login
      );

      localStorage.setItem(
        "token",
        respuesta.data.token
      );

      localStorage.setItem(
        "usuario",
        JSON.stringify(
          respuesta.data.usuario
        )
      );

      window.location.reload();
    } catch (error) {
      await alertaError(
        "Correo o contraseña incorrectos"
      );
    }
  }

  async function registrarCliente(e) {
    e.preventDefault();

    if (
      !registro.nombre.trim() ||
      !registro.correo.trim() ||
      !registro.password.trim() ||
      !registro.telefono.trim() ||
      !registro.direccion.trim()
    ) {
      return alertaAdvertencia(
        "Todos los campos son obligatorios"
      );
    }

    const nombreValido =
      /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/;

    if (!nombreValido.test(registro.nombre)) {
      return alertaAdvertencia(
        "El nombre solo puede contener letras y espacios"
      );
    }

    const correoValido =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!correoValido.test(registro.correo)) {
      return alertaAdvertencia(
        "Ingresa un correo válido"
      );
    }

    const telefonoValido =
      /^\d{10}$/;

    if (!telefonoValido.test(registro.telefono)) {
      return alertaAdvertencia(
        "El teléfono debe contener exactamente 10 dígitos"
      );
    }

    if (registro.password.length < 6) {
      return alertaAdvertencia(
        "La contraseña debe tener mínimo 6 caracteres"
      );
    }

    try {
      await api.post(
        "/auth/registro-cliente",
        registro
      );

      await alertaExito(
        "Cuenta creada correctamente. Ahora inicia sesión."
      );

      setModoRegistro(false);

      setLogin({
        correo: registro.correo,
        password: registro.password,
      });

      setRegistro({
        nombre: "",
        correo: "",
        password: "",
        telefono: "",
        direccion: "",
      });
    } catch (error) {
      await alertaError(
        error.response?.data?.mensaje ||
          "Error al registrar cliente"
      );
    }
  }

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
        }}
      >
        <Paper
          elevation={5}
          sx={{
            width: "100%",
            p: 5,
            borderRadius: 4,
          }}
        >
          <Typography
            variant="h4"
            textAlign="center"
            mb={1}
            fontWeight="bold"
          >
            🌿 Invernadero Floral
          </Typography>

          <Typography
            textAlign="center"
            mb={4}
            color="text.secondary"
          >
            {modoRegistro
              ? "Registro de cliente"
              : "Inicio de sesión"}
          </Typography>

          {!modoRegistro ? (
            <form onSubmit={iniciarSesion}>
              <TextField
                fullWidth
                label="Correo"
                name="correo"
                margin="normal"
                value={login.correo}
                onChange={cambiarLogin}
              />

              <TextField
                fullWidth
                type="password"
                label="Contraseña"
                name="password"
                margin="normal"
                value={login.password}
                onChange={cambiarLogin}
              />

              <Button
                fullWidth
                variant="contained"
                type="submit"
                sx={{
                  mt: 3,
                  py: 1.5,
                }}
              >
                Iniciar sesión
              </Button>

              <Button
                fullWidth
                variant="text"
                sx={{ mt: 2 }}
                onClick={() =>
                  setModoRegistro(true)
                }
              >
                Crear cuenta como cliente
              </Button>
            </form>
          ) : (
            <form onSubmit={registrarCliente}>
              <TextField
                fullWidth
                label="Nombre completo"
                name="nombre"
                margin="normal"
                value={registro.nombre}
                onChange={(e) => {
                  const valor =
                    e.target.value;

                  if (
                    /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]*$/.test(
                      valor
                    )
                  ) {
                    setRegistro({
                      ...registro,
                      nombre: valor,
                    });
                  }
                }}
              />

              <TextField
                fullWidth
                label="Correo"
                name="correo"
                margin="normal"
                value={registro.correo}
                onChange={cambiarRegistro}
              />

              <TextField
                fullWidth
                type="password"
                label="Contraseña"
                name="password"
                margin="normal"
                value={registro.password}
                onChange={cambiarRegistro}
              />

              <TextField
                fullWidth
                label="Teléfono"
                name="telefono"
                margin="normal"
                value={registro.telefono}
                onChange={(e) => {
                  const valor =
                    e.target.value.replace(
                      /\D/g,
                      ""
                    );

                  if (
                    valor.length <= 10
                  ) {
                    setRegistro({
                      ...registro,
                      telefono: valor,
                    });
                  }
                }}
                inputProps={{
                  maxLength: 10,
                }}
              />

              <TextField
                fullWidth
                label="Dirección"
                name="direccion"
                margin="normal"
                value={registro.direccion}
                onChange={cambiarRegistro}
              />

              <Button
                fullWidth
                variant="contained"
                type="submit"
                sx={{
                  mt: 3,
                  py: 1.5,
                }}
              >
                Registrarme
              </Button>

              <Button
                fullWidth
                variant="text"
                sx={{ mt: 2 }}
                onClick={() =>
                  setModoRegistro(false)
                }
              >
                Ya tengo cuenta
              </Button>
            </form>
          )}
        </Paper>
      </Box>
    </Container>
  );
}

export default Login;