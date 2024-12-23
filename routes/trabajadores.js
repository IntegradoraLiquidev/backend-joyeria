const express = require('express');
const router = express.Router();

module.exports = (db) => {

    // Obtener todos los trabajadores con todos sus campos
    router.get('/', (req, res) => {
        const sql = 'SELECT id_usuario, nombre, apellidos, email, password, rol FROM Usuario';
        db.query(sql, (err, results) => {
            if (err) return res.status(500).json({ error: 'Error al obtener los trabajadores' });
            res.json(results);
        });
    });

    // Ruta para obtener clientes de un trabajador dividido por monto_actual
    router.get('/clientes/:id', (req, res) => {
        const { id } = req.params;
        const sql = `
        SELECT id_cliente, nombre, monto_actual
        FROM Cliente
        WHERE id_trabajador = ?;
        `;
    
        db.query(sql, [id], (err, results) => {
            if (err) return res.status(500).json({ error: 'Error al obtener los clientes' });
    
            // Enviar todos los clientes en una sola lista
            res.json({ clientes: results });
        });
    });
    


    // Obtener todos los trabajadores con el conteo de clientes
    router.get('/conteo', (req, res) => {
        const sql = `
    SELECT Usuario.id_usuario, Usuario.nombre, Usuario.apellidos, Usuario.email, Usuario.password, Usuario.rol, COUNT(Cliente.id_cliente) AS cliente_count
    FROM Usuario
    LEFT JOIN Cliente ON Usuario.id_usuario = Cliente.id_trabajador
    WHERE Usuario.rol = "Trabajador"
    GROUP BY Usuario.id_usuario;
    `;
        db.query(sql, (err, results) => {
            if (err) return res.status(500).json({ error: err });

            // Agregar un console.log aquí para verificar los resultados
            console.log("Resultados de la consulta:", results);

            res.json(results);
        });
    });

    // Agregar un nuevo trabajador sin bcrypt
    router.post('/agregar', (req, res) => {
        const { nombre, apellidos, email, password, role } = req.body;

        if (!nombre || !apellidos || !email || !password || !role) {
            return res.status(400).json({ message: 'Todos los campos son requeridos' });
        }

        const existingUserQuery = 'SELECT * FROM Usuario WHERE email = ?';
        db.query(existingUserQuery, [email], (err, results) => {
            if (err) return res.status(500).json({ message: 'Error en la base de datos' });
            if (results.length > 0) {
                return res.status(400).json({ message: 'El trabajador ya existe' });
            }

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

    // Eliminar un trabajador por su ID
    router.delete('/eliminar/:id', (req, res) => {
        const { id } = req.params;
        const deleteUserQuery = 'DELETE FROM Usuario WHERE id_usuario = ?';
        db.query(deleteUserQuery, [id], (err, result) => {
            if (err) return res.status(500).json({ message: 'Error al eliminar el trabajador' });
            if (result.affectedRows === 0) return res.status(404).json({ message: 'Trabajador no encontrado' });
            res.json({ message: 'Trabajador eliminado exitosamente' });
        });
    });

    // Actualizar trabajador
    router.put('/editar/:id', (req, res) => {
        const { id } = req.params;
        const { nombre, apellidos, email, password, rol } = req.body;

        const sql = 'UPDATE Usuario SET nombre = ?, apellidos = ?, email = ?, password = ?, rol = ? WHERE id_usuario = ?';
        db.query(sql, [nombre, apellidos, email, password, rol, id], (err, result) => {
            if (err) return res.status(500).json({ error: 'Error al actualizar el trabajador' });
            if (result.affectedRows === 0) return res.status(404).json({ message: 'Trabajador no encontrado' });
            res.json({ message: 'Trabajador actualizado exitosamente' });
        });
    });


    return router;
};
