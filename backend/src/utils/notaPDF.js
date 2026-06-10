import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

function dinero(valor) {
  return Number(valor || 0).toFixed(2);
}

export function generarPDFNotaBuffer({ nota, cliente, productos, pedido }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: 35,
    });

    const buffers = [];

    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", reject);

    const logoPath = path.resolve("src/assets/logo.jpeg");

    doc.rect(0, 0, doc.page.width, doc.page.height).fill("#FFFFFF");

    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 390, 20, {
        width: 130,
      });
    }

    doc.fillColor("#55624B");
    doc.fontSize(20).text("NOTA DE VENTA", 55, 80, {
      characterSpacing: 4,
    });

    doc.moveTo(55, 112).lineTo(245, 112).strokeColor("#C7A38C").stroke();

    doc.fillColor("#000000");
    doc.fontSize(11);

    let y = 145;

    doc.text(`Nota No: ${nota.id}`, 70, y);
    doc.text(`Pedido No: ${nota.pedido_id}`, 70, y + 28);
    doc.text(`Fecha: ${new Date(nota.fecha).toLocaleString()}`, 70, y + 56);
    doc.text(`Estado: ${pedido.estado}`, 70, y + 84);
    doc.text(`Tipo de pago: ${pedido.tipo_pago}`, 70, y + 112);
    doc.text(`Medio de pago: ${pedido.medio_pago}`, 70, y + 140);

    doc.fillColor("#55624B");
    doc.fontSize(14).text("DATOS DEL CLIENTE", 330, y + 35);
    doc.moveTo(330, y + 58).lineTo(535, y + 58).strokeColor("#C7A38C").stroke();

    doc.fillColor("#000000");
    doc.fontSize(11);
    doc.text(`Nombre: ${cliente.nombre}`, 330, y + 85);
    doc.text(`Correo: ${cliente.correo}`, 330, y + 113);
    doc.text(`Teléfono: ${cliente.telefono}`, 330, y + 141);
    doc.text(`Dirección: ${cliente.direccion || "Sin dirección"}`, 330, y + 169);

    y = 365;

    doc.moveTo(55, y - 20).lineTo(535, y - 20).strokeColor("#C7A38C").stroke();

    doc.fillColor("#55624B");
    doc.fontSize(15).text("PRODUCTOS", 70, y, {
      characterSpacing: 3,
    });

    y += 35;

    doc.roundedRect(55, y, 480, 30, 4).fill("#56624A");

    doc.fillColor("#FFFFFF");
    doc.fontSize(10);
    doc.text("PRODUCTO", 75, y + 10);
    doc.text("CANTIDAD", 230, y + 10);
    doc.text("PRECIO", 320, y + 10);
    doc.text("DESCUENTO", 390, y + 10);
    doc.text("SUBTOTAL", 475, y + 10);

    y += 45;

    doc.fillColor("#000000");

    productos.forEach((producto, index) => {
      if (y > 560) return;

      doc.fontSize(10);
      doc.text(`${index + 1}. ${producto.nombre}`, 75, y);
      doc.text(String(producto.cantidad), 250, y);
      doc.text(`$${dinero(producto.precio_unitario)}`, 320, y);
      doc.text(`$${dinero(producto.descuento)}`, 405, y);
      doc.text(`$${dinero(producto.subtotal)}`, 485, y);

      y += 25;
    });

    doc.moveTo(55, y).lineTo(535, y).strokeColor("#D5C4B8").stroke();

    y += 25;

    doc.roundedRect(300, y, 235, 120, 12)
      .strokeColor("#D4A38E")
      .fillAndStroke("#FFFFFF", "#D4A38E");

    doc.fillColor("#55624B");
    doc.fontSize(15).text("TOTAL:", 325, y + 22);
    doc.text("PAGADO:", 325, y + 55);

    doc.moveTo(325, y + 82).lineTo(500, y + 82).dash(3, { space: 3 }).strokeColor("#D4A38E").stroke();
    doc.undash();

    doc.fillColor("#B4583F");
    doc.text("RESTANTE:", 325, y + 92);

    doc.fillColor("#000000");
    doc.text(`$${dinero(pedido.total)}`, 455, y + 22);
    doc.text(`$${dinero(pedido.pagado)}`, 455, y + 55);

    doc.fillColor("#B4583F");
    doc.text(`$${dinero(pedido.restante)}`, 455, y + 92);

    y += 150;

    doc.fillColor("#000000");
    doc.fontSize(11);

    if (Number(pedido.restante) > 0) {
      doc.text(
        `Saldo pendiente: $${dinero(pedido.restante)}. Este pedido queda como ${pedido.estado}.`,
        80,
        y,
        { width: 450, align: "center" }
      );
    } else {
      doc.text("Pedido liquidado.", 80, y, {
        width: 450,
        align: "center",
      });
    }

    y += 45;

    doc.moveTo(100, y).lineTo(495, y).dash(3, { space: 3 }).strokeColor("#D4A38E").stroke();
    doc.undash();

    doc.fillColor("#5A4A42");
    doc.fontSize(24).text("Gracias por su compra", 0, y + 15, {
      align: "center",
    });

    doc.fillColor("#55624B");
    doc.fontSize(10).text("Cultivamos naturaleza, creamos vida.", 0, 805, {
      align: "center",
    });

    doc.end();
  });
}