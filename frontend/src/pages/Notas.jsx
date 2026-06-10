import { useEffect, useState } from "react";

import {
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Stack,
} from "@mui/material";

import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import EmailIcon from "@mui/icons-material/Email";

import MainLayout from "../layouts/MainLayout";
import api from "../services/api";
import Buscador from "../components/Buscador";

function Notas({ setPagina }) {
  const [notas, setNotas] = useState([]);
  const [busqueda, setBusqueda] = useState("");

  async function obtenerNotas() {
    try {
      const respuesta = await api.get("/notas");
      setNotas(respuesta.data);
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    obtenerNotas();
  }, []);

  const notasFiltradas = notas.filter((nota) => {
    const texto = busqueda.toLowerCase();

    return (
      String(nota.id).includes(texto) ||
      nota.cliente?.toLowerCase().includes(texto) ||
      nota.correo?.toLowerCase().includes(texto) ||
      nota.telefono?.toLowerCase().includes(texto) ||
      String(nota.total).includes(texto) ||
      new Date(nota.fecha)
        .toLocaleDateString()
        .toLowerCase()
        .includes(texto)
    );
  });

  async function abrirPDF(id) {
    const respuesta = await api.get(`/notas/${id}/pdf`, {
      responseType: "blob",
    });

    const archivo = new Blob([respuesta.data], {
      type: "application/pdf",
    });

    const url = window.URL.createObjectURL(archivo);
    window.open(url, "_blank");
  }

  function abrirWhatsApp(nota) {
    let telefono = String(nota.telefono || "").replace(/\D/g, "");

    if (telefono.length === 10) {
      telefono = `52${telefono}`;
    }

    const mensaje = `Hola ${nota.cliente}, tu nota de compra en "Flora Nativa" ya fue generada.

Nota: #${nota.id}
Total: $${Number(nota.total).toFixed(2)}

Para consultar todos los detalles de tu compra, revisa el PDF enviado a tu correo: ${nota.correo}

Gracias por tu compra.`;

    const url = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;

    window.open(url, "_blank");
  }

  function abrirCorreo(nota) {
    const asunto = `Nota de compra #${nota.id}`;

    const mensaje = `Hola ${nota.cliente},

Tu nota de compra en "Flora Nativa" ya fue generada.

Nota: #${nota.id}
Total: $${Number(nota.total).toFixed(2)}

Para consultar todos los detalles de tu compra, revisa el PDF adjunto enviado a tu correo.

Gracias por tu compra.`;

    const url = `mailto:${nota.correo}?subject=${encodeURIComponent(
      asunto
    )}&body=${encodeURIComponent(mensaje)}`;

    window.location.href = url;
  }

  return (
    <MainLayout setPagina={setPagina}>
      <Typography variant="h4" fontWeight="bold" mb={4}>
        Notas generadas
      </Typography>

      <Paper sx={{ p: 2, mb: 2, borderRadius: 4 }}>
        <Buscador
          value={busqueda}
          onChange={setBusqueda}
          label="Buscar por ID, cliente, correo, teléfono, total o fecha..."
        />
      </Paper>

      <TableContainer component={Paper} sx={{ borderRadius: 4 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID Nota</TableCell>
              <TableCell>Cliente</TableCell>
              <TableCell>Correo</TableCell>
              <TableCell>Teléfono</TableCell>
              <TableCell>Total</TableCell>
              <TableCell>Fecha</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {notasFiltradas.map((nota) => (
              <TableRow key={nota.id}>
                <TableCell>{nota.id}</TableCell>
                <TableCell>{nota.cliente}</TableCell>
                <TableCell>{nota.correo}</TableCell>
                <TableCell>{nota.telefono}</TableCell>
                <TableCell>
                  ${Number(nota.total).toFixed(2)}
                </TableCell>

                <TableCell>
                  {new Date(nota.fecha).toLocaleString()}
                </TableCell>

                <TableCell>
                  <Stack direction="row" spacing={1}>
                    <Button
                      variant="contained"
                      color="error"
                      startIcon={<PictureAsPdfIcon />}
                      onClick={() => abrirPDF(nota.id)}
                    >
                      PDF
                    </Button>

                    <Button
                      variant="contained"
                      sx={{ backgroundColor: "#25D366" }}
                      startIcon={<WhatsAppIcon />}
                      onClick={() => abrirWhatsApp(nota)}
                    >
                      WhatsApp
                    </Button>

                    <Button
                      variant="contained"
                      sx={{ backgroundColor: "#1565C0" }}
                      startIcon={<EmailIcon />}
                      onClick={() => abrirCorreo(nota)}
                    >
                      Correo
                    </Button>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </MainLayout>
  );
}

export default Notas;