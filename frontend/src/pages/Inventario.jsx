import { useEffect, useState } from "react";

import {
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

import MainLayout from "../layouts/MainLayout";
import api from "../services/api";
import Buscador from "../components/Buscador";

import {
  alertaError,
} from "../utils/alertas";

function Inventario({ setPagina }) {
  const [productos, setProductos] = useState([]);
  const [busqueda, setBusqueda] = useState("");

  async function obtenerProductos() {
    try {
      const respuesta = await api.get("/productos");
      setProductos(respuesta.data);
    } catch (error) {
      await alertaError(
        "Error al cargar inventario"
      );
    }
  }

  useEffect(() => {
    obtenerProductos();
  }, []);

  const productosFiltrados = productos.filter((producto) => {
    const texto = busqueda.toLowerCase();

    const estado =
      Number(producto.stock) <= Number(producto.stock_minimo)
        ? "stock bajo"
        : "disponible";

    return (
      producto.nombre?.toLowerCase().includes(texto) ||
      producto.temporada?.toLowerCase().includes(texto) ||
      String(producto.stock).includes(texto) ||
      String(producto.stock_minimo).includes(texto) ||
      estado.includes(texto)
    );
  });

  return (
    <MainLayout setPagina={setPagina}>
      <Typography variant="h4" fontWeight="bold" mb={4}>
        Inventario
      </Typography>

      <Paper sx={{ p: 2, mb: 2, borderRadius: 4 }}>
        <Buscador
          value={busqueda}
          onChange={setBusqueda}
          label="Buscar por producto, temporada, stock o estado..."
        />
      </Paper>

      <TableContainer component={Paper} sx={{ borderRadius: 4 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Producto</TableCell>
              <TableCell>Temporada</TableCell>
              <TableCell>Stock actual</TableCell>
              <TableCell>Stock mínimo</TableCell>
              <TableCell>Estado</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {productosFiltrados.map((producto) => {
              const bajo =
                Number(producto.stock) <=
                Number(producto.stock_minimo);

              return (
                <TableRow key={producto.id}>
                  <TableCell>{producto.nombre}</TableCell>
                  <TableCell>{producto.temporada}</TableCell>
                  <TableCell>{producto.stock}</TableCell>
                  <TableCell>{producto.stock_minimo}</TableCell>

                  <TableCell>
                    {bajo ? (
                      <Chip
                        label="Stock bajo"
                        color="error"
                      />
                    ) : (
                      <Chip
                        label="Disponible"
                        color="success"
                      />
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </MainLayout>
  );
}

export default Inventario;