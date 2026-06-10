import Swal from "sweetalert2";

export const alertaExito = (mensaje) => {
  return Swal.fire({
    icon: "success",
    title: "Éxito",
    text: mensaje,
    confirmButtonText: "Aceptar",
  });
};

export const alertaError = (mensaje) => {
  return Swal.fire({
    icon: "error",
    title: "Error",
    text: mensaje,
    confirmButtonText: "Aceptar",
  });
};

export const alertaAdvertencia = (mensaje) => {
  return Swal.fire({
    icon: "warning",
    title: "Atención",
    text: mensaje,
    confirmButtonText: "Aceptar",
  });
};

export const alertaInfo = (mensaje) => {
  return Swal.fire({
    icon: "info",
    title: "Información",
    text: mensaje,
    confirmButtonText: "Aceptar",
  });
};

export const confirmarEliminacion = async (
  titulo = "¿Deseas eliminar este registro?"
) => {
  const resultado = await Swal.fire({
    title: titulo,
    text: "Esta acción no se puede deshacer",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d32f2f",
    cancelButtonColor: "#1976d2",
    confirmButtonText: "Sí, eliminar",
    cancelButtonText: "Cancelar",
  });

  return resultado.isConfirmed;
};