//usuarios.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken'); // Para generar el token JWT

module.exports = (db) => {
    // Ruta de inicio de sesión
    router.post('/login', (req, res) => {
        const { email, password } = req.body;
        console.log('Solicitud de login con email:', email);

        // Buscar al usuario en la base de datos
        db.query('SELECT * FROM Usuario WHERE email = ?', [email], (err, results) => {
            if (err) return res.status(500).json({ error: err });
            if (results.length === 0) return res.status(404).json({ message: 'Usuario no encontrado' });

            const user = results[0];

            // Comparar contraseñas directamente sin bcrypt
            if (password !== user.password) {
                return res.status(401).json({ message: 'Contraseña incorrecta' });
            }

            // Generar token JWT
            const token = jwt.sign({ id: user.id_usuario, nombre: user.nombre, role: user.rol }, process.env.JWT_SECRET, { expiresIn: '1h' });

            res.json({ token });
        });
    });

    return router;
};
