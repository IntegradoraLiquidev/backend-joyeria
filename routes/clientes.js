const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

module.exports = (db) => {
    // Middleware para verificar y decodificar el token JWT
    const authenticateJWT = (req, res, next) => {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(403).json({ message: 'Token requerido' });

        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) return res.status(403).json({ message: 'Token inválido' });
            req.user = decoded;
            next();
        });
    };

    // Obtener solo los clientes del trabajador autenticado
    router.get('/', authenticateJWT, (req, res) => {
        const trabajadorId = req.user.id; // Obtener el id del trabajador del token

        const query = 'SELECT * FROM Cliente WHERE id_trabajador = ?';
        db.query(query, [trabajadorId], (err, results) => {
            if (err) return res.status(500).json({ error: err });
            res.json(results);
        });
    });

    // Obtener los detalles de un cliente específico
    router.get('/:id', (req, res) => {
        const clienteId = req.params.id;
        db.query('SELECT * FROM Cliente WHERE id_cliente = ?', [clienteId], (err, result) => {
            if (err) return res.status(500).json({ error: err });
            if (result.length === 0) return res.status(404).json({ error: 'Cliente no encontrado' });
            res.json(result[0]);
        });
    });
    
    router.get('/clientes/:id', (req, res) => {
        const { id } = req.params;
        const sql = `
            SELECT Cliente.*, Usuario.nombre AS nombre_trabajador
            FROM Cliente
            JOIN Usuario ON Cliente.id_trabajador = Usuario.id_usuario
            WHERE Usuario.id_usuario = ?;
        `;
        db.query(sql, [id], (err, results) => {
            if (err) return res.status(500).json({ error: 'Error al obtener los clientes' });
            res.json(results);
        });
    });

    router.get('/:id/productos', (req, res) => {
        const { id } = req.params; // ID del cliente
    
        const query = `
            SELECT p.id_producto, p.nombre, p.quilates, p.precio, p.cantidad 
            FROM clientes_productos cp
            JOIN producto p ON cp.producto_id = p.id_producto
            WHERE cp.cliente_id = ?`;
    
        db.query(query, [id], (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Error al obtener los productos del cliente' });
            }
            return res.json(results);
        });
    });

    router.get('/:id/abonos', (req, res) => {
        const clienteId = req.params.id;
        const query = 'SELECT monto, fecha, estado FROM abonos WHERE cliente_id = ? ORDER BY fecha DESC';
        db.query(query, [clienteId], (err, results) => {
            if (err) return res.status(500).json({ error: err });
            res.json(results);
        });
    });

    router.delete('/:id', authenticateJWT, (req, res) => {
        const clienteId = req.params.id;
        console.log('Eliminando cliente con ID:', clienteId);

        db.query('DELETE FROM Cliente WHERE id_cliente = ?', [clienteId], (err, result) => {
            if (err) {
                console.error('Error al eliminar cliente:', err);
                return res.status(500).json({ error: 'Error al eliminar cliente' });
            }

            if (result.affectedRows === 0) {
                console.log('Cliente no encontrado en la base de datos');
                return res.status(404).json({ error: 'Cliente no encontrado' });
            }

            console.log('Cliente eliminado correctamente');
            res.status(200).json({ message: 'Cliente eliminado correctamente' });
        });
    });

    
    // Actualizar un cliente existente
    router.put('/:id', authenticateJWT, (req, res) => {
        const clienteId = req.params.id;
        const { nombre, direccion, telefono, precio_total, forma_pago, monto_actual } = req.body;

        if (!nombre || !direccion || !telefono || precio_total === undefined || !forma_pago || monto_actual === undefined) {
            return res.status(400).json({ error: 'Todos los campos son requeridos' });
        }

        const query = `
        UPDATE Cliente
        SET nombre = ?, direccion = ?, telefono = ?, precio_total = ?, forma_pago = ?, monto_actual = ?
        WHERE id_cliente = ?
    `;
        const values = [nombre, direccion, telefono, precio_total, forma_pago, monto_actual, clienteId];

        db.query(query, values, (err, result) => {
            if (err) return res.status(500).json({ error: 'Error al actualizar cliente' });
            if (result.affectedRows === 0) return res.status(404).json({ error: 'Cliente no encontrado' });

            res.status(200).json({ message: 'Cliente actualizado correctamente' });
        });
    });



    // Agregar un abono y actualizar el monto del cliente
    router.post('/:id/abonos', (req, res) => {
        const clienteId = req.params.id;
        const { monto, fecha } = req.body;

        if (!monto || !fecha) {
            return res.status(400).json({ error: 'Monto y fecha son requeridos' });
        }

        db.beginTransaction(err => {
            if (err) return res.status(500).json({ error: 'Error al iniciar transacción' });

            const insertAbonoQuery = 'INSERT INTO abonos (cliente_id, monto, fecha, estado) VALUES (?, ?, ?, ?)';
            const abonoValues = [clienteId, monto, fecha, 'pagado'];

            db.query(insertAbonoQuery, abonoValues, (err) => {
                if (err) {
                    return db.rollback(() => res.status(500).json({ error: 'Error al agregar abono' }));
                }
                const updateMontoQuery = 'UPDATE Cliente SET monto_actual = GREATEST(monto_actual - ?, 0) WHERE id_cliente = ?';
                const updateValues = [monto, clienteId];
                db.query(updateMontoQuery, updateValues, (err) => {
                    if (err) {
                        return db.rollback(() => res.status(500).json({ error: 'Error al actualizar el monto del cliente' }));
                    }
                    db.query('SELECT forma_pago FROM Cliente WHERE id_cliente = ?', [clienteId], (err, results) => {
                        if (err || results.length === 0) {
                            return db.rollback(() => res.status(500).json({ error: 'Error al obtener forma de pago' }));
                        }
                        const formaPago = results[0].forma_pago;
                        const nuevaFechaProximoPago = new Date();
                        if (formaPago === 'Diario') {
                            nuevaFechaProximoPago.setDate(nuevaFechaProximoPago.getDate() + 1);
                        } else if (formaPago === 'Semanal') {
                            nuevaFechaProximoPago.setDate(nuevaFechaProximoPago.getDate() + 7);
                        }
                        db.query(
                            'UPDATE Cliente SET fecha_proximo_pago = ? WHERE id_cliente = ?',
                            [nuevaFechaProximoPago.toISOString().split('T')[0], clienteId],
                            (err) => {
                                if (err) {
                                    return db.rollback(() => res.status(500).json({ error: 'Error al actualizar fecha de próximo pago' }));
                                }

                                db.commit(err => {
                                    if (err) {
                                        return db.rollback(() => res.status(500).json({ error: 'Error al confirmar transacción' }));
                                    }

                                    res.status(201).json({
                                        message: 'Abono agregado y próximo pago actualizado',
                                        fecha_proximo_pago: nuevaFechaProximoPago.toISOString().split('T')[0]
                                    });
                                });
                            }
                        );
                    });
                });
            });
        });
    });

    // Incrementar el monto cuando no se paga
    router.put('/:id/incrementarMonto', (req, res) => {
        const clienteId = req.params.id;
        const { incremento } = req.body;

        db.query('UPDATE Cliente SET monto_actual = monto_actual + ? WHERE id_cliente = ?', [incremento, clienteId], (err) => {
            if (err) return res.status(500).json({ error: err });

            db.query('INSERT INTO abonos (cliente_id, monto, fecha, estado) VALUES (?, ?, NOW(), ?)', [clienteId, incremento, 'no_abono'], (err) => {
                if (err) return res.status(500).json({ error: err });
                res.status(200).json({ message: 'Monto incrementado y no abono registrado' });
            });
        });
    });

    // Crear un nuevo cliente
    router.post('/', authenticateJWT, (req, res) => {
        const { nombre, direccion, telefono, productos, precio_total, forma_pago, monto_actual } = req.body;
        const trabajadorId = req.user.id; // Obtener el ID del trabajador del token
    
        if (!nombre || !direccion || !telefono || !productos || productos.length === 0 || !precio_total || !forma_pago) {
            return res.status(400).json({ error: 'Todos los campos son requeridos' });
        }
    
        const fechaRegistro = new Date();
        let fechaProximoPago;
    
        if (forma_pago === 'diario') {
            fechaProximoPago = new Date(fechaRegistro);
            fechaProximoPago.setDate(fechaProximoPago.getDate() + 1);
        } else if (forma_pago === 'semanal') {
            fechaProximoPago = new Date(fechaRegistro);
            fechaProximoPago.setDate(fechaProximoPago.getDate() + 7);
        }
    
        // Query para insertar el cliente
        const queryCliente = `
            INSERT INTO Cliente (nombre, direccion, telefono, precio_total, forma_pago, monto_actual, fecha_registro, fecha_proximo_pago, id_trabajador)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const valuesCliente = [nombre, direccion, telefono, precio_total, forma_pago, monto_actual, fechaRegistro, fechaProximoPago, trabajadorId];
    
        db.query(queryCliente, valuesCliente, (err, result) => {
            if (err) {
                console.error('Error al insertar cliente:', err);
                return res.status(500).json({ error: 'Hubo un problema al agregar el cliente' });
            }
    
            const clienteId = result.insertId; // Obtener el ID del cliente recién insertado
    
            // Preparar las queries para insertar los productos
            const queryProductos = `
                INSERT INTO clientes_productos (cliente_id, producto_id)
                VALUES ?
            `;
            const valuesProductos = productos.map((productoId) => [clienteId, productoId]);
    
            db.query(queryProductos, [valuesProductos], (errProductos) => {
                if (errProductos) {
                    console.error('Error al insertar productos del cliente:', errProductos);
                    return res.status(500).json({ error: 'Hubo un problema al asociar los productos al cliente' });
                }
    
                console.log('Cliente y productos insertados correctamente');
                res.status(201).json({ message: 'Cliente agregado exitosamente con sus productos' });
            });
        });
    });
    

    router.get('/clientes/:id_trabajador', (req, res) => {
        const trabajadorId = req.params.id_trabajador;
        const query = 'SELECT * FROM Cliente WHERE id_trabajador = ?';
        db.query(query, [trabajadorId], (err, results) => {
            if (err) return res.status(500).json({ error: 'Error al obtener los clientes' });
            res.json(results);
        });
    });



    return router;
};
