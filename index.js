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
    host: process.env.PROD_DB_HOST || process.env.DB_HOST,
    user: process.env.PROD_DB_USER || process.env.DB_USER,
    password: process.PROD_env.DB_PASSWORD || '',
    database: process.PROD_env.DB_NAME || process.env.DB_NAME,
    port: process.PROD_env.DB_PORT || process.env.DB_PORT || 3000,
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
const PORT = process.PROD_env.DB_PORT || process.env.DB_PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});
