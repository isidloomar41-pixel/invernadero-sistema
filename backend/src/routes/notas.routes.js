import express from "express";
import { pool } from "../config/db.js";
import { verificarToken } from "../middlewares/auth.middleware.js";
import { generarPDFNotaBuffer } from "../utils/notaPDF.js";

const router = express.Router();

router.get("/", verificarToken, async (req, res) => {
  try {
    let query = `
      SELECT 
        notas.id,
        notas.pedido_id,
        clientes.nombre AS cliente,
        clientes.correo,
        clientes.telefono,
        pedidos.total,
        pedidos.pagado,
        pedidos.restante,
        pedidos.estado,
        pedidos.tipo_pago,
        pedidos.medio_pago,
        notas.fecha
      FROM notas
      INNER JOIN clientes
        ON notas.cliente_id = clientes.id
      INNER JOIN pedidos
        ON notas.pedido_id = pedidos.id
    `;

    const params = [];

    if (req.usuario.rol === "cliente") {
      query += " WHERE clientes.correo = $1";
      params.push(req.usuario.correo);
    }

    query += " ORDER BY notas.id DESC";

    const resultado = await pool.query(query, params);

    res.json(resultado.rows);
  } catch (error) {
    res.status(500).json({
      mensaje: "Error al obtener notas",
      error: error.message,
    });
  }
});

router.get("/:id/pdf", verificarToken, async (req, res) => {
  try {
    const { id } = req.params;

    let query = `
      SELECT 
        notas.id,
        notas.pedido_id,
        notas.fecha,
        clientes.nombre AS cliente,
        clientes.correo,
        clientes.telefono,
        clientes.direccion,
        pedidos.total,
        pedidos.pagado,
        pedidos.restante,
        pedidos.estado,
        pedidos.tipo_pago,
        pedidos.medio_pago
      FROM notas
      INNER JOIN clientes
        ON notas.cliente_id = clientes.id
      INNER JOIN pedidos
        ON notas.pedido_id = pedidos.id
      WHERE notas.id = $1
    `;

    const params = [id];

    if (req.usuario.rol === "cliente") {
      query += " AND clientes.correo = $2";
      params.push(req.usuario.correo);
    }

    const notaResultado = await pool.query(query, params);

    if (notaResultado.rows.length === 0) {
      return res.status(404).json({
        mensaje: "Nota no encontrada",
      });
    }

    const nota = notaResultado.rows[0];

    const productosResultado = await pool.query(
      `
      SELECT 
        productos.nombre,
        detalle_pedido.cantidad,
        detalle_pedido.precio_unitario,
        detalle_pedido.subtotal,
        detalle_pedido.descuento
      FROM detalle_pedido
      INNER JOIN productos
        ON detalle_pedido.producto_id = productos.id
      WHERE detalle_pedido.pedido_id = $1
      `,
      [nota.pedido_id]
    );

    const productos = productosResultado.rows;

    const cliente = {
      nombre: nota.cliente,
      correo: nota.correo,
      telefono: nota.telefono,
      direccion: nota.direccion,
    };

    const pedido = {
      total: nota.total,
      pagado: nota.pagado,
      restante: nota.restante,
      estado: nota.estado,
      tipo_pago: nota.tipo_pago,
      medio_pago: nota.medio_pago,
    };

    const pdfBuffer = await generarPDFNotaBuffer({
      nota,
      cliente,
      productos,
      pedido,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename=nota-${nota.id}.pdf`
    );

    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({
      mensaje: "Error al generar PDF",
      error: error.message,
    });
  }
});

export default router;