// routes/productos.js
const express = require('express');
const router = express.Router();

module.exports = (db) => {
    router.get('/productoCategoria', (req, res) => {
        const { id_categoria } = req.query;

        if (id_categoria) {
            const query = 'SELECT * FROM Producto WHERE id_categoria = ?';
            db.query(query, [id_categoria], (err, results) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ error: 'Error al obtener los productos' });
                }
                return res.json(results);
            });
        } else {
            // Devuelve todos los productos si no se proporciona categoría
            const query = 'SELECT * FROM Producto';
            db.query(query, (err, results) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ error: 'Error al obtener los productos' });
                }
                return res.json(results);
            });
        }
    });
    //Endpoint para obtener un producto:

    router.get('/:id_producto', (req, res) => {
        const { id_producto } = req.params;

        const query = 'SELECT * FROM Producto WHERE id_producto = ?';
        db.query(query, [id_producto], (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Error al obtener el producto' });
            }
            res.json(results[0]);
        });
    });


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
        const { nombre, quilates, precio, id_categoria, cantidad, } = req.body;

        if (!nombre || !quilates || !precio || !id_categoria || !cantidad) {
            return res.status(400).json({ error: 'Todos los campos son requeridos' });
        }

        const query = `
            INSERT INTO Producto (nombre, quilates, precio, id_categoria, cantidad)
            VALUES (?, ?, ?, ?, ?)
        `;

        db.query(query, [nombre, quilates, precio, id_categoria, cantidad], (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Error al crear el producto' });
            }

            res.status(201).json({ id_producto: results.insertId, nombre, quilates, precio, id_categoria, cantidad });
        });
    });

    //Endpoint para actualizar un producto:

    router.put('/:id_producto', (req, res) => {
        const { id_producto } = req.params;
        const { nombre, quilates, precio, cantidad } = req.body;

        const query = `
            UPDATE Producto 
            SET nombre = ?, quilates = ?, precio = ?, cantidad = ?
            WHERE id_producto = ?
        `;
        db.query(query, [nombre, quilates, precio, cantidad, id_producto], (err) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Error al actualizar el producto' });
            }
            res.json({ message: 'Producto actualizado con éxito' });
        });
    });

    //El endpoint de eliminación del producto
    // Ruta para eliminar un producto por ID
    router.delete('/:id_producto/eliminarProducto', (req, res) => {
        const { id_producto } = req.params;

        const query = 'DELETE FROM Producto WHERE id_producto = ?';
        db.query(query, [id_producto], (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Error al eliminar el producto' });
            }

            if (results.affectedRows === 0) {
                return res.status(404).json({ error: 'Producto no encontrado' });
            }

            res.json({ message: 'Producto eliminado con éxito' });
        });
    });




    return router;
};
