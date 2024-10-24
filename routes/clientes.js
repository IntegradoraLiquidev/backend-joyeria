// routes/clientes.js
const express = require('express');
const router = express.Router();

module.exports = (db) => {
    // Obtener todos los clientes
    router.get('/', (req, res) => {
        db.query('SELECT * FROM Cliente', (err, results) => {
            if (err) return res.status(500).json({ error: err });
            res.json(results);
        });
    });

    // Crear un nuevo cliente
    router.post('/', (req, res) => {
        const { nombre, direccion, telefono, producto_id, quilates, precio_total, forma_pago } = req.body;
        db.query('INSERT INTO Cliente (nombre, direccion, telefono, producto_id, quilates, precio_total, forma_pago) VALUES (?, ?, ?, ?, ?, ?, ?)', [nombre, direccion, telefono, producto_id, quilates, precio_total, forma_pago], (err, results) => {
            if (err) return res.status(500).json({ error: err });
            res.status(201).json({ id_cliente: results.insertId, nombre });
        });
    });

    return router;
};
