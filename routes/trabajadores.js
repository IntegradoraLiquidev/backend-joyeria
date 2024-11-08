const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

module.exports = (db) => {

    // Obtener todos los trabajadores con el conteo de clientes
    router.get('/', (req, res) => {
        const sql = `
        SELECT Usuario.id_usuario, Usuario.nombre, Usuario.rol, COUNT(Cliente.id_cliente) AS cliente_count
        FROM Usuario
        LEFT JOIN Cliente ON Usuario.id_usuario = Cliente.id_trabajador
        WHERE Usuario.rol = "Trabajador"
        GROUP BY Usuario.id_usuario;
    `;
        db.query(sql, (err, results) => {
            if (err) return res.status(500).json({ error: err });
            res.json(results);
        });
    });

    // Agregar un nuevo trabajador sin bcrypt
    router.post('/agregar', (req, res) => {
        const { nombre, apellidos, email, password, role } = req.body;

        if (!nombre || !apellidos || !email || !password || !role) {
            return res.status(400).json({ message: 'Todos los campos son requeridos' });
        }

        // Verificar si el trabajador ya existe
        const existingUserQuery = 'SELECT * FROM Usuario WHERE email = ?';
        db.query(existingUserQuery, [email], (err, results) => {
            if (err) return res.status(500).json({ message: 'Error en la base de datos' });
            if (results.length > 0) {
                return res.status(400).json({ message: 'El trabajador ya existe' });
            }

            // Insertar el nuevo trabajador en la base de datos
            const insertUserQuery = `
                INSERT INTO Usuario (nombre, apellidos, email, password, rol)
                VALUES (?, ?, ?, ?, ?)
            `;
            db.query(insertUserQuery, [nombre, apellidos, email, password, role], (err, result) => {
                if (err) return res.status(500).json({ message: 'Error al agregar el trabajador' });
                res.status(201).json({ message: 'Trabajador agregado exitosamente' });
            });
        });
    });

    return router;
};
