// /backend/routes/movimentacoes.js
const express = require('express');
const router = express.Router();
const pool = require('../db');

// ROTA GET (Leitura) - Listar todas as VENDAS (ENTRADAS)
router.get('/', async (req, res) => {
    try {
        // Query revisada para garantir que todos os campos necessários para o frontend sejam retornados
        // com nomes consistentes.
        const query = `
            SELECT
                m.id,
                m.data AS data_venda,
                m.descricao AS produto_nome,
                m.valor AS valor_total,
                c.nome AS cliente_nome,
                m.cliente_id,
                m.peso,
                m.data_pagamento,
                m.preco_manual,
                m.responsavel AS responsavel_venda
            FROM movimentacoes AS m
            LEFT JOIN clientes AS c ON m.cliente_id = c.id
            WHERE m.tipo = 'ENTRADA'
            ORDER BY m.data DESC, m.id DESC;
        `;
        const { rows } = await pool.query(query);
        // Retorna as linhas encontradas. Se não houver nenhuma, retornará um array vazio [].
        res.json(rows);
    } catch (err) {
        console.error('Erro detalhado ao buscar vendas:', err.stack);
        res.status(500).json({ error: "Erro no servidor ao buscar vendas." });
    }
});

// As rotas POST, PUT, e DELETE permanecem as mesmas da correção anterior.
// ... (código de POST, PUT, DELETE)
router.post('/', async (req, res) => {
    const { cliente_id, produto_nome, data_venda, valor_total, peso_produto, data_pagamento, preco_manual, responsavel_venda } = req.body;
    if (!cliente_id || !produto_nome || !data_venda || !valor_total) {
        return res.status(400).json({ error: "Cliente, produto, data da venda e valor são obrigatórios." });
    }
    try {
        const novaVenda = await pool.query(
            `INSERT INTO movimentacoes (tipo, cliente_id, descricao, data, valor, categoria, peso, data_pagamento, preco_manual, responsavel)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
            ['ENTRADA', cliente_id, produto_nome, data_venda, valor_total, 'VENDA', peso_produto || null, data_pagamento || null, preco_manual || null, responsavel_venda || null]
        );
        res.status(201).json(novaVenda.rows[0]);
    } catch (err) {
        console.error('Erro ao criar venda:', err.stack);
        res.status(500).json({ error: "Erro no servidor ao criar a venda." });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { cliente_id, produto_nome, data_venda, valor_total, peso_produto, data_pagamento, preco_manual, responsavel_venda } = req.body;
        if (!cliente_id || !produto_nome || !data_venda || !valor_total) {
            return res.status(400).json({ error: "Todos os campos principais são obrigatórios." });
        }
        const vendaAtualizada = await pool.query(
            `UPDATE movimentacoes SET 
                cliente_id = $1, descricao = $2, data = $3, valor = $4, peso = $5, 
                data_pagamento = $6, preco_manual = $7, responsavel = $8
             WHERE id = $9 AND tipo = 'ENTRADA' RETURNING *`,
            [cliente_id, produto_nome, data_venda, valor_total, peso_produto || null, data_pagamento || null, preco_manual || null, responsavel_venda || null, id]
        );
        if (vendaAtualizada.rowCount === 0) {
            return res.status(404).json({ error: "Venda não encontrada para atualização." });
        }
        res.json(vendaAtualizada.rows[0]);
    } catch (err) {
        console.error('Erro ao atualizar venda:', err.stack);
        res.status(500).json({ error: "Erro no servidor ao atualizar a venda." });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const resultadoDelete = await pool.query("DELETE FROM movimentacoes WHERE id = $1 AND tipo = 'ENTRADA' RETURNING *", [id]);
        if (resultadoDelete.rowCount === 0) {
            return res.status(404).json({ error: "Venda não encontrada para exclusão." });
        }
        res.json({ message: "Venda apagada com sucesso." });
    } catch (err) {
        console.error('Erro ao apagar venda:', err.stack);
        res.status(500).json({ error: "Erro no servidor ao apagar a venda." });
    }
});


module.exports = router;
