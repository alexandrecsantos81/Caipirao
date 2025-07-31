const express = require('express');
const router = express.Router();
const pool = require('../db');

// ROTA GET (Leitura) - Listar todas as VENDAS (Entradas)
// Nenhuma alteração aqui, pois já estava funcionando corretamente.
router.get('/', async (req, res) => {
    try {
        const query = `
            SELECT
                m.id,
                m.data AS data_venda,
                m.descricao AS produto_nome,
                m.valor AS valor_total,
                c.nome AS cliente_nome
            FROM movimentacoes AS m
            LEFT JOIN clientes AS c ON m.cliente_id = c.id
            WHERE m.tipo = 'ENTRADA'
            ORDER BY m.data DESC, m.id DESC;
        `;
        const todasAsVendas = await pool.query(query);
        res.json(todasAsVendas.rows);
    } catch (err) {
        console.error('Erro detalhado ao buscar vendas:', err.stack);
        res.status(500).json({ error: "Erro no servidor ao buscar vendas." });
    }
});

// ROTA POST (Criação) - VERSÃO FINAL E COMPLETA
// Atualizada para incluir os novos campos: peso, data_pagamento e preco_manual.
router.post('/', async (req, res) => {
    // 1. Recebendo os novos campos do corpo da requisição (req.body)
    const {
        cliente_id,
        produto_nome,
        data_venda,
        valor_total,
        peso,
        data_pagamento,
        preco_manual,
        responsavel_venda
    } = req.body;

    // Validação dos campos obrigatórios
    if (!cliente_id || !produto_nome || !data_venda || !valor_total) {
        return res.status(400).json({ error: "Cliente, produto, data da venda e valor são obrigatórios." });
    }

    try {
        // 2. Atualizando o comando INSERT para incluir as novas colunas
        const novaVenda = await pool.query(
            `INSERT INTO movimentacoes (
                tipo, cliente_id, descricao, data, valor, categoria, 
                peso, data_pagamento, preco_manual, responsavel
             )
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             RETURNING *`,
            [
                'ENTRADA',
                cliente_id,
                produto_nome,
                data_venda,
                valor_total,
                'VENDA',
                peso || null, // Salva o peso ou null se não for fornecido
                data_pagamento || null, // Salva a data de pagamento ou null
                preco_manual || null, // Salva o preço manual ou null
                responsavel_venda || null // Salva o responsável
            ]
        );
        res.status(201).json(novaVenda.rows[0]);
    } catch (err) {
        console.error('Erro ao criar venda (log detalhado):', err.stack);
        res.status(500).json({ error: "Erro no servidor ao criar a venda." });
    }
});

module.exports = router;
