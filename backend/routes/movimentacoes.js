const express = require('express');
const router = express.Router();
const pool = require('../db'); // Importa a nossa conexão com o PostgreSQL

// GET /api/movimentacoes - Listar todas as movimentações
router.get('/', async (req, res) => {
try {
    const todasMovimentacoes = await pool.query(
        `SELECT
            m.id,
            m.data,
            m.tipo,
            m.categoria,
            m.descricao,
            m.valor,
            m.responsavel,
            m.observacoes,
            c.nome AS cliente_nome -- Usamos um alias para clareza
        FROM
            movimentacoes m
        LEFT JOIN
            clientes c ON m.cliente_id = c.id
        ORDER BY
            m.data DESC, m.id DESC` // Ordena pela data mais recente
    );

    res.json(todasMovimentacoes.rows);

} catch (err) {
    console.error('Erro ao buscar movimentações:', err.message);
    res.status(500).json({ error: "Erro no servidor ao buscar movimentações." });
}});

// POST /api/movimentacoes - Criar uma nova movimentação
router.post('/', async (req, res) => {
// DENTRO DE: router.post('/', async (req, res) => { ... });

try {
    // 1. Extrai os dados do corpo da requisição, incluindo o nome do cliente
    const { data, tipo, categoria, descricao, valor, responsavel, observacoes, cliente } = req.body;

    // Validação básica
    if (!data || !tipo || !categoria || !descricao || !valor) {
        return res.status(400).json({ error: "Campos obrigatórios em falta." });
    }

    let clienteId = null;

    // 2. Se um nome de cliente foi enviado, busca o ID correspondente
    if (cliente && cliente.trim() !== '') {
        const clienteResult = await pool.query(
            "SELECT id FROM clientes WHERE nome = $1",
            [cliente.toUpperCase()] // Busca pelo nome em maiúsculas para consistência
        );

        if (clienteResult.rows.length > 0) {
            clienteId = clienteResult.rows[0].id;
        } else {
            // Se o cliente não for encontrado, retorna um erro claro
            return res.status(404).json({ error: `Cliente '${cliente}' não encontrado no banco de dados.` });
        }
    }

    // 3. Insere a nova movimentação no banco com o cliente_id correto (pode ser null)
    const novaMovimentacao = await pool.query(
        `INSERT INTO movimentacoes
            (data, tipo, categoria, descricao, valor, responsavel, observacoes, cliente_id)
         VALUES
            ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [data, tipo.toUpperCase(), categoria.toUpperCase(), descricao, valor, responsavel, observacoes, clienteId]
    );

    res.status(201).json(novaMovimentacao.rows[0]);

} catch (err) {
    console.error('Erro ao criar movimentação:', err.message);
    res.status(500).json({ error: "Erro no servidor ao criar movimentação." });
}

});

// PUT /api/movimentacoes/:id - Atualizar uma movimentação
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        // =====> MUDANÇA 1: O nome do cliente vem como 'cliente_nome' do formulário de edição <=====
        const { data, tipo, categoria, descricao, valor, responsavel, observacoes, cliente_nome } = req.body;

        let clienteId = null;
        // =====> MUDANÇA 2: A lógica para encontrar o ID do cliente deve usar 'cliente_nome' <=====
        if (cliente_nome && cliente_nome.trim() !== '') {
            const clienteResult = await pool.query("SELECT id FROM clientes WHERE nome = $1", [cliente_nome.toUpperCase()]);
            if (clienteResult.rows.length > 0) {
                clienteId = clienteResult.rows[0].id;
            } else {
                // Se o cliente não for encontrado, podemos optar por não falhar, apenas deixar o ID nulo,
                // ou retornar um erro. Deixar nulo é mais flexível.
                console.warn(`Cliente '${cliente_nome}' não encontrado ao atualizar. O cliente_id será definido como nulo.`);
            }
        }

        const movimentacaoAtualizada = await pool.query(
            `UPDATE movimentacoes
             SET data = $1, tipo = $2, categoria = $3, descricao = $4, valor = $5, responsavel = $6, observacoes = $7, cliente_id = $8
             WHERE id = $9
             RETURNING *`,
            // =====> MUDANÇA 3: Corrigido o array de valores <=====
            [
                data,
                tipo.toUpperCase(),
                categoria.toUpperCase(),
                descricao, // Descrição geralmente não deve ser forçada para maiúsculas
                valor,
                responsavel, // Responsável também pode manter o case original
                observacoes,
                clienteId,
                id
            ]
        );

        if (movimentacaoAtualizada.rowCount === 0) {
            return res.status(404).json({ error: "Movimentação não encontrada." });
        }

        res.json(movimentacaoAtualizada.rows[0]);

    } catch (err) {
        console.error('Erro ao atualizar movimentação:', err.message);
        res.status(500).json({ error: "Erro no servidor ao atualizar movimentação." });
    }
});

// DELETE /api/movimentacoes/:id - Apagar uma movimentação
router.delete('/:id', async (req, res) => {
// DENTRO DE: router.delete('/:id', async (req, res) => { ... });

try {
    const { id } = req.params;
    const resultadoDelete = await pool.query(
        "DELETE FROM movimentacoes WHERE id = $1 RETURNING *",
        [id]
    );

    if (resultadoDelete.rowCount === 0) {
        return res.status(404).json({ error: "Movimentação não encontrada." });
    }

    res.json({
        message: "Movimentação apagada com sucesso.",
        movimentacao: resultadoDelete.rows[0]
    });

} catch (err) {
    console.error('Erro ao apagar movimentação:', err.message);
    res.status(500).json({ error: "Erro no servidor ao apagar movimentação." });
}

});

module.exports = router; // Exporta o router para ser usado no server.js
