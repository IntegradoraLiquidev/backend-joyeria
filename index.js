const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mysql = require('mysql2');
const dotenv = require('dotenv');

// Rutas
const authRoutes = require('./auth/auth');
const productosRoutes = require('./routes/productos');
const clientesRoutes = require('./routes/clientes');
const categoriasRoutes = require('./routes/categorias');
const trabajadoresRoutes = require('./routes/trabajadores'); // Nueva ruta de trabajadores

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Configurar la conexión a la base de datos
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: '',
    database: process.env.DB_NAME,
});

// Conectar a la base de datos
db.connect((err) => {
    if (err) {
        console.error('Error conectando a la base de datos:', err);
        return;
    }
    console.log('Conectado a la base de datos MySQL');
});

// Usar las rutas
app.use('/api/auth', authRoutes(db));
app.use('/api/productos', productosRoutes(db));
app.use('/api/clientes', clientesRoutes(db));
app.use('/api/categorias', categoriasRoutes(db));
app.use('/api/trabajadores', trabajadoresRoutes(db)); // Usar la nueva ruta

// Iniciar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});
