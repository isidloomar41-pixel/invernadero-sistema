import express from "express";
import { pool } from "../config/db.js";
import { verificarToken } from "../middlewares/auth.middleware.js";
import { transporter } from "../utils/email.js";
import { generarPDFNotaBuffer } from "../utils/notaPDF.js";

const router = express.Router();

router.get("/", verificarToken, async (req, res) => {
  try {
    const resultado = await pool.query(`
      SELECT
        pedidos.id,
        pedidos.cliente_id,
        clientes.nombre AS cliente,
        clientes.tipo_cliente,
        pedidos.total,
        pedidos.pagado,
        pedidos.restante,
        pedidos.tipo_pago,
        pedidos.medio_pago,
        pedidos.estado,
        pedidos.fecha
      FROM pedidos
      INNER JOIN clientes
        ON pedidos.cliente_id = clientes.id
      ORDER BY pedidos.id DESC
    `);

    res.json(resultado.rows);
  } catch (error) {
    res.status(500).json({
      mensaje: "Error al obtener pedidos",
      error: error.message,
    });
  }
});

router.post("/", verificarToken, async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const {
      cliente_id,
      productos,
      medio_pago,
      pagado,
      tipo_pago,
    } = req.body;

    if (!cliente_id || !productos || productos.length === 0) {
      throw new Error("Debes seleccionar un cliente y al menos un producto");
    }

    const clienteResultado = await client.query(
      `
      SELECT *
      FROM clientes
      WHERE id = $1
      `,
      [cliente_id]
    );

    const cliente = clienteResultado.rows[0];

    if (!cliente) {
      throw new Error("Cliente no encontrado");
    }

    let total = 0;

    for (const item of productos) {
      const productoResultado = await client.query(
        `
        SELECT *
        FROM productos
        WHERE id = $1
        `,
        [item.producto_id]
      );

      const producto = productoResultado.rows[0];

      if (!producto) {
        throw new Error("Producto no encontrado");
      }

      if (Number(producto.stock) < Number(item.cantidad)) {
        throw new Error(`No hay suficiente stock de ${producto.nombre}`);
      }

      const precioNormal = Number(producto.precio) * Number(item.cantidad);
      const descuento = Number(item.cantidad) >= 30 ? precioNormal * 0.1 : 0;
      const subtotal = precioNormal - descuento;

      total += subtotal;
    }

    const cantidadPagada = Number(pagado) || 0;
    const restante = Math.max(total - cantidadPagada, 0);

    const comprasResultado = await client.query(
      `
      SELECT COUNT(*) AS total_compras
      FROM pedidos
      WHERE cliente_id = $1
      AND estado = 'entregado'
      `,
      [cliente_id]
    );

    const comprasCliente = Number(comprasResultado.rows[0].total_compras);
    const esFrecuente = comprasCliente >= 20;
    const esMayorista = cliente.tipo_cliente === "mayorista";
    const puedeTenerDeuda = esMayorista || esFrecuente;

    if (restante > 0 && !puedeTenerDeuda) {
      throw new Error(
        "Los clientes minoristas no pueden quedar con deuda. Deben pagar el total del pedido."
      );
    }

    if (tipo_pago === "fiado" && !puedeTenerDeuda) {
      throw new Error(
        "Solo clientes mayoristas o frecuentes pueden comprar fiado."
      );
    }

    if (tipo_pago === "apartado") {
      const minimoApartado = total * 0.5;

      if (cantidadPagada < minimoApartado) {
        throw new Error(
          `Para apartado debe pagar mínimo el 50% del pedido ($${minimoApartado.toFixed(
            2
          )})`
        );
      }
    }

    let estado = "pendiente";
    let tipoPagoFinal = tipo_pago || "completo";

    if (restante > 0) {
      estado = tipoPagoFinal === "fiado" ? "fiado" : "apartado";
    } else {
      estado = "entregado";
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
        cliente_id,
        req.usuario.id,
        total,
        cantidadPagada,
        restante,
        tipoPagoFinal,
        medio_pago || "efectivo",
        estado,
      ]
    );

    const pedido_id = pedidoResultado.rows[0].id;
    const productosNota = [];

    for (const item of productos) {
      const productoResultado = await client.query(
        `
        SELECT *
        FROM productos
        WHERE id = $1
        `,
        [item.producto_id]
      );

      const producto = productoResultado.rows[0];

      const precioNormal = Number(producto.precio) * Number(item.cantidad);
      const descuento = Number(item.cantidad) >= 30 ? precioNormal * 0.1 : 0;
      const subtotal = precioNormal - descuento;
      const costoTotal = Number(producto.costo) * Number(item.cantidad);
      const ganancia = subtotal - costoTotal;

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
          producto.precio,
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
        [item.cantidad, item.producto_id]
      );

      productosNota.push({
        nombre: producto.nombre,
        cantidad: item.cantidad,
        precio_unitario: producto.precio,
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
      [restante, cliente_id]
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
        cliente_id,
        "Nota generada automáticamente",
        total,
      ]
    );

    const nota_id = notaResultado.rows[0].id;

    const notaResultadoDB = await client.query(
      `
      SELECT *
      FROM notas
      WHERE id = $1
      `,
      [nota_id]
    );

    const nota = notaResultadoDB.rows[0];

    const pedido = {
      id: pedido_id,
      total,
      pagado: cantidadPagada,
      restante,
      tipo_pago: tipoPagoFinal,
      medio_pago: medio_pago || "efectivo",
      estado,
    };

    const pdfBuffer = await generarPDFNotaBuffer({
  nota,
  cliente,
  productos: productosNota,
  pedido,
});

// GUARDAR TODO PRIMERO
await client.query("COMMIT");

// INTENTAR ENVIAR CORREO SIN AFECTAR EL PEDIDO
try {
  if (cliente.correo) {
    await transporter.sendMail({
      from: `"Flora Nativa" <${process.env.EMAIL_USER}>`,
      to: cliente.correo,
      subject: `Nota de compra #${nota_id}`,
      text: `Gracias por tu compra. Se adjunta tu nota de compra en PDF.`,
      attachments: [
        {
          filename: `nota-${nota_id}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });

    console.log(
      `📧 Correo enviado correctamente a ${cliente.correo}`
    );
  }
} catch (errorCorreo) {
  console.error(
    "❌ Error enviando correo:",
    errorCorreo.message
  );
}

    res.json({
      mensaje: "Pedido creado correctamente",
      pedido_id,
      nota_id,
      total,
      pagado: cantidadPagada,
      restante,
      estado,
      comprasCliente,
      esFrecuente,
      esMayorista,
    });
  } catch (error) {
    await client.query("ROLLBACK");

    res.status(500).json({
      mensaje: "Error al crear pedido",
      error: error.message,
    });
  } finally {
    client.release();
  }
});

router.put("/:id/abonar", verificarToken, async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { id } = req.params;
    const { cantidad } = req.body;

    const abono = Number(cantidad) || 0;

    if (abono <= 0) {
      throw new Error("La cantidad del abono debe ser mayor a 0");
    }

    const pedidoResultado = await client.query(
      `
      SELECT *
      FROM pedidos
      WHERE id = $1
      `,
      [id]
    );

    const pedido = pedidoResultado.rows[0];

    if (!pedido) {
      throw new Error("Pedido no encontrado");
    }

    const nuevoPagado = Number(pedido.pagado) + abono;

    const nuevoRestante = Math.max(
      Number(pedido.total) - nuevoPagado,
      0
    );

    const nuevoEstado =
      nuevoRestante > 0 ? pedido.estado : "entregado";

    const nuevoTipoPago =
      nuevoRestante > 0 ? pedido.tipo_pago : "completo";

    await client.query(
      `
      UPDATE pedidos
      SET
        pagado = $1,
        restante = $2,
        estado = $3,
        tipo_pago = $4
      WHERE id = $5
      `,
      [
        nuevoPagado,
        nuevoRestante,
        nuevoEstado,
        nuevoTipoPago,
        id,
      ]
    );

    await client.query(
      `
      UPDATE clientes
      SET deuda_total = GREATEST(deuda_total - $1, 0)
      WHERE id = $2
      `,
      [abono, pedido.cliente_id]
    );

    await client.query("COMMIT");

    res.json({
      mensaje: "Abono registrado correctamente",
      pagado: nuevoPagado,
      restante: nuevoRestante,
      estado: nuevoEstado,
    });
  } catch (error) {
    await client.query("ROLLBACK");

    res.status(500).json({
      mensaje: "Error al registrar abono",
      error: error.message,
    });
  } finally {
    client.release();
  }
});

export default router;