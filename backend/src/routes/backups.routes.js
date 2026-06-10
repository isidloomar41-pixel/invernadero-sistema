import express from "express";
import path from "path";
import fs from "fs-extra";

import { pool } from "../config/db.js";

import {
  verificarToken,
  soloJefe,
} from "../middlewares/auth.middleware.js";

import {
  generarRespaldo,
} from "../jobs/backupDiario.js";

const router = express.Router();

/* =====================================================
   OBTENER HISTORIAL DE RESPALDOS
===================================================== */

router.get(
  "/",
  verificarToken,
  soloJefe,
  async (req, res) => {
    try {
      const resultado = await pool.query(`
        SELECT *
        FROM evidencias_respaldo
        ORDER BY id DESC
      `);

      res.json(resultado.rows);
    } catch (error) {
      console.error(error);

      res.status(500).json({
        mensaje:
          "Error al obtener evidencias de respaldo",
        error: error.message,
      });
    }
  }
);

/* =====================================================
   GENERAR RESPALDO MANUAL
===================================================== */

router.post(
  "/generar",
  verificarToken,
  soloJefe,
  async (req, res) => {
    try {
      const resultado =
        await generarRespaldo(
          req.usuario.nombre
        );

      if (!resultado.ok) {
        return res.status(500).json({
          mensaje:
            "Error al generar respaldo",
          error: resultado.error,
        });
      }

      res.json({
        mensaje:
          "Respaldo generado correctamente",
        respaldo: resultado,
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        mensaje:
          "Error al generar respaldo",
        error: error.message,
      });
    }
  }
);

/* =====================================================
   DESCARGAR JSON DEL RESPALDO
===================================================== */

router.get(
  "/descargar/:archivo",
  verificarToken,
  soloJefe,
  async (req, res) => {
    try {
      const archivoSeguro =
        path.basename(req.params.archivo);

      const ruta = path.resolve(
        "backups",
        archivoSeguro
      );

      const existe =
        await fs.pathExists(ruta);

      if (!existe) {
        return res.status(404).json({
          mensaje:
            "Archivo no encontrado",
        });
      }

      res.download(ruta);
    } catch (error) {
      console.error(error);

      res.status(500).json({
        mensaje:
          "Error al descargar respaldo",
        error: error.message,
      });
    }
  }
);

/* =====================================================
   DESCARGAR PDF DE EVIDENCIA
===================================================== */

router.get(
  "/evidencia/:archivo",
  verificarToken,
  soloJefe,
  async (req, res) => {
    try {
      const archivoSeguro =
        path.basename(req.params.archivo);

      const nombrePdf =
        `evidencia_${archivoSeguro.replace(
          ".json",
          ".pdf"
        )}`;

      const ruta = path.resolve(
        "evidencias",
        nombrePdf
      );

      const existe =
        await fs.pathExists(ruta);

      if (!existe) {
        return res.status(404).json({
          mensaje:
            "PDF de evidencia no encontrado",
        });
      }

      res.download(
        ruta,
        nombrePdf
      );
    } catch (error) {
      console.error(error);

      res.status(500).json({
        mensaje:
          "Error al descargar evidencia PDF",
        error: error.message,
      });
    }
  }
);

export default router;