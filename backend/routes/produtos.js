const express = require('express');
const router = express.Router();
const pool = require('../db'); // Reutiliza a conexão com o banco de dados

// ROTA GET (Leitura) - Para buscar todos os produtos
// GET /api/produtos/
router.get('/', async (req, res) => {
    try {
        // Executa a query na tabela de produtos, ordenando por nome
        const todosProdutos = await pool.query(
            "SELECT id, nome, descricao, preco FROM produtos ORDER BY nome ASC"
        );

        // Retorna os resultados como JSON
        res.json(todosProdutos.rows);

    } catch (err) {
        console.error('Erro ao buscar produtos:', err.message);
        res.status(500).json({ error: "Erro no servidor ao buscar produtos." });
    }
});

// ROTA POST (Criação) - Para adicionar um novo produto
// POST /api/produtos/
router.post('/', async (req, res) => {
    try {
        // 1. Extrai os dados do corpo da requisição
        const { nome, descricao, preco } = req.body;

        // 2. Validação: verifica se nome e preço foram fornecidos
        if (!nome || !preco) {
            return res.status(400).json({ error: "Os campos 'nome' e 'preco' são obrigatórios." });
        }

        // 3. Executa a query de inserção no banco de dados
        const novoProduto = await pool.query(
            "INSERT INTO produtos (nome, descricao, preco) VALUES ($1, $2, $3) RETURNING *",
            [nome, descricao, preco]
        );

        // 4. Retorna o produto recém-criado com o status 201 (Created)
        res.status(201).json(novoProduto.rows[0]);

    } catch (err) {
        console.error('Erro ao criar produto:', err.message);
        res.status(500).json({ error: "Erro no servidor ao criar produto." });
    }
});

// ROTA PUT (Atualização) - Para editar um produto existente
// PUT /api/produtos/:id
router.put('/:id', async (req, res) => {
    try {
        // 1. Extrai o ID dos parâmetros da URL e os novos dados do corpo
        const { id } = req.params;
        const { nome, descricao, preco } = req.body;

        // 2. Validação: verifica se nome e preço foram fornecidos
        if (!nome || preco === null || preco === undefined) {
            return res.status(400).json({ error: "Os campos 'nome' e 'preco' são obrigatórios." });
        }

        // 3. Executa a query de atualização no banco
        const produtoAtualizado = await pool.query(
            "UPDATE produtos SET nome = $1, descricao = $2, preco = $3 WHERE id = $4 RETURNING *",
            [nome, descricao, preco, id]
        );

        // 4. Verifica se a atualização realmente aconteceu
        if (produtoAtualizado.rowCount === 0) {
            return res.status(404).json({ error: "Produto não encontrado." });
        }

        // 5. Retorna o produto com os dados atualizados
        res.json(produtoAtualizado.rows[0]);

    } catch (err) {
        console.error('Erro ao atualizar produto:', err.message);
        res.status(500).json({ error: "Erro no servidor ao atualizar produto." });
    }
});

// ROTA DELETE (Exclusão) - Para apagar um produto
// DELETE /api/produtos/:id
router.delete('/:id', async (req, res) => {
    try {
        // 1. Extrai o ID dos parâmetros da URL
        const { id } = req.params;

        // 2. Executa a query de exclusão no banco
        const resultadoDelete = await pool.query(
            "DELETE FROM produtos WHERE id = $1 RETURNING *",
            [id]
        );

        // 3. Verifica se a exclusão realmente aconteceu
        if (resultadoDelete.rowCount === 0) {
            return res.status(404).json({ error: "Produto não encontrado." });
        }

        // 4. Retorna uma mensagem de sucesso
        res.json({ 
            message: "Produto apagado com sucesso.",
            produto: resultadoDelete.rows[0] 
        });

    } catch (err) {
        console.error('Erro ao apagar produto:', err.message);
        res.status(500).json({ error: "Erro no servidor ao apagar produto." });
    }
});

module.exports = router; // Exporta o roteador para ser usado no server.js
