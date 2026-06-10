import express from "express";
import { pool } from "../config/db.js";
import {
  verificarToken,
  permitirRoles,
} from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get(
  "/ventas",
  verificarToken,
  permitirRoles("jefe", "encargado"),
  async (req, res) => {
    try {

      const ventasMesActual = await pool.query(`
        SELECT
          COALESCE(SUM(total),0) AS ventas
        FROM pedidos
        WHERE EXTRACT(MONTH FROM fecha)=EXTRACT(MONTH FROM CURRENT_DATE)
        AND EXTRACT(YEAR FROM fecha)=EXTRACT(YEAR FROM CURRENT_DATE)
      `);

      const ventasMesAnterior = await pool.query(`
        SELECT
          COALESCE(SUM(total),0) AS ventas
        FROM pedidos
        WHERE DATE_TRUNC('month',fecha)=
        DATE_TRUNC('month',CURRENT_DATE - INTERVAL '1 month')
      `);

      const utilidadMesActual = await pool.query(`
        SELECT
          COALESCE(SUM(ganancia),0) AS utilidad
        FROM detalle_pedido dp
        INNER JOIN pedidos p
          ON dp.pedido_id=p.id
        WHERE EXTRACT(MONTH FROM p.fecha)=EXTRACT(MONTH FROM CURRENT_DATE)
        AND EXTRACT(YEAR FROM p.fecha)=EXTRACT(YEAR FROM CURRENT_DATE)
      `);

      const utilidadMesAnterior = await pool.query(`
        SELECT
          COALESCE(SUM(dp.ganancia),0) AS utilidad
        FROM detalle_pedido dp
        INNER JOIN pedidos p
          ON dp.pedido_id=p.id
        WHERE DATE_TRUNC('month',p.fecha)=
        DATE_TRUNC('month',CURRENT_DATE - INTERVAL '1 month')
      `);

      const ventasMensuales = await pool.query(`
        SELECT
          TO_CHAR(fecha,'Mon') AS mes,
          COALESCE(SUM(total),0) AS ventas
        FROM pedidos
        GROUP BY mes
        ORDER BY MIN(fecha)
      `);

      const ventaActual =
        Number(ventasMesActual.rows[0].ventas);

      const ventaAnterior =
        Number(ventasMesAnterior.rows[0].ventas);

      const utilidadActual =
        Number(utilidadMesActual.rows[0].utilidad);

      const utilidadAnterior =
        Number(utilidadMesAnterior.rows[0].utilidad);

      let crecimientoVentas = 0;

      if (ventaAnterior > 0) {
        crecimientoVentas =
          (
            ((ventaActual - ventaAnterior) /
              ventaAnterior) *
            100
          ).toFixed(2);
      }

      let crecimientoUtilidad = 0;

      if (utilidadAnterior > 0) {
        crecimientoUtilidad =
          (
            ((utilidadActual - utilidadAnterior) /
              utilidadAnterior) *
            100
          ).toFixed(2);
      }

      res.json({
        ventas_mes_actual: ventaActual,
        ventas_mes_anterior: ventaAnterior,

        utilidad_mes_actual:
          utilidadActual,

        utilidad_mes_anterior:
          utilidadAnterior,

        crecimiento_ventas:
          Number(crecimientoVentas),

        crecimiento_utilidad:
          Number(crecimientoUtilidad),

        grafica:
          ventasMensuales.rows,
      });

    } catch (error) {
      res.status(500).json({
        mensaje:
          "Error al obtener reporte",
        error: error.message,
      });
    }
  }
);

export default router;