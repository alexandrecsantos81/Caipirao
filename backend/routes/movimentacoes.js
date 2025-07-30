// /backend/routes/movimentacoes.js
const express = require('express');
const router = express.Router();
const pool = require('../db');

// ROTA GET (Leitura) - Listar todas as VENDAS
router.get('/', async (req, res) => {
    try {
        const query = `
            SELECT
                m.id,
                m.data_venda,
                m.descricao AS produto_nome,
                m.valor AS valor_total,
                c.nome AS cliente_nome
            FROM movimentacoes AS m
            LEFT JOIN clientes AS c ON m.idcliente = c.id
            WHERE m.tipo = 'ENTRADA'
            ORDER BY m.data_venda DESC, m.id DESC;
        `;
        const todasAsVendas = await pool.query(query);
        res.json(todasAsVendas.rows);
    } catch (err) {
        console.error('Erro detalhado ao buscar vendas:', err.stack);
        res.status(500).json({ error: "Erro no servidor ao buscar vendas." });
    }
});

// ROTA POST (Criação) - Criar uma nova VENDA
router.post('/', async (req, res) => {
    const {
        cliente_id,
        produto_nome,
        data_venda,
        data_pagamento,
        peso_produto,
        valor_total,
        preco_manual,
        responsavel_venda
    } = req.body;

    if (!cliente_id || !produto_nome || !data_venda || !valor_total) {
        return res.status(400).json({ error: "Cliente, produto, data da venda e valor são obrigatórios." });
    }

    try {
        /**
         * CORREÇÃO FINAL: Adicionada a coluna 'data' na query INSERT.
         * A coluna 'data' original provavelmente tem uma restrição NOT NULL.
         * Estamos usando o valor de 'data_venda' para preenchê-la e satisfazer o banco.
         */
        const novaVenda = await pool.query(
            `INSERT INTO movimentacoes (
                tipo, idcliente, descricao, data_venda, data_pagamento,
                peso_produto, valor, preco_manual, responsavel_venda, categoria, data
             )
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
             RETURNING *`,
            [
                'ENTRADA',
                cliente_id,
                produto_nome,
                data_venda,
                data_pagamento || null,
                peso_produto || null,
                valor_total,
                preco_manual || null,
                responsavel_venda || null,
                'VENDA',
                data_venda // Preenchendo a coluna 'data' com a data da venda
            ]
        );

        res.status(201).json(novaVenda.rows[0]);

    } catch (err) {
        // Se o erro persistir, o log abaixo no terminal do backend nos dirá exatamente qual é o problema.
        console.error('Erro ao criar venda (log detalhado):', err.stack);
        res.status(500).json({ error: "Erro no servidor ao criar a venda." });
    }
});

module.exports = router;
