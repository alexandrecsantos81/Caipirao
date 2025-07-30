// /backend/routes/despesas.js
const express = require('express');
const router = express.Router();
const pool = require('../db');

// ROTA GET (Leitura) - Listar todas as despesas
router.get('/', async (req, res) => {
    try {
        const query = 'SELECT * FROM despesas ORDER BY data_pagamento DESC, id DESC';
        const todasDespesas = await pool.query(query);
        res.json(todasDespesas.rows);
    } catch (err) {
        console.error('Erro ao buscar despesas:', err.stack);
        res.status(500).json({ error: "Erro no servidor ao buscar despesas." });
    }
});

// ROTA POST (Criação) - Criar uma nova despesa
router.post('/', async (req, res) => {
    try {
        const {
            tipo_saida,
            discriminacao,
            nome_recebedor,
            data_pagamento,
            data_vencimento,
            forma_pagamento,
            valor,
            responsavel_pagamento
        } = req.body;

        // Validação básica
        if (!tipo_saida || !valor) {
            return res.status(400).json({ error: "Tipo de saída e Valor são obrigatórios." });
        }

        const novaDespesa = await pool.query(
            `INSERT INTO despesas (
                tipo_saida, discriminacao, nome_recebedor, data_pagamento, 
                data_vencimento, forma_pagamento, valor, responsavel_pagamento
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [
                tipo_saida, discriminacao, nome_recebedor, data_pagamento || null,
                data_vencimento || null, forma_pagamento, valor, responsavel_pagamento
            ]
        );

        res.status(201).json(novaDespesa.rows[0]);

    } catch (err) {
        console.error('Erro ao criar despesa:', err.message, err.stack);
        res.status(500).json({ error: "Erro no servidor ao criar despesa." });
    }
});

module.exports = router;
