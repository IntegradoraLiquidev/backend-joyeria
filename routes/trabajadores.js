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
    return router;
};