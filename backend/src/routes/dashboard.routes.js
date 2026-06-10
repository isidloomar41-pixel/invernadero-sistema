import express from "express";
import { pool } from "../config/db.js";
import { verificarToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get(
  "/resumen",
  verificarToken,
  async (req, res) => {
    try {
      const resultado = await pool.query(`
        SELECT
          (
            SELECT COUNT(*)
            FROM pedidos
            WHERE DATE(fecha) = CURRENT_DATE
          ) AS pedidos_dia,

          (
            SELECT COUNT(*)
            FROM productos
          ) AS productos,

          (
            SELECT COUNT(*)
            FROM clientes
          ) AS clientes,

          (
            SELECT COALESCE(SUM(total),0)
            FROM pedidos
            WHERE EXTRACT(MONTH FROM fecha) =
                  EXTRACT(MONTH FROM CURRENT_DATE)
            AND EXTRACT(YEAR FROM fecha) =
                EXTRACT(YEAR FROM CURRENT_DATE)
          ) AS ventas_mes
      `);

      res.json({
        pedidosDia: Number(
          resultado.rows[0].pedidos_dia
        ),

        productos: Number(
          resultado.rows[0].productos
        ),

        clientes: Number(
          resultado.rows[0].clientes
        ),

        ventasMes: Number(
          resultado.rows[0].ventas_mes
        ),
      });
    } catch (error) {
      res.status(500).json({
        mensaje:
          "Error al obtener resumen",
        error: error.message,
      });
    }
  }
);

export default router;