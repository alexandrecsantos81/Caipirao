const express = require('express');
const router = express.Router();
const pool = require('../db'); // Vamos criar este ficheiro de conexão a seguir

// ROTA GET (Leitura) - Para buscar todos os clientes
// GET /api/clientes/
router.get('/', async (req, res) => {
    try {
        // Executa a query no banco de dados usando o pool de conexões
        const todosClientes = await pool.query(
            "SELECT id, nome, contato, endereco FROM clientes ORDER BY nome ASC"
        );

        // Retorna os resultados como JSON. A propriedade .rows contém os dados.
        res.json(todosClientes.rows);

    } catch (err) {
        // Em caso de erro no servidor ou no banco, loga o erro e envia uma resposta 500
        console.error('Erro ao buscar clientes:', err.message);
        res.status(500).json({ error: "Erro no servidor ao buscar clientes." });
    }
});

// ROTA POST (Criação) - Para adicionar um novo cliente
// POST /api/clientes/
router.post('/', async (req, res) => {
    try {
        // 1. Extrai os dados do corpo da requisição (req.body)
        const { nome, contato, endereco } = req.body;

        // 2. Validação simples: verifica se o nome foi fornecido
        if (!nome) {
            return res.status(400).json({ error: "O campo 'nome' é obrigatório." });
        }

        // 3. Executa a query de inserção no banco de dados
        // A sintaxe ($1, $2, $3) é uma medida de segurança (previne SQL Injection)
        const novoCliente = await pool.query(
            "INSERT INTO clientes (nome, contato, endereco) VALUES ($1, $2, $3) RETURNING *",
            [nome, contato, endereco]
        );

        // 4. Retorna o cliente recém-criado com o status 201 (Created)
        // O resultado da query de inserção com "RETURNING *" está em novoCliente.rows[0]
        res.status(201).json(novoCliente.rows[0]);

    } catch (err) {
        console.error('Erro ao criar cliente:', err.message);
        res.status(500).json({ error: "Erro no servidor ao criar cliente." });
    }
});

// ROTA PUT (Atualização) - Para editar um cliente existente
// PUT /api/clientes/:id
router.put('/:id', async (req, res) => {
    // A lógica para atualizar um cliente no PostgreSQL virá aqui
    try {
        // 1. Extrai o ID dos parâmetros da URL e os novos dados do corpo
        const { id } = req.params;
        const { nome, contato, endereco } = req.body;

        // 2. Validação simples: verifica se o nome foi fornecido
        if (!nome) {
            return res.status(400).json({ error: "O campo 'nome' é obrigatório." });
        }

        // 3. Executa a query de atualização no banco
        const clienteAtualizado = await pool.query(
            "UPDATE clientes SET nome = $1, contato = $2, endereco = $3 WHERE id = $4 RETURNING *",
            [nome, contato, endereco, id]
        );

        // 4. Verifica se a atualização realmente aconteceu
        // Se a query não encontrou um cliente com o ID fornecido, .rowCount será 0
        if (clienteAtualizado.rowCount === 0) {
            return res.status(404).json({ error: "Cliente não encontrado." });
        }

        // 5. Retorna o cliente com os dados atualizados
        res.json(clienteAtualizado.rows[0]);

    } catch (err) {
        console.error('Erro ao atualizar cliente:', err.message);
        res.status(500).json({ error: "Erro no servidor ao atualizar cliente." });
    }
});

// ROTA DELETE (Exclusão) - Para apagar um cliente
// DELETE /api/clientes/:id
router.delete('/:id', async (req, res) => {
    try {
        // 1. Extrai o ID dos parâmetros da URL
        const { id } = req.params;

        // 2. Executa a query de exclusão no banco
        const resultadoDelete = await pool.query(
            "DELETE FROM clientes WHERE id = $1 RETURNING *",
            [id]
        );

        // 3. Verifica se a exclusão realmente aconteceu
        // Se a query não encontrou um cliente com o ID, .rowCount será 0
        if (resultadoDelete.rowCount === 0) {
            return res.status(404).json({ error: "Cliente não encontrado." });
        }

        // 4. Retorna uma mensagem de sucesso
        // É comum em rotas DELETE retornar uma mensagem ou o objeto que foi apagado
        res.json({ 
            message: "Cliente apagado com sucesso.",
            cliente: resultadoDelete.rows[0] 
        });

    } catch (err) {
        console.error('Erro ao apagar cliente:', err.message);
        res.status(500).json({ error: "Erro no servidor ao apagar cliente." });
    }
});


module.exports = router; // Exporta o roteador para ser usado no server.js
