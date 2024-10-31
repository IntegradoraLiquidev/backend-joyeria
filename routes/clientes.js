const express = require('express');
const router = express.Router();

module.exports = (db) => {

    // Obtener todos los clientes
    router.get('/', (req, res) => {
        db.query('SELECT * FROM Cliente', (err, results) => {
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

                    db.commit(err => {
                        if (err) {
                            return db.rollback(() => res.status(500).json({ error: 'Error al confirmar transacción' }));
                        }

                        res.status(201).json({ message: 'Abono agregado y monto actualizado' });
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
    router.post('/', (req, res) => {
        const { nombre, direccion, telefono, producto_id, quilates, precio_total, forma_pago, monto_actual } = req.body;

        if (!nombre || !direccion || !telefono || !producto_id || !quilates || !precio_total || !forma_pago) {
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

        const query = `
            INSERT INTO Cliente (nombre, direccion, telefono, producto_id, quilates, precio_total, forma_pago, monto_actual, fecha_registro, fecha_proximo_pago)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const values = [nombre, direccion, telefono, producto_id, quilates, precio_total, forma_pago, monto_actual, fechaRegistro, fechaProximoPago];

        db.query(query, values, (err, result) => {
            if (err) return res.status(500).json({ error: err });
            res.status(201).json({ message: 'Cliente creado exitosamente', clienteId: result.insertId });
        });
    });

    return router;
};
