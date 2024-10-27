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

    router.get('/', (req, res) => {
        db.query('SELECT id_cliente, nombre, direccion, telefono, producto_id, quilates, precio_total, forma_pago, id_trabajador FROM Cliente', (err, results) => {
            if (err) return res.status(500).json({ error: err });
            res.json(results);
        });
    });


    // Crear un nuevo cliente
    router.post('/', (req, res) => {
        const { nombre, direccion, telefono, producto_id, quilates, precio_total, forma_pago } = req.body;

        if (!nombre || !direccion || !telefono || !producto_id || !quilates || !precio_total || !forma_pago) {
            return res.status(400).json({ error: 'Todos los campos son requeridos' });
        }

        const query = 'INSERT INTO Cliente (nombre, direccion, telefono, producto_id, quilates, precio_total, forma_pago) VALUES (?, ?, ?, ?, ?, ?, ?)';
        const values = [nombre, direccion, telefono, producto_id, quilates, precio_total, forma_pago];

        db.query(query, values, (err, result) => {
            if (err) return res.status(500).json({ error: err });
            res.status(201).json({ message: 'Cliente agregado exitosamente', clienteId: result.insertId });
        });
    });

    return router;
};
