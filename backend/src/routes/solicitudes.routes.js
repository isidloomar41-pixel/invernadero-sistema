import express from "express";
import { pool } from "../config/db.js";
import {
  verificarToken,
  permitirRoles,
} from "../middlewares/auth.middleware.js";
import { transporter } from "../utils/email.js";
import { generarPDFNotaBuffer } from "../utils/notaPDF.js";

const router = express.Router();

/* CLIENTE CREA SOLICITUD */
router.post(
  "/",
  verificarToken,
  permitirRoles("cliente"),
  async (req, res) => {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const { productos, observaciones } = req.body;

      if (!productos || productos.length === 0) {
        throw new Error(
          "Debes agregar al menos un producto"
        );
      }

      const clienteResultado = await client.query(
        `
        SELECT *
        FROM clientes
        WHERE correo = $1
        `,
        [req.usuario.correo]
      );

      if (clienteResultado.rows.length === 0) {
        throw new Error("Cliente no encontrado");
      }

      const cliente_id = clienteResultado.rows[0].id;

      const solicitudResultado = await client.query(
        `
        INSERT INTO solicitudes_pedido
        (cliente_id, observaciones)
        VALUES ($1, $2)
        RETURNING id
        `,
        [cliente_id, observaciones || ""]
      );

      const solicitud_id =
        solicitudResultado.rows[0].id;

      for (const item of productos) {
        await client.query(
          `
          INSERT INTO detalle_solicitud_pedido
          (
            solicitud_id,
            producto_id,
            cantidad
          )
          VALUES ($1, $2, $3)
          `,
          [
            solicitud_id,
            item.producto_id,
            item.cantidad,
          ]
        );
      }

      await client.query("COMMIT");

      res.json({
        mensaje: "Solicitud enviada correctamente",
        solicitud_id,
      });
    } catch (error) {
      await client.query("ROLLBACK");

      res.status(500).json({
        mensaje: "Error al crear solicitud",
        error: error.message,
      });
    } finally {
      client.release();
    }
  }
);

/* VER SOLICITUDES */
router.get(
  "/",
  verificarToken,
  permitirRoles("jefe", "encargado", "vendedor"),
  async (req, res) => {
    try {
      const resultado = await pool.query(`
        SELECT
          solicitudes_pedido.id,
          solicitudes_pedido.estado,
          solicitudes_pedido.observaciones,
          solicitudes_pedido.fecha,
          solicitudes_pedido.cliente_id,
          clientes.nombre AS cliente,
          clientes.correo,
          clientes.telefono,
          clientes.direccion
        FROM solicitudes_pedido
        INNER JOIN clientes
        ON solicitudes_pedido.cliente_id = clientes.id
        ORDER BY solicitudes_pedido.id DESC
      `);

      res.json(resultado.rows);
    } catch (error) {
      res.status(500).json({
        mensaje: "Error al obtener solicitudes",
        error: error.message,
      });
    }
  }
);

/* DETALLE SOLICITUD */
router.get(
  "/:id",
  verificarToken,
  permitirRoles("jefe", "encargado", "vendedor"),
  async (req, res) => {
    try {
      const { id } = req.params;

      const resultado = await pool.query(
        `
        SELECT
          detalle_solicitud_pedido.id,
          detalle_solicitud_pedido.producto_id,
          productos.nombre,
          productos.precio,
          productos.stock,
          detalle_solicitud_pedido.cantidad
        FROM detalle_solicitud_pedido
        INNER JOIN productos
        ON detalle_solicitud_pedido.producto_id = productos.id
        WHERE detalle_solicitud_pedido.solicitud_id = $1
        `,
        [id]
      );

      res.json(resultado.rows);
    } catch (error) {
      res.status(500).json({
        mensaje: "Error al obtener detalle",
        error: error.message,
      });
    }
  }
);

/* AUTORIZAR */
router.put(
  "/:id/autorizar",
  verificarToken,
  permitirRoles("jefe", "encargado", "vendedor"),
  async (req, res) => {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const { id } = req.params;

      const {
        medio_pago = "efectivo",
        tipo_pago = "completo",
        pagado = 0,
      } = req.body;

      const solicitudResultado = await client.query(
        `
        SELECT
          solicitudes_pedido.*,
          clientes.nombre,
          clientes.correo,
          clientes.telefono,
          clientes.direccion
        FROM solicitudes_pedido
        INNER JOIN clientes
        ON solicitudes_pedido.cliente_id = clientes.id
        WHERE solicitudes_pedido.id = $1
        `,
        [id]
      );

      if (solicitudResultado.rows.length === 0) {
        throw new Error("Solicitud no encontrada");
      }

      const solicitud =
        solicitudResultado.rows[0];

      if (solicitud.estado !== "pendiente") {
        throw new Error(
          "Esta solicitud ya fue procesada"
        );
      }

      const detalleResultado = await client.query(
        `
        SELECT
          detalle_solicitud_pedido.producto_id,
          detalle_solicitud_pedido.cantidad,
          productos.nombre,
          productos.precio,
          productos.costo,
          productos.stock
        FROM detalle_solicitud_pedido
        INNER JOIN productos
        ON detalle_solicitud_pedido.producto_id = productos.id
        WHERE detalle_solicitud_pedido.solicitud_id = $1
        `,
        [id]
      );

      const detalle = detalleResultado.rows;

      let total = 0;

      for (const item of detalle) {
        if (
          Number(item.stock) <
          Number(item.cantidad)
        ) {
          throw new Error(
            `No hay suficiente stock de ${item.nombre}`
          );
        }

        const precioNormal =
          Number(item.precio) *
          Number(item.cantidad);

        const descuento =
          Number(item.cantidad) >= 30
            ? precioNormal * 0.1
            : 0;

        total += precioNormal - descuento;
      }

      const cantidadPagada =
        Number(pagado) || 0;

      const restante = Math.max(
        total - cantidadPagada,
        0
      );

      let estadoPedido = "entregado";
      let tipoPagoFinal = tipo_pago;

      if (restante > 0) {
        estadoPedido =
          tipoPagoFinal === "fiado"
            ? "fiado"
            : "apartado";
      } else {
        tipoPagoFinal = "completo";
      }

      const pedidoResultado = await client.query(
        `
        INSERT INTO pedidos
        (
          cliente_id,
          usuario_id,
          total,
          pagado,
          restante,
          tipo_pago,
          medio_pago,
          estado
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        RETURNING id
        `,
        [
          solicitud.cliente_id,
          req.usuario.id,
          total,
          cantidadPagada,
          restante,
          tipoPagoFinal,
          medio_pago,
          estadoPedido,
        ]
      );

      const pedido_id =
        pedidoResultado.rows[0].id;

      const productosNota = [];

      for (const item of detalle) {
        const precioNormal =
          Number(item.precio) *
          Number(item.cantidad);

        const descuento =
          Number(item.cantidad) >= 30
            ? precioNormal * 0.1
            : 0;

        const subtotal =
          precioNormal - descuento;

        const costoTotal =
          Number(item.costo) *
          Number(item.cantidad);

        const ganancia =
          subtotal - costoTotal;

        await client.query(
          `
          INSERT INTO detalle_pedido
          (
            pedido_id,
            producto_id,
            cantidad,
            precio_unitario,
            subtotal,
            descuento,
            ganancia
          )
          VALUES ($1,$2,$3,$4,$5,$6,$7)
          `,
          [
            pedido_id,
            item.producto_id,
            item.cantidad,
            item.precio,
            subtotal,
            descuento,
            ganancia,
          ]
        );

        await client.query(
          `
          UPDATE productos
          SET stock = stock - $1
          WHERE id = $2
          `,
          [
            item.cantidad,
            item.producto_id,
          ]
        );

        productosNota.push({
          nombre: item.nombre,
          cantidad: item.cantidad,
          precio_unitario: item.precio,
          descuento,
          subtotal,
        });
      }

      await client.query(
        `
        UPDATE clientes
        SET
          deuda_total = deuda_total + $1,
          ultima_compra = NOW()
        WHERE id = $2
        `,
        [
          restante,
          solicitud.cliente_id,
        ]
      );

      const notaResultado = await client.query(
        `
        INSERT INTO notas
        (
          pedido_id,
          cliente_id,
          contenido,
          total
        )
        VALUES ($1,$2,$3,$4)
        RETURNING id
        `,
        [
          pedido_id,
          solicitud.cliente_id,
          "Nota generada desde solicitud autorizada",
          total,
        ]
      );

      const nota_id =
        notaResultado.rows[0].id;

      await client.query(
        `
        UPDATE solicitudes_pedido
        SET estado = 'autorizado'
        WHERE id = $1
        `,
        [id]
      );

      const notaDB = await client.query(
        `
        SELECT *
        FROM notas
        WHERE id = $1
        `,
        [nota_id]
      );

      const nota = notaDB.rows[0];

      const cliente = {
        nombre: solicitud.nombre,
        correo: solicitud.correo,
        telefono: solicitud.telefono,
        direccion: solicitud.direccion,
      };

      const pedido = {
        id: pedido_id,
        total,
        pagado: cantidadPagada,
        restante,
        tipo_pago: tipoPagoFinal,
        medio_pago,
        estado: estadoPedido,
      };

      const pdfBuffer =
        await generarPDFNotaBuffer({
          nota,
          cliente,
          productos: productosNota,
          pedido,
        });

      if (solicitud.correo) {
        await transporter.sendMail({
          from: `"Flora Nativa" <${process.env.EMAIL_USER}>`,
          to: solicitud.correo,
          subject: `Nota de compra #${nota_id}`,
          text: `Tu solicitud fue autorizada`,
          attachments: [
            {
              filename: `nota-${nota_id}.pdf`,
              content: pdfBuffer,
              contentType: "application/pdf",
            },
          ],
        });
      }

      await client.query("COMMIT");

      res.json({
        mensaje:
          "Solicitud autorizada correctamente",
        pedido_id,
        nota_id,
      });
    } catch (error) {
      await client.query("ROLLBACK");

      res.status(500).json({
        mensaje:
          "Error al autorizar solicitud",
        error: error.message,
      });
    } finally {
      client.release();
    }
  }
);

/* RECHAZAR */
router.put(
  "/:id/rechazar",
  verificarToken,
  permitirRoles("jefe", "encargado", "vendedor"),
  async (req, res) => {
    try {
      const { id } = req.params;

      await pool.query(
        `
        UPDATE solicitudes_pedido
        SET estado = 'rechazado'
        WHERE id = $1
        `,
        [id]
      );

      res.json({
        mensaje: "Solicitud rechazada",
      });
    } catch (error) {
      res.status(500).json({
        mensaje: "Error al rechazar solicitud",
        error: error.message,
      });
    }
  }
);

export default router;