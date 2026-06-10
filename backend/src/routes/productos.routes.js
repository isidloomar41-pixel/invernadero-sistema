import express from "express";
import { pool } from "../config/db.js";
import {
  verificarToken,
  permitirRoles,
} from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", verificarToken, async (req, res) => {
  try {
    const resultado = await pool.query(`
      SELECT *
      FROM productos
      ORDER BY id DESC
    `);

    res.json(resultado.rows);
  } catch (error) {
    res.status(500).json({
      mensaje: "Error al obtener productos",
      error: error.message,
    });
  }
});

router.post(
  "/",
  verificarToken,
  permitirRoles("jefe", "encargado"),
  async (req, res) => {
    try {
      const {
        nombre,
        temporada,
        stock,
        stock_minimo,
        precio,
        costo,
        descripcion,
      } = req.body;

      if (
        Number(stock) < 0 ||
        Number(stock_minimo) < 0 ||
        Number(precio) < 0 ||
        Number(costo) < 0
      ) {
        return res.status(400).json({
          mensaje:
            "No se permiten valores negativos en stock, stock mínimo, precio o costo",
        });
      }

      await pool.query(
        `
        INSERT INTO productos
        (
          nombre,
          temporada,
          stock,
          stock_minimo,
          precio,
          costo,
          descripcion
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        `,
        [
          nombre,
          temporada,
          Number(stock) || 0,
          Number(stock_minimo) || 0,
          Number(precio) || 0,
          Number(costo) || 0,
          descripcion || "",
        ]
      );

      res.json({
        mensaje: "Producto agregado correctamente",
      });
    } catch (error) {
      res.status(500).json({
        mensaje: "Error al crear producto",
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
        temporada,
        stock,
        stock_minimo,
        precio,
        costo,
        descripcion,
      } = req.body;

      if (
        Number(stock) < 0 ||
        Number(stock_minimo) < 0 ||
        Number(precio) < 0 ||
        Number(costo) < 0
      ) {
        return res.status(400).json({
          mensaje:
            "No se permiten valores negativos en stock, stock mínimo, precio o costo",
        });
      }

      await pool.query(
        `
        UPDATE productos
        SET
          nombre = $1,
          temporada = $2,
          stock = $3,
          stock_minimo = $4,
          precio = $5,
          costo = $6,
          descripcion = $7
        WHERE id = $8
        `,
        [
          nombre,
          temporada,
          Number(stock) || 0,
          Number(stock_minimo) || 0,
          Number(precio) || 0,
          Number(costo) || 0,
          descripcion || "",
          id,
        ]
      );

      res.json({
        mensaje: "Producto actualizado correctamente",
      });
    } catch (error) {
      res.status(500).json({
        mensaje: "Error al actualizar producto",
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
        DELETE FROM productos
        WHERE id = $1
        `,
        [id]
      );

      res.json({
        mensaje: "Producto eliminado correctamente",
      });
    } catch (error) {
      res.status(500).json({
        mensaje: "Error al eliminar producto",
        error: error.message,
      });
    }
  }
);

export default router;