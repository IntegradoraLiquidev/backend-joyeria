const express = require('express');
const router = express.Router();

module.exports = (db) => {

    // Obtener todos los clientes
    router.get('/', (req, res) => {
        db.query('SELECT id_cliente, nombre, direccion, telefono, producto_id, quilates, precio_total, forma_pago, monto_actual, id_trabajador FROM Cliente', (err, results) => {
            if (err) return res.status(500).json({ error: err });
            res.json(results);
        });
    });

    // Endpoint para obtener los detalles de un cliente específico
    router.get('/:id', (req, res) => {
        const clienteId = req.params.id;

        const query = 'SELECT nombre, direccion, telefono, precio_total, monto_actual, forma_pago FROM Cliente WHERE id_cliente = ?';
        db.query(query, [clienteId], (err, results) => {
            if (err) return res.status(500).json({ error: err });

            if (results.length === 0) {
                return res.status(404).json({ error: 'Cliente no encontrado' });
            }

            res.json(results[0]);
        });
    });

    // Endpoint para agregar un abono a un cliente específico
    router.post('/:id/abonos', (req, res) => {
        const clienteId = req.params.id;
        const { monto, fecha } = req.body;

        // Validar que monto y fecha no sean nulos
        if (!monto || !fecha) {
            return res.status(400).json({ error: 'Monto y fecha son requeridos' });
        }

        // Asegurarse de que el monto sea un número válido
        const parsedMonto = parseFloat(monto);
        if (isNaN(parsedMonto)) {
            return res.status(400).json({ error: 'El monto debe ser un número válido' });
        }

        // Iniciar transacción
        db.beginTransaction((err) => {
            if (err) {
                return res.status(500).json({ error: 'Error al iniciar transacción' });
            }

            // Insertar el abono en la tabla 'abonos'
            const insertAbonoQuery = 'INSERT INTO abonos (cliente_id, monto, fecha, estado) VALUES (?, ?, ?, ?)';
            const abonoValues = [clienteId, parsedMonto, fecha, 'pagado'];

            db.query(insertAbonoQuery, abonoValues, (err, result) => {
                if (err) {
                    return db.rollback(() => {
                        console.error('Error al agregar abono:', err);  // Log de error
                        return res.status(500).json({ error: 'Error al procesar el abono' });
                    });
                }

                // Actualizar el monto_actual del cliente
                const updateMontoQuery = `
                UPDATE Cliente
                SET monto_actual = GREATEST(monto_actual - ?, 0)
                WHERE id_cliente = ?
            `;
                const updateValues = [parsedMonto, clienteId];

                db.query(updateMontoQuery, updateValues, (err, updateResult) => {
                    if (err) {
                        return db.rollback(() => {
                            console.error('Error al actualizar monto_actual:', err);  // Log de error
                            return res.status(500).json({ error: 'Error al actualizar el monto actual del cliente' });
                        });
                    }

                    // Confirmar la transacción si todo fue exitoso
                    db.commit((err) => {
                        if (err) {
                            return db.rollback(() => {
                                console.error('Error al confirmar la transacción:', err);  // Log de error
                                return res.status(500).json({ error: 'Error al confirmar la transacción' });
                            });
                        }

                        res.status(201).json({ message: 'Abono agregado exitosamente y monto actual actualizado' });
                    });
                });
            });
        });
    });

    router.put('/:id/incrementarMonto', (req, res) => {
        const clienteId = req.params.id;
        const { incremento } = req.body;
    
        const query = `UPDATE Cliente SET monto_actual = monto_actual + ? WHERE id_cliente = ?`;
        db.query(query, [incremento, clienteId], (err, result) => {
            if (err) return res.status(500).json({ error: err });
    
            // Agregar el registro del "no abono" en la tabla de abonos
            const insertNoAbono = `
                INSERT INTO abonos (cliente_id, monto, fecha, estado)
                VALUES (?, ?, NOW(), 'no_abono')
            `;
            db.query(insertNoAbono, [clienteId, incremento], (err, result) => {
                if (err) return res.status(500).json({ error: err });
    
                res.status(200).json({ message: 'Monto incrementado exitosamente y no abono registrado' });
            });
        });
    });
    

    // Obtener historial de abonos para un cliente específico
    router.get('/:id/abonos', (req, res) => {
        const clienteId = req.params.id;

        const query = 'SELECT monto, fecha, estado FROM abonos WHERE cliente_id = ? ORDER BY fecha DESC';
        db.query(query, [clienteId], (err, results) => {
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

        // Asignar monto_actual con el valor de precio_total automáticamente
        const query = `
        INSERT INTO Cliente (nombre, direccion, telefono, producto_id, quilates, precio_total, forma_pago, monto_actual)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
        const values = [nombre, direccion, telefono, producto_id, quilates, precio_total, forma_pago, precio_total];

        db.query(query, values, (err, result) => {
            if (err) return res.status(500).json({ error: err });
            res.status(201).json({ message: 'Cliente agregado exitosamente', clienteId: result.insertId });
        });
    });

    return router;

};
