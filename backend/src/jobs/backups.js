import cron from "node-cron";
import { exec } from "child_process";
import path from "path";

const carpetaBackups = "backups";

cron.schedule("0 0 */15 * *", () => {

  const fecha = new Date()
    .toISOString()
    .split("T")[0];

  const archivo = `${carpetaBackups}/flora_nativa_${fecha}.sql`;

  const comando = `
  mysqldump
  -u root
  -pTU_PASSWORD
  invernadero_db
  > ${archivo}
  `;

  exec(comando, (error) => {

    if (error) {
      console.log("Error respaldo");
      return;
    }

    console.log("Respaldo generado");
  });
});