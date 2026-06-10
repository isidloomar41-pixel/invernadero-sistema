import { useEffect, useState } from "react";

import {
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";

import BackupIcon from "@mui/icons-material/Backup";
import DownloadIcon from "@mui/icons-material/Download";

import MainLayout from "../layouts/MainLayout";
import api from "../services/api";

import {
  alertaExito,
  alertaError,
} from "../utils/alertas";

function Respaldos({ setPagina }) {
  const [respaldos, setRespaldos] = useState([]);

  async function obtenerRespaldos() {
    try {
      const respuesta = await api.get("/backups");

      setRespaldos(respuesta.data);
    } catch (error) {
      alertaError("Error al cargar respaldos");
    }
  }

  useEffect(() => {
    obtenerRespaldos();
  }, []);

  async function generarRespaldo() {
    try {
      await api.post("/backups/generar");

      await alertaExito(
        "Respaldo generado correctamente"
      );

      obtenerRespaldos();
    } catch (error) {
      alertaError("Error al generar respaldo");
    }
  }

  async function descargarPdf(nombreArchivo) {
    try {
      const respuesta = await api.get(
        `/backups/evidencia/${nombreArchivo}`,
        {
          responseType: "blob",
        }
      );

      const nombrePdf =
        `evidencia_${nombreArchivo.replace(
          ".json",
          ".pdf"
        )}`;

      const url = window.URL.createObjectURL(
        new Blob(
          [respuesta.data],
          { type: "application/pdf" }
        )
      );

      const enlace =
        document.createElement("a");

      enlace.href = url;
      enlace.download = nombrePdf;

      document.body.appendChild(enlace);

      enlace.click();

      enlace.remove();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);

      alertaError(
        "Error al descargar evidencia PDF"
      );
    }
  }

  return (
    <MainLayout setPagina={setPagina}>
      <Typography
        variant="h4"
        fontWeight="bold"
        mb={3}
      >
        Respaldos del Sistema
      </Typography>

      <Paper
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 4,
        }}
      >
        <Button
          variant="contained"
          startIcon={<BackupIcon />}
          onClick={generarRespaldo}
          sx={{
            background:
              "linear-gradient(45deg,#2E7D32,#43A047)",
            px: 4,
            py: 1.5,
            borderRadius: 3,
            fontWeight: "bold",

            "&:hover": {
              background:
                "linear-gradient(45deg,#1B5E20,#2E7D32)",
            },
          }}
        >
          Generar respaldo manual
        </Button>
      </Paper>

      <TableContainer
        component={Paper}
        sx={{
          borderRadius: 4,
        }}
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                Archivo
              </TableCell>

              <TableCell>
                Tamaño
              </TableCell>

              <TableCell>
                Fecha
              </TableCell>

              <TableCell>
                Responsable
              </TableCell>

              <TableCell>
                Estado
              </TableCell>

              <TableCell>
                Acciones
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {respaldos.map((respaldo) => (
              <TableRow key={respaldo.id}>
                <TableCell>
                  {respaldo.nombre_archivo}
                </TableCell>

                <TableCell>
                  {respaldo.tamano_archivo} bytes
                </TableCell>

                <TableCell>
                  {new Date(
                    respaldo.fecha_respaldo
                  ).toLocaleString()}
                </TableCell>

                <TableCell>
                  {
                    respaldo.usuario_responsable
                  }
                </TableCell>

                <TableCell>
                  {respaldo.estado}
                </TableCell>

                <TableCell>
                  <Button
                    variant="contained"
                    startIcon={
                      <DownloadIcon />
                    }
                    onClick={() =>
                      descargarPdf(
                        respaldo.nombre_archivo
                      )
                    }
                    sx={{
                      background:
                        "linear-gradient(45deg,#C62828,#E53935)",
                      borderRadius: 2,
                      fontWeight: "bold",

                      "&:hover": {
                        background:
                          "linear-gradient(45deg,#B71C1C,#C62828)",
                      },
                    }}
                  >
                    Descargar PDF
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </MainLayout>
  );
}

export default Respaldos;