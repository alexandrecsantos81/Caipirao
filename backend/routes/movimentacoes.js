const express = require('express');
const router = express.Router();
const pool = require('../db'); // Importa a nossa conexão com o PostgreSQL
const { checkAdmin } = require('../middleware/authMiddleware');

// GET /api/movimentacoes - Listar todas as movimentações
router.get('/', async (req, res) => {
    try {
        // Query SQL para buscar movimentações e juntar o nome do cliente
        const query = `
            SELECT
                m.id,
                m.data,
                m.tipo,
                m.categoria,
                m.descricao,
                m.valor,
                m.responsavel,
                m.observacoes,
                c.nome AS cliente_nome
            FROM
                movimentacoes AS m
            LEFT JOIN
                clientes AS c ON m.cliente_id = c.id
            ORDER BY
                m.data DESC, m.id DESC;
        `;
        
        const todasMovimentacoes = await pool.query(query);

        res.json(todasMovimentacoes.rows);

    } catch (err) {
        console.error('Erro detalhado ao buscar movimentações:', err.stack);
        res.status(500).json({ error: "Erro no servidor ao buscar movimentações." });
    }
});

// POST /api/movimentacoes - Criar uma nova movimentação
router.post('/', async (req, res) => {
    let valorParaBanco; // Declarado aqui para estar disponível no bloco catch
    const { data, tipo, categoria, descricao, valor, responsavel, observacoes, cliente } = req.body;

    try {
        // Validação básica de campos obrigatórios
        if (!data || !tipo || !categoria || !descricao || !valor) {
            return res.status(400).json({ error: "Campos obrigatórios em falta." });
        }

        let clienteId = null;

        // Se um nome de cliente foi enviado, busca o ID correspondente
        if (cliente && cliente.trim() !== '') {
            // CORREÇÃO 1: Busca insensível a maiúsculas/minúsculas
            const clienteResult = await pool.query(
                "SELECT id FROM clientes WHERE UPPER(nome) = $1",
                [cliente.toUpperCase()]
            );

            if (clienteResult.rows.length > 0) {
                clienteId = clienteResult.rows[0].id;
            } else {
                return res.status(404).json({ error: `Cliente '${cliente}' não encontrado no banco de dados.` });
            }
        }

        // CORREÇÃO 2: Lógica robusta para tratar o valor numérico
        const valorString = String(valor);
        const semPontos = valorString.replace(/\./g, ''); // Remove separadores de milhar
        valorParaBanco = semPontos.replace(',', '.');   // Substitui vírgula decimal por ponto

        // Insere a nova movimentação no banco com os dados tratados
        const novaMovimentacao = await pool.query(
            `INSERT INTO movimentacoes
                (data, tipo, categoria, descricao, valor, responsavel, observacoes, cliente_id)
             VALUES
                ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING *`,
            [data, tipo.toUpperCase(), categoria.toUpperCase(), descricao, valorParaBanco, responsavel, observacoes, clienteId]
        );

        res.status(201).json(novaMovimentacao.rows[0]);

    } catch (err) {
        // Log de erro aprimorado para depuração
        if (err.message.includes('invalid input syntax for type numeric')) {
            console.error(`Erro de conversão de valor. Valor recebido: '${valor}'. Valor após tratamento: '${valorParaBanco}'.`);
        }
        console.error('Erro ao criar movimentação:', err.message);
        res.status(500).json({ error: "Erro no servidor ao criar movimentação." });
    }
});

// PUT /api/movimentacoes/:id - Atualizar uma movimentação
router.put('/:id', async (req, res) => {
    let valorParaBanco; // Declarado aqui para estar disponível no bloco catch
    const { id } = req.params;
    const { data, tipo, categoria, descricao, valor, responsavel, observacoes, cliente_nome } = req.body;

    try {
        let clienteId = null;
        if (cliente_nome && cliente_nome.trim() !== '') {
            const clienteResult = await pool.query("SELECT id FROM clientes WHERE UPPER(nome) = $1", [cliente_nome.toUpperCase()]);
            if (clienteResult.rows.length > 0) {
                clienteId = clienteResult.rows[0].id;
            } else {
                console.warn(`Cliente '${cliente_nome}' não encontrado ao atualizar. O cliente_id será definido como nulo.`);
            }
        }

        // Aplica a mesma lógica robusta de tratamento de valor na atualização
        const valorString = String(valor);
        const semPontos = valorString.replace(/\./g, '');
        valorParaBanco = semPontos.replace(',', '.');

        const movimentacaoAtualizada = await pool.query(
            `UPDATE movimentacoes
             SET data = $1, tipo = $2, categoria = $3, descricao = $4, valor = $5, responsavel = $6, observacoes = $7, cliente_id = $8
             WHERE id = $9
             RETURNING *`,
            [data, tipo.toUpperCase(), categoria.toUpperCase(), descricao, valorParaBanco, responsavel, observacoes, clienteId, id]
        );

        if (movimentacaoAtualizada.rowCount === 0) {
            return res.status(404).json({ error: "Movimentação não encontrada." });
        }

        res.json(movimentacaoAtualizada.rows[0]);

    } catch (err) {
        if (err.message.includes('invalid input syntax for type numeric')) {
            console.error(`Erro de conversão de valor. Valor recebido: '${valor}'. Valor após tratamento: '${valorParaBanco}'.`);
        }
        console.error('Erro ao atualizar movimentação:', err.message);
        res.status(500).json({ error: "Erro no servidor ao atualizar movimentação." });
    }
});

// DELETE /api/movimentacoes/:id - Apagar uma movimentação (Protegida)
router.delete('/:id', checkAdmin, async (req, res) => {
    // Apenas utilizadores com perfil 'ADMIN' chegarão a este ponto.
    try {
        const { id } = req.params;
        const deleteQuery = await pool.query('DELETE FROM movimentacoes WHERE id = $1 RETURNING *', [id]);
        
        if (deleteQuery.rowCount === 0) {
            return res.status(404).json({ error: 'Movimentação não encontrada.' });
        }
        
        res.json({ message: 'Movimentação apagada com sucesso.', data: deleteQuery.rows[0] });

    } catch (err) {
        console.error('Erro ao apagar movimentação:', err.message);
        res.status(500).json({ error: 'Erro no servidor ao apagar movimentação.' });
    }
});

module.exports = router; // Exporta o router para ser usado no server.js
