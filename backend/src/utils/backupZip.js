import AdmZip from "adm-zip";

export function protegerBackup(
  archivoOrigen,
  archivoDestino
) {

  const zip = new AdmZip();

  zip.addLocalFile(archivoOrigen);

  zip.setPassword("FloraNativa2026");

  zip.writeZip(archivoDestino);
}