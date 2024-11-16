const express = require('express');
const router = express.Router();

module.exports = (db) => {
    // Obtener todos los categoria
    router.get('/', (req, res) => {
        db.query('SELECT * FROM Categoria', (err, results) => {
            if (err) return res.status(500).json({ error: err });
            res.json(results);
        });
    });

    // Crear un nuevo categoria
    router.post('/agregarCategoria', (req, res) => {
        const { nombre } = req.body;
        db.query('INSERT INTO Categoria (nombre) VALUES (?)', [nombre], (err, results) => {
            if (err) return res.status(500).json({ error: err });
            res.status(201).json({ id_categoria: results.insertId, nombre });
        });
    });


    return router;
};
