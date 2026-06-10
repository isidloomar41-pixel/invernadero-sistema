import express from "express";
import { pool } from "../config/db.js";
import {
  verificarToken,
  permitirRoles,
} from "../middlewares/auth.middleware.js";

const router = express.Router();

/* ======================================
   OBTENER USUARIOS ACTIVOS
====================================== */

router.get(
  "/",
  verificarToken,
  permitirRoles("jefe"),
  async (req, res) => {
    try {
      const resultado = await pool.query(`
        SELECT
          id,
          nombre,
          correo,
          rol,
          telefono,
          activo,
          fecha_registro
        FROM usuarios
        WHERE rol IN ('jefe', 'encargado', 'vendedor')
        AND activo = 1
        ORDER BY id DESC
      `);

      res.json(resultado.rows);
    } catch (error) {
      res.status(500).json({
        mensaje: "Error al obtener usuarios",
        error: error.message,
      });
    }
  }
);

/* ======================================
   CREAR USUARIO
====================================== */

router.post(
  "/",
  verificarToken,
  permitirRoles("jefe"),
  async (req, res) => {
    try {
      const {
        nombre,
        correo,
        password,
        rol,
        telefono,
      } = req.body;

      if (
        !nombre ||
        !correo ||
        !password ||
        !rol ||
        !telefono
      ) {
        return res.status(400).json({
          mensaje: "Todos los campos son obligatorios",
        });
      }

      if (
        !["jefe", "encargado", "vendedor"].includes(rol)
      ) {
        return res.status(400).json({
          mensaje:
            "Solo puedes registrar trabajadores",
        });
      }

      /* LIMITE DE JEFES */

      if (rol === "jefe") {
        const jefes = await pool.query(`
          SELECT COUNT(*) as total
          FROM usuarios
          WHERE rol = 'jefe'
          AND activo = 1
        `);

        if (
          Number(jefes.rows[0].total) >= 2
        ) {
          return res.status(400).json({
            mensaje:
              "Solo puede existir el propietario y un jefe adicional",
          });
        }
      }

      const existeResultado =
        await pool.query(
          `
          SELECT id
          FROM usuarios
          WHERE correo = $1
          `,
          [correo]
        );

      if (
        existeResultado.rows.length > 0
      ) {
        return res.status(400).json({
          mensaje:
            "Ese correo ya está registrado",
        });
      }

      await pool.query(
        `
        INSERT INTO usuarios
        (
          nombre,
          correo,
          password,
          rol,
          telefono,
          activo
        )
        VALUES
        (
          $1,$2,$3,$4,$5,1
        )
        `,
        [
          nombre,
          correo,
          password,
          rol,
          telefono,
        ]
      );

      res.json({
        mensaje:
          "Trabajador creado correctamente",
      });
    } catch (error) {
      res.status(500).json({
        mensaje:
          "Error al crear trabajador",
        error: error.message,
      });
    }
  }
);

/* ======================================
   EDITAR USUARIO
====================================== */

router.put(
  "/:id",
  verificarToken,
  permitirRoles("jefe"),
  async (req, res) => {
    try {
      const { id } = req.params;

      const {
        nombre,
        correo,
        password,
        rol,
        telefono,
        activo,
      } = req.body;

      if (
        !["jefe", "encargado", "vendedor"].includes(
          rol
        )
      ) {
        return res.status(400).json({
          mensaje:
            "Solo puedes editar trabajadores",
        });
      }

      if (
        Number(id) ===
          Number(req.usuario.id) &&
        Number(activo) === 0
      ) {
        return res.status(400).json({
          mensaje:
            "No puedes darte de baja a ti mismo",
        });
      }

      if (
        password &&
        password.trim() !== ""
      ) {
        await pool.query(
          `
          UPDATE usuarios
          SET
            nombre = $1,
            correo = $2,
            password = $3,
            rol = $4,
            telefono = $5,
            activo = $6
          WHERE id = $7
          `,
          [
            nombre,
            correo,
            password,
            rol,
            telefono,
            activo,
            id,
          ]
        );
      } else {
        await pool.query(
          `
          UPDATE usuarios
          SET
            nombre = $1,
            correo = $2,
            rol = $3,
            telefono = $4,
            activo = $5
          WHERE id = $6
          `,
          [
            nombre,
            correo,
            rol,
            telefono,
            activo,
            id,
          ]
        );
      }

      res.json({
        mensaje:
          "Trabajador actualizado correctamente",
      });
    } catch (error) {
      res.status(500).json({
        mensaje:
          "Error al actualizar trabajador",
        error: error.message,
      });
    }
  }
);

/* ======================================
   DESACTIVAR USUARIO
====================================== */

router.delete(
  "/:id",
  verificarToken,
  permitirRoles("jefe"),
  async (req, res) => {
    try {
      const { id } = req.params;

      if (
        Number(id) ===
        Number(req.usuario.id)
      ) {
        return res.status(400).json({
          mensaje:
            "No puedes darte de baja a ti mismo",
        });
      }

      const resultado =
        await pool.query(
          `
          SELECT *
          FROM usuarios
          WHERE id = $1
          `,
          [id]
        );

      if (
        resultado.rows.length === 0
      ) {
        return res.status(404).json({
          mensaje:
            "Usuario no encontrado",
        });
      }

      const usuarioEliminar =
        resultado.rows[0];

      /* PROPIETARIO */

      if (
        usuarioEliminar.correo ===
        "admin@flor.com"
      ) {
        return res.status(400).json({
          mensaje:
            "No puedes eliminar al propietario del sistema",
        });
      }

      await pool.query(
        `
        UPDATE usuarios
        SET activo = 0
        WHERE id = $1
        `,
        [id]
      );

      res.json({
        mensaje:
          "Trabajador desactivado correctamente",
      });
    } catch (error) {
      res.status(500).json({
        mensaje:
          "Error al desactivar trabajador",
        error: error.message,
      });
    }
  }
);

export default router;