// routes/productos.js
const express = require('express');
const router = express.Router();

module.exports = (db) => {
    // Ruta GET para obtener productos filtrados por categoría
    router.get('/', (req, res) => {
        const { categoria } = req.query; // Obtener el ID de la categoría desde los query params

        // Verificar si se recibió un ID de categoría
        if (!categoria) {
            return res.status(400).json({ error: 'Falta el parámetro de categoría' });
        }

        const query = 'SELECT * FROM joyeria.producto WHERE id_categoria = ?';

        db.query(query, [categoria], (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Error al obtener los productos' });
            }

            res.json(results); // Enviar productos filtrados por categoría
        });
    });

    router.post('/agregarProducto', (req, res) => {
        const { nombre, quilates, precio, id_categoria } = req.body;

        if (!nombre || !quilates || !precio || !id_categoria) {
            return res.status(400).json({ error: 'Todos los campos son requeridos' });
        }

        const query = `
            INSERT INTO Producto (nombre, quilates, precio, id_categoria)
            VALUES (?, ?, ?, ?)
        `;

        db.query(query, [nombre, quilates, precio, id_categoria], (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Error al crear el producto' });
            }

            res.status(201).json({ id_producto: results.insertId, nombre, quilates, precio, id_categoria });
        });
    });


    return router;
};
