import express from "express";
import jwt from "jsonwebtoken";
import { pool } from "../config/db.js";

const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    const { correo, password } = req.body;

    const resultado = await pool.query(
      `
      SELECT id, nombre, correo, rol, telefono, activo
      FROM usuarios
      WHERE correo = $1
      AND password = $2
      AND activo = 1
      `,
      [correo, password]
    );

    const usuarios = resultado.rows;

    if (usuarios.length === 0) {
      return res.status(401).json({
        mensaje: "Correo o contraseña incorrectos",
      });
    }

    const usuario = usuarios[0];

    const token = jwt.sign(
      {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol: usuario.rol,
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({
      mensaje: "Login correcto",
      usuario,
      token,
    });
  } catch (error) {
    res.status(500).json({
      mensaje: "Error en el login",
      error: error.message,
    });
  }
});

router.post("/registro-cliente", async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      nombre,
      correo,
      password,
      telefono,
      direccion,
    } = req.body;

    if (
      !nombre ||
      !correo ||
      !password ||
      !telefono ||
      !direccion
    ) {
      return res.status(400).json({
        mensaje:
          "Todos los campos son obligatorios",
      });
    }

    // VALIDAR NOMBRE
    const nombreValido =
      /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/;

    if (!nombreValido.test(nombre)) {
      return res.status(400).json({
        mensaje:
          "El nombre solo puede contener letras y espacios",
      });
    }

    // VALIDAR CORREO
    const correoValido =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!correoValido.test(correo)) {
      return res.status(400).json({
        mensaje:
          "Correo electrónico inválido",
      });
    }

    // VALIDAR TELÉFONO
    const telefonoValido =
      /^\d{10}$/;

    if (!telefonoValido.test(telefono)) {
      return res.status(400).json({
        mensaje:
          "El teléfono debe tener exactamente 10 dígitos",
      });
    }

    // VALIDAR CONTRASEÑA
    if (password.length < 6) {
      return res.status(400).json({
        mensaje:
          "La contraseña debe tener al menos 6 caracteres",
      });
    }

    await client.query("BEGIN");

    const existeResultado =
      await client.query(
        `
        SELECT id
        FROM usuarios
        WHERE correo = $1
        `,
        [correo]
      );

    if (
      existeResultado.rows.length > 0
    ) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        mensaje:
          "Ese correo ya está registrado",
      });
    }

    await client.query(
      `
      INSERT INTO usuarios
      (
        nombre,
        correo,
        password,
        rol,
        telefono
      )
      VALUES
      (
        $1,
        $2,
        $3,
        'cliente',
        $4
      )
      `,
      [
        nombre.trim(),
        correo.trim().toLowerCase(),
        password,
        telefono,
      ]
    );

    await client.query(
      `
      INSERT INTO clientes
      (
        nombre,
        correo,
        telefono,
        direccion
      )
      VALUES
      (
        $1,
        $2,
        $3,
        $4
      )
      `,
      [
        nombre.trim(),
        correo.trim().toLowerCase(),
        telefono,
        direccion.trim(),
      ]
    );

    await client.query("COMMIT");

    res.json({
      mensaje:
        "Cliente registrado correctamente",
    });
  } catch (error) {
    await client.query("ROLLBACK");

    res.status(500).json({
      mensaje:
        "Error al registrar cliente",
      error: error.message,
    });
  } finally {
    client.release();
  }
});

export default router;