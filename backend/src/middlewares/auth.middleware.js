import jwt from "jsonwebtoken";

/* =========================
   VERIFICAR TOKEN
========================= */

export function verificarToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      mensaje: "No se envió token de autenticación",
    });
  }

  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      mensaje: "Formato de token inválido",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const usuario = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    req.usuario = usuario;

    next();
  } catch (error) {
    return res.status(403).json({
      mensaje: "Token inválido o expirado",
    });
  }
}

/* =========================
   ROLES PERSONALIZADOS
========================= */

export function permitirRoles(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({
        mensaje: "Usuario no autenticado",
      });
    }

    if (
      !rolesPermitidos.includes(
        req.usuario.rol
      )
    ) {
      return res.status(403).json({
        mensaje:
          "No tienes permiso para acceder a esta sección",
      });
    }

    next();
  };
}

/* =========================
   SOLO JEFE
========================= */

export function soloJefe(
  req,
  res,
  next
) {
  if (!req.usuario) {
    return res.status(401).json({
      mensaje: "Usuario no autenticado",
    });
  }

  if (req.usuario.rol !== "jefe") {
    return res.status(403).json({
      mensaje:
        "Solo el jefe puede realizar esta acción",
    });
  }

  next();
}

/* =========================
   JEFE O ENCARGADO
========================= */

export function jefeOEncargado(
  req,
  res,
  next
) {
  if (!req.usuario) {
    return res.status(401).json({
      mensaje: "Usuario no autenticado",
    });
  }

  if (
    req.usuario.rol !== "jefe" &&
    req.usuario.rol !== "encargado"
  ) {
    return res.status(403).json({
      mensaje:
        "Acceso restringido a jefe y encargado",
    });
  }

  next();
}