const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// Middleware para manejar autenticación
module.exports = (db) => {
    // Ruta para manejar el inicio de sesión de usuarios
    router.post('/login', (req, res) => {
        const { email, password } = req.body;
        console.log('Intento de inicio de sesión con email:', email);

        // Consultar base de datos para encontrar al usuario por email
        db.query('SELECT * FROM Usuario WHERE email = ?', [email], (err, results) => {
            if (err) {
                return res.status(500).json({ error: 'Error en el servidor' });
            }
            if (results.length === 0) {
                return res.status(404).json({ message: 'Usuario no encontrado' });
            }

            const user = results[0];

            // Comparar contraseñas directamente (Recomendado: usar bcrypt para mayor seguridad)
            if (password !== user.password) {
                return res.status(401).json({ message: 'Contraseña incorrecta' });
            }

            // Crear y firmar el token JWT con información del usuario
            const token = jwt.sign(
                { 
                    id: user.id_usuario, 
                    nombre: user.nombre, 
                    role: user.rol 
                }, 
                process.env.JWT_SECRET, 
                { expiresIn: '1h' } // El token expirará en 1 hora
            );

            // Devolver el token como respuesta
            res.json({ token });
        });
    });

    return router;
};
