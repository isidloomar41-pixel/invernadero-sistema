import { useEffect, useState } from "react";

import {
  Button,
  Chip,
  Grid,
  Paper,
  TextField,
  Typography,
} from "@mui/material";

import MainLayout from "../layouts/MainLayout";
import api from "../services/api";

function Catalogo({ setPagina }) {
  const [productos, setProductos] = useState([]);
  const [cantidades, setCantidades] = useState({});
  const [carrito, setCarrito] = useState([]);
  const [observaciones, setObservaciones] = useState("");

  async function obtenerProductos() {
    const respuesta = await api.get("/productos");
    setProductos(respuesta.data);
  }

  useEffect(() => {
    obtenerProductos();
  }, []);

  function agregarProducto(producto) {
    const cantidad = Number(cantidades[producto.id]) || 0;

    if (cantidad <= 0) {
      alert("Ingresa una cantidad válida");
      return;
    }

    if (cantidad > Number(producto.stock)) {
      alert(`Solo hay ${producto.stock} disponibles`);
      return;
    }

    const yaExiste = carrito.find((item) => item.producto_id === producto.id);

    if (yaExiste) {
      alert("Ese producto ya está agregado a la solicitud");
      return;
    }

    setCarrito([
      ...carrito,
      {
        producto_id: producto.id,
        nombre: producto.nombre,
        cantidad,
      },
    ]);

    setCantidades({
      ...cantidades,
      [producto.id]: "",
    });
  }

  function quitarProducto(id) {
    setCarrito(carrito.filter((item) => item.producto_id !== id));
  }

  async function enviarSolicitud() {
    if (carrito.length === 0) {
      alert("Agrega al menos un producto");
      return;
    }

    try {
      await api.post("/solicitudes", {
        productos: carrito.map((item) => ({
          producto_id: item.producto_id,
          cantidad: item.cantidad,
        })),
        observaciones,
      });

      alert("Solicitud enviada correctamente. Un trabajador la revisará.");

      setCarrito([]);
      setObservaciones("");
    } catch (error) {
      alert(error.response?.data?.error || "Error al enviar solicitud");
    }
  }

  return (
    <MainLayout setPagina={setPagina}>
      <Typography variant="h4" fontWeight="bold" mb={4}>
        Catálogo de productos
      </Typography>

      <Grid container spacing={3}>
        {productos.map((producto) => (
          <Grid item xs={12} md={4} key={producto.id}>
            <Paper sx={{ p: 3, borderRadius: 4, textAlign: "center" }}>
              {producto.imagen && (
                <img
                  src={`http://localhost:3000${producto.imagen}`}
                  alt={producto.nombre}
                  style={{
                    width: "100%",
                    height: "180px",
                    objectFit: "cover",
                    borderRadius: "14px",
                    marginBottom: "15px",
                  }}
                />
              )}

              <Typography variant="h5" fontWeight="bold">
                {producto.nombre}
              </Typography>

              <Typography>Temporada: {producto.temporada}</Typography>

              <Typography>Precio aproximado: ${producto.precio}</Typography>

              <Typography>{producto.descripcion}</Typography>

              <Chip
                label={producto.stock > 0 ? "Disponible" : "No disponible"}
                color={producto.stock > 0 ? "success" : "error"}
                sx={{ mt: 2, mb: 2 }}
              />

              <TextField
                fullWidth
                type="number"
                label="Cantidad"
                value={cantidades[producto.id] || ""}
                onChange={(e) =>
                  setCantidades({
                    ...cantidades,
                    [producto.id]: e.target.value,
                  })
                }
                sx={{ mb: 2 }}
              />

              <Button
                fullWidth
                variant="contained"
                disabled={producto.stock <= 0}
                onClick={() => agregarProducto(producto)}
                sx={{ backgroundColor: "#6F4E37" }}
              >
                Agregar a solicitud
              </Button>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Paper sx={{ p: 3, mt: 4, borderRadius: 4 }}>
        <Typography variant="h5" fontWeight="bold" mb={2}>
          Mi solicitud de pedido
        </Typography>

        {carrito.length === 0 ? (
          <Typography color="text.secondary">
            Todavía no has agregado productos.
          </Typography>
        ) : (
          carrito.map((item) => (
            <Paper
              key={item.producto_id}
              sx={{
                p: 2,
                mb: 2,
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <Typography>
                {item.nombre} — Cantidad: {item.cantidad}
              </Typography>

              <Button
                color="error"
                variant="contained"
                onClick={() => quitarProducto(item.producto_id)}
              >
                Quitar
              </Button>
            </Paper>
          ))
        )}

        <TextField
          fullWidth
          multiline
          rows={3}
          label="Observaciones"
          placeholder="Ejemplo: quiero recogerlo mañana, confirmar disponibilidad, etc."
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          sx={{ mt: 2 }}
        />

        <Button
          variant="contained"
          sx={{ mt: 3, backgroundColor: "#1B5E20" }}
          onClick={enviarSolicitud}
        >
          Enviar solicitud de pedido
        </Button>
      </Paper>
    </MainLayout>
  );
}

export default Catalogo;