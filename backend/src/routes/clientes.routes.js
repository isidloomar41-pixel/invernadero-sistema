import express from "express";
import { pool } from "../config/db.js";
import {
  verificarToken,
  permitirRoles,
} from "../middlewares/auth.middleware.js";

const router = express.Router();

function validarCliente({ nombre, correo, telefono, direccion, tipo_cliente }) {
  if (
    !nombre ||
    !correo ||
    !telefono ||
    !direccion ||
    !tipo_cliente ||
    nombre.trim() === "" ||
    correo.trim() === "" ||
    telefono.trim() === "" ||
    direccion.trim() === "" ||
    tipo_cliente.trim() === ""
  ) {
    return "Todos los campos son obligatorios";
  }

  const correoValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!correoValido.test(correo.trim())) {
    return "Ingresa un correo válido";
  }

  const telefonoSoloNumeros = telefono.replace(/\D/g, "");

  if (telefonoSoloNumeros.length !== 10) {
    return "El teléfono debe tener 10 dígitos";
  }

  if (!["minorista", "mayorista", "frecuente"].includes(tipo_cliente)) {
    return "Tipo de cliente no válido";
  }

  return null;
}

router.get("/", verificarToken, async (req, res) => {
  try {
    const resultado = await pool.query(`
      SELECT *
      FROM clientes
      ORDER BY id DESC
    `);

    res.json(resultado.rows);
  } catch (error) {
    res.status(500).json({
      mensaje: "Error al obtener clientes",
      error: error.message,
    });
  }
});

router.post(
  "/",
  verificarToken,
  permitirRoles("jefe", "encargado", "vendedor"),
  async (req, res) => {
    try {
      const {
        nombre,
        correo,
        telefono,
        direccion,
        tipo_cliente,
      } = req.body;

      const errorValidacion = validarCliente({
        nombre,
        correo,
        telefono,
        direccion,
        tipo_cliente,
      });

      if (errorValidacion) {
        return res.status(400).json({
          mensaje: errorValidacion,
        });
      }

      const existeResultado = await pool.query(
        `
        SELECT id
        FROM clientes
        WHERE correo = $1
        `,
        [correo.trim()]
      );

      if (existeResultado.rows.length > 0) {
        return res.status(400).json({
          mensaje: "Ya existe un cliente con ese correo",
        });
      }

      await pool.query(
        `
        INSERT INTO clientes
        (
          nombre,
          correo,
          telefono,
          direccion,
          tipo_cliente
        )
        VALUES ($1, $2, $3, $4, $5)
        `,
        [
          nombre.trim(),
          correo.trim(),
          telefono.trim(),
          direccion.trim(),
          tipo_cliente.trim(),
        ]
      );

      res.json({
        mensaje: "Cliente agregado correctamente",
      });
    } catch (error) {
      res.status(500).json({
        mensaje: "Error al crear cliente",
        error: error.message,
      });
    }
  }
);

router.put(
  "/:id",
  verificarToken,
  permitirRoles("jefe", "encargado"),
  async (req, res) => {
    try {
      const { id } = req.params;

      const {
        nombre,
        correo,
        telefono,
        direccion,
        tipo_cliente,
      } = req.body;

      const errorValidacion = validarCliente({
        nombre,
        correo,
        telefono,
        direccion,
        tipo_cliente,
      });

      if (errorValidacion) {
        return res.status(400).json({
          mensaje: errorValidacion,
        });
      }

      const existeResultado = await pool.query(
        `
        SELECT id
        FROM clientes
        WHERE correo = $1
        AND id <> $2
        `,
        [correo.trim(), id]
      );

      if (existeResultado.rows.length > 0) {
        return res.status(400).json({
          mensaje: "Ya existe otro cliente con ese correo",
        });
      }

      await pool.query(
        `
        UPDATE clientes
        SET
          nombre = $1,
          correo = $2,
          telefono = $3,
          direccion = $4,
          tipo_cliente = $5
        WHERE id = $6
        `,
        [
          nombre.trim(),
          correo.trim(),
          telefono.trim(),
          direccion.trim(),
          tipo_cliente.trim(),
          id,
        ]
      );

      res.json({
        mensaje: "Cliente actualizado correctamente",
      });
    } catch (error) {
      res.status(500).json({
        mensaje: "Error al actualizar cliente",
        error: error.message,
      });
    }
  }
);

router.delete(
  "/:id",
  verificarToken,
  permitirRoles("jefe"),
  async (req, res) => {
    try {
      const { id } = req.params;

      await pool.query(
        `
        DELETE FROM clientes
        WHERE id = $1
        `,
        [id]
      );

      res.json({
        mensaje: "Cliente eliminado correctamente",
      });
    } catch (error) {
      res.status(500).json({
        mensaje:
          "No se pudo eliminar el cliente. Puede tener pedidos o notas relacionadas.",
        error: error.message,
      });
    }
  }
);

export default router;