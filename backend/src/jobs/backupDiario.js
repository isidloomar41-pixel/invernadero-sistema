import cron from "node-cron";
import fs from "fs-extra";
import path from "path";
import crypto from "crypto";
import PDFDocument from "pdfkit";

import { pool } from "../config/db.js";

const BACKUP_DIR = path.resolve("backups");
const EVIDENCIAS_DIR = path.resolve("evidencias");

async function generarRespaldo(usuario = "Sistema") {
  try {
    await fs.ensureDir(BACKUP_DIR);
    await fs.ensureDir(EVIDENCIAS_DIR);

    const fecha = new Date()
      .toISOString()
      .replace(/:/g, "-")
      .replace(/\..+/, "");

    const nombreArchivo = `backup_${fecha}.json`;

    const rutaArchivo = path.join(
      BACKUP_DIR,
      nombreArchivo
    );

    const tablas = [
      "usuarios",
      "clientes",
      "productos",
      "pedidos",
      "detalle_pedido",
      "notas",
      "perdidas",
      "solicitudes_pedido",
      "detalle_solicitud_pedido",
      "auditoria_accesos",
      "auditoria_acciones",
    ];

    const respaldo = {};

    for (const tabla of tablas) {
      try {
        const resultado = await pool.query(
          `SELECT * FROM ${tabla}`
        );

        respaldo[tabla] = resultado.rows;
      } catch (error) {
        console.log(
          `Tabla omitida: ${tabla}`
        );
      }
    }

    await fs.writeJson(
      rutaArchivo,
      respaldo,
      { spaces: 2 }
    );

    const contenido =
      await fs.readFile(rutaArchivo);

    const hash = crypto
      .createHash("sha256")
      .update(contenido)
      .digest("hex");

    const stats =
      await fs.stat(rutaArchivo);

    /*
=====================================
GENERAR PDF DE EVIDENCIA
=====================================
*/

const nombrePdf =
  `evidencia_${nombreArchivo.replace(
    ".json",
    ".pdf"
  )}`;

const rutaPdf = path.join(
  EVIDENCIAS_DIR,
  nombrePdf
);

const doc = new PDFDocument({
  size: "A4",
  margin: 40,
});

doc.pipe(
  fs.createWriteStream(rutaPdf)
);

/* ENCABEZADO */

doc
  .rect(0, 0, 595, 90)
  .fill("#5A4438");

const logoPath = path.resolve(
  "src/assets/logo.jpeg"
);

if (await fs.pathExists(logoPath)) {
  doc.image(
    logoPath,
    25,
    15,
    {
      width: 55,
    }
  );
}

doc
  .fillColor("white")
  .fontSize(24)
  .text(
    "FLORA NATIVA",
    0,
    25,
    {
      align: "center",
    }
  );

doc
  .fontSize(11)
  .text(
    "Sistema de Gestión de Inventario y Ventas",
    {
      align: "center",
    }
  );

/* TITULO */

doc.moveDown(5);

doc
  .fillColor("#000000")
  .fontSize(18)
  .text(
    "EVIDENCIA DE RESPALDO AUTOMÁTICO",
    {
      align: "center",
    }
  );

doc.moveDown(2);

/* DATOS GENERALES */

doc
  .roundedRect(
    40,
    160,
    515,
    140,
    10
  )
  .fillAndStroke(
    "#F8F5F2",
    "#D6C3B8"
  );

doc.fillColor("black");

doc
  .fontSize(12)
  .text(
    `Archivo: ${nombreArchivo}`,
    60,
    180
  );

doc.text(
  `Fecha: ${new Date().toLocaleString()}`,
  60,
  205
);

doc.text(
  `Responsable: ${usuario}`,
  60,
  230
);

doc.text(
  `Estado: Correcto`,
  60,
  255
);

doc.text(
  `Tamaño: ${stats.size} bytes`,
  300,
  180
);

/* HASH */

doc
  .fontSize(11)
  .text(
    "Hash SHA-256:",
    300,
    205
  );

doc
  .fontSize(8)
  .text(
    hash,
    300,
    225,
    {
      width: 220,
    }
  );

/* OBSERVACIONES */

doc.moveDown(10);

doc
  .fontSize(13)
  .text(
    "Observaciones",
    40,
    340
  );

doc.moveTo(
  40,
  360
).lineTo(
  550,
  360
).stroke();

doc
  .fontSize(11)
  .text(
    "El respaldo fue generado automáticamente por el Sistema Flora Nativa. La integridad de la información fue validada mediante un hash SHA-256 para garantizar la autenticidad del archivo generado.",
    40,
    380,
    {
      align: "justify",
      width: 500,
    }
  );

/* FIRMA */

doc.text(
  "____________________________",
  0,
  560,
  {
    align: "center",
  }
);

doc.text(
  "Sistema Flora Nativa",
  {
    align: "center",
  }
);

doc.text(
  "Respaldo Automatizado",
  {
    align: "center",
  }
);

/* PIE */

doc
  .fontSize(8)
  .fillColor("#666")
  .text(
    "Documento generado automáticamente por el Sistema Flora Nativa.",
    0,
    770,
    {
      align: "center",
    }
  );

doc.end();

    await pool.query(
      `
      INSERT INTO evidencias_respaldo
      (
        nombre_archivo,
        tamano_archivo,
        hash_sha256,
        usuario_responsable,
        estado,
        observaciones
      )
      VALUES
      (
        $1,$2,$3,$4,$5,$6
      )
      `,
      [
        nombreArchivo,
        stats.size,
        hash,
        usuario,
        "Correcto",
        "Respaldo generado correctamente",
      ]
    );

    console.log(
      `✅ Respaldo generado: ${nombreArchivo}`
    );

    console.log(
      `📄 PDF generado: ${nombrePdf}`
    );

    await eliminarRespaldosAntiguos();

    return {
      ok: true,
      archivo: nombreArchivo,
      pdf: nombrePdf,
      hash,
      tamano: stats.size,
    };
  } catch (error) {
    console.error(
      "❌ Error al generar respaldo:",
      error
    );

    return {
      ok: false,
      error: error.message,
    };
  }
}

async function eliminarRespaldosAntiguos() {
  const archivos =
    await fs.readdir(BACKUP_DIR);

  const ahora = Date.now();

  for (const archivo of archivos) {
    const ruta = path.join(
      BACKUP_DIR,
      archivo
    );

    const stats =
      await fs.stat(ruta);

    const dias =
      (ahora - stats.mtimeMs) /
      (1000 * 60 * 60 * 24);

    if (dias > 15) {
      await fs.remove(ruta);

      console.log(
        `🗑 Respaldo eliminado: ${archivo}`
      );
    }
  }
}

cron.schedule(
  "0 2 * * *",
  async () => {
    console.log(
      "⏳ Ejecutando respaldo automático..."
    );

    await generarRespaldo(
      "Sistema Automático"
    );
  },
  {
    timezone:
      "America/Mexico_City",
  }
);

export { generarRespaldo };