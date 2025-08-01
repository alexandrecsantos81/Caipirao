// /backend/routes/despesas.js
const express = require('express');
const router = express.Router();
const pool = require('../db');

// ROTA GET (Leitura) - Listar todas as despesas (sem alteração)
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

// ROTA POST (Criação) - Criar uma nova despesa (sem alteração)
router.post('/', async (req, res) => {
    try {
        const {
            tipo_saida, discriminacao, nome_recebedor, data_pagamento,
            data_vencimento, forma_pagamento, valor, responsavel_pagamento
        } = req.body;

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

// ROTA PUT (Atualização) - Editar uma despesa existente
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            tipo_saida, discriminacao, nome_recebedor, data_pagamento,
            data_vencimento, forma_pagamento, valor, responsavel_pagamento
        } = req.body;

        if (!tipo_saida || !valor) {
            return res.status(400).json({ error: "Tipo de saída e Valor são obrigatórios." });
        }

        const despesaAtualizada = await pool.query(
            `UPDATE despesas SET 
                tipo_saida = $1, discriminacao = $2, nome_recebedor = $3, data_pagamento = $4,
                data_vencimento = $5, forma_pagamento = $6, valor = $7, responsavel_pagamento = $8
             WHERE id = $9 RETURNING *`,
            [
                tipo_saida, discriminacao, nome_recebedor, data_pagamento || null,
                data_vencimento || null, forma_pagamento, valor, responsavel_pagamento, id
            ]
        );

        if (despesaAtualizada.rowCount === 0) {
            return res.status(404).json({ error: "Despesa não encontrada." });
        }
        res.json(despesaAtualizada.rows[0]);
    } catch (err) {
        console.error('Erro ao atualizar despesa:', err.message, err.stack);
        res.status(500).json({ error: "Erro no servidor ao atualizar despesa." });
    }
});

// ROTA DELETE (Exclusão) - Apagar uma despesa
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const resultadoDelete = await pool.query("DELETE FROM despesas WHERE id = $1 RETURNING *", [id]);

        if (resultadoDelete.rowCount === 0) {
            return res.status(404).json({ error: "Despesa não encontrada." });
        }
        res.json({ message: "Despesa apagada com sucesso." });
    } catch (err) {
        console.error('Erro ao apagar despesa:', err.message, err.stack);
        res.status(500).json({ error: "Erro no servidor ao apagar despesa." });
    }
});

module.exports = router;
