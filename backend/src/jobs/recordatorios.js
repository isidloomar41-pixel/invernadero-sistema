import cron from "node-cron";
import { pool } from "../config/db.js";
import { transporter } from "../utils/email.js";

export function iniciarRecordatoriosAutomaticos() {
  console.log("Job de recordatorios iniciado");

  cron.schedule("14 23 * * *", async () => {
    console.log("Revisando recordatorios automáticos...");

    try {
      const [pedidos] = await pool.query(`
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
        WHERE pedidos.restante > 0
        AND (
          pedidos.ultimo_recordatorio_deuda IS NULL
          OR DATE(pedidos.ultimo_recordatorio_deuda) < CURDATE()
        )
      `);

      console.log("Pedidos encontrados:", pedidos.length);

      for (const pedido of pedidos) {
        console.log("Enviando correo a:", pedido.correo);

        await transporter.sendMail({
          from: `"Flora Nativa" <${process.env.EMAIL_USER}>`,
          to: pedido.correo,
          subject: `Recordatorio de saldo pendiente - Pedido #${pedido.id}`,
          text: `
Hola ${pedido.cliente},

Te recordamos que tienes un saldo pendiente en Flora Nativa.

Pedido: #${pedido.id}
Total: $${Number(pedido.total).toFixed(2)}
Pagado: $${Number(pedido.pagado).toFixed(2)}
Saldo pendiente: $${Number(pedido.restante).toFixed(2)}

Gracias por tu preferencia.
          `,
        });

        await pool.query(
          `
          UPDATE pedidos
          SET ultimo_recordatorio_deuda = NOW()
          WHERE id = ?
          `,
          [pedido.id]
        );

        console.log("Correo enviado correctamente");
      }
    } catch (error) {
      console.error("Error en recordatorios:", error.message);
    }
  });
}