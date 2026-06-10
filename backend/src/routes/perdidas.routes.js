import express from "express";
import { pool } from "../config/db.js";
import {
  verificarToken,
  permitirRoles,
} from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get(
  "/",
  verificarToken,
  permitirRoles("jefe", "encargado"),
  async (req, res) => {
    try {
      const resultado = await pool.query(`
        SELECT
          perdidas.id,
          productos.nombre AS producto,
          usuarios.nombre AS usuario,
          perdidas.cantidad,
          perdidas.motivo,
          perdidas.costo_perdida,
          perdidas.fecha
        FROM perdidas
        INNER JOIN productos
          ON perdidas.producto_id = productos.id
        INNER JOIN usuarios
          ON perdidas.usuario_id = usuarios.id
        ORDER BY perdidas.id DESC
      `);

      res.json(resultado.rows);
    } catch (error) {
      res.status(500).json({
        mensaje: "Error al obtener pérdidas",
        error: error.message,
      });
    }
  }
);

router.post(
  "/",
  verificarToken,
  permitirRoles("jefe", "encargado"),
  async (req, res) => {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const { producto_id, cantidad, motivo } = req.body;

      if (!producto_id || !cantidad || !motivo) {
        throw new Error("Producto, cantidad y motivo son obligatorios");
      }

      const productoResultado = await client.query(
        `
        SELECT *
        FROM productos
        WHERE id = $1
        `,
        [producto_id]
      );

      const producto = productoResultado.rows[0];

      if (!producto) {
        throw new Error("Producto no encontrado");
      }

      if (Number(producto.stock) < Number(cantidad)) {
        throw new Error(
          `No hay suficiente stock. Disponibles: ${producto.stock}`
        );
      }

      const costoPerdida =
        Number(producto.costo) * Number(cantidad);

      await client.query(
        `
        INSERT INTO perdidas
        (
          producto_id,
          usuario_id,
          cantidad,
          motivo,
          costo_perdida
        )
        VALUES ($1, $2, $3, $4, $5)
        `,
        [
          producto_id,
          req.usuario.id,
          Number(cantidad),
          motivo,
          costoPerdida,
        ]
      );

      await client.query(
        `
        UPDATE productos
        SET stock = stock - $1
        WHERE id = $2
        `,
        [Number(cantidad), producto_id]
      );

      await client.query("COMMIT");

      res.json({
        mensaje: "Pérdida registrada correctamente",
        costo_perdida: costoPerdida,
      });
    } catch (error) {
      await client.query("ROLLBACK");

      res.status(500).json({
        mensaje: "Error al registrar pérdida",
        error: error.message,
      });
    } finally {
      client.release();
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
        DELETE FROM perdidas
        WHERE id = $1
        `,
        [id]
      );

      res.json({
        mensaje: "Pérdida eliminada correctamente",
      });
    } catch (error) {
      res.status(500).json({
        mensaje: "Error al eliminar pérdida",
        error: error.message,
      });
    }
  }
);

export default router;