// routes/usuarios.js
const express = require('express');
const router = express.Router();

module.exports = (db) => {
    // Obtener todos los usuarios
    router.get('/', (req, res) => {
        db.query('SELECT * FROM Usuario', (err, results) => {
            if (err) return res.status(500).json({ error: err });
            res.json(results);
        });
    });

    // Crear un nuevo usuario
    router.post('/', (req, res) => {
        const { correo, contraseña, rol } = req.body;
        db.query('INSERT INTO Usuario (correo, contraseña, rol) VALUES (?, ?, ?)', [correo, contraseña, rol], (err, results) => {
            if (err) return res.status(500).json({ error: err });
            res.status(201).json({ id_usuario: results.insertId, correo, rol });
        });
    });

    return router;
};
