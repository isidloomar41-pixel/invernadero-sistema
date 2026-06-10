import express from "express";
import { pool } from "../config/db.js";
import {
  verificarToken,
  permitirRoles,
} from "../middlewares/auth.middleware.js";
import { transporter } from "../utils/email.js";

const router = express.Router();

router.get(
  "/",
  verificarToken,
  permitirRoles("jefe", "encargado", "vendedor"),
  async (req, res) => {
    try {
      const deudas = await pool.query(`
        SELECT
          pedidos.id,
          clientes.nombre AS cliente,
          clientes.correo,
          clientes.telefono,
          pedidos.total,
          pedidos.pagado,
          pedidos.restante,
          pedidos.estado,
          pedidos.fecha
        FROM pedidos
        INNER JOIN clientes
          ON pedidos.cliente_id = clientes.id
        WHERE pedidos.restante > 0
        ORDER BY pedidos.fecha DESC
      `);

      const solicitudes = await pool.query(`
        SELECT
          solicitudes_pedido.id,
          clientes.nombre AS cliente,
          clientes.correo,
          clientes.telefono,
          solicitudes_pedido.estado,
          solicitudes_pedido.fecha
        FROM solicitudes_pedido
        INNER JOIN clientes
          ON solicitudes_pedido.cliente_id = clientes.id
        WHERE solicitudes_pedido.estado = 'pendiente'
        ORDER BY solicitudes_pedido.fecha DESC
      `);

      const stockBajo = await pool.query(`
        SELECT id, nombre, stock, stock_minimo
        FROM productos
        WHERE stock <= stock_minimo
        ORDER BY stock ASC
      `);

      res.json({
        deudas: deudas.rows,
        solicitudes: solicitudes.rows,
        stockBajo: stockBajo.rows,
      });
    } catch (error) {
      res.status(500).json({
        mensaje: "Error al obtener alertas",
        error: error.message,
      });
    }
  }
);

router.post(
  "/deuda/:pedidoId/enviar",
  verificarToken,
  permitirRoles("jefe", "encargado", "vendedor"),
  async (req, res) => {
    try {
      const { pedidoId } = req.params;

      const resultado = await pool.query(
        `
        SELECT
          pedidos.id,
          clientes.nombre AS cliente,
          clientes.correo,
          pedidos.total,
          pedidos.pagado,
          pedidos.restante
        FROM pedidos
        INNER JOIN clientes
          ON pedidos.cliente_id = clientes.id
        WHERE pedidos.id = $1
        `,
        [pedidoId]
      );

      if (resultado.rows.length === 0) {
        return res.status(404).json({
          mensaje: "Pedido no encontrado",
        });
      }

      const pedido = resultado.rows[0];

      await transporter.sendMail({
        from: `"Flora Nativa" <${process.env.EMAIL_USER}>`,
        to: pedido.correo,
        subject: `Recordatorio de saldo pendiente - Pedido #${pedido.id}`,
        text: `Hola ${pedido.cliente}, te recordamos que tienes un saldo pendiente en Flora Nativa.

Pedido: #${pedido.id}
Total: $${Number(pedido.total).toFixed(2)}
Pagado: $${Number(pedido.pagado).toFixed(2)}
Saldo pendiente: $${Number(pedido.restante).toFixed(2)}

Gracias por tu preferencia.`,
      });

      await pool.query(
        `
        UPDATE pedidos
        SET ultimo_recordatorio_deuda = NOW()
        WHERE id = $1
        `,
        [pedidoId]
      );

      res.json({
        mensaje: "Recordatorio enviado correctamente",
      });
    } catch (error) {
      res.status(500).json({
        mensaje: "Error al enviar recordatorio",
        error: error.message,
      });
    }
  }
);

export default router;