// /backend/server.js

// --- 1. Importação de Módulos Essenciais ---
const { verifyToken } = require('./middleware/authMiddleware');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('./db');
require('dotenv').config(); // Garante que as variáveis de ambiente sejam carregadas

// --- 2. Importação dos Módulos de Rota (Endpoints da API) ---
const clientesRouter = require('./routes/clientes');
const produtosRouter = require('./routes/produtos');
const movimentacoesRouter = require('./routes/movimentacoes');
const despesasRouter = require('./routes/despesas'); // Importa a nova rota de despesas

// --- 3. Inicialização e Configuração do Express ---
const app = express();
const PORT = process.env.PORT || 3000;

// --- 4. Configuração de Middlewares ---

// a) Configuração do CORS
const allowedOrigins = [
    'https://caipirao.netlify.app', // <<< ADICIONE ESTA LINHA
    'https://caipiraosys.netlify.app',
    'http://localhost:5173',
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'http://localhost:8080',
    'http://127.0.0.1:8080'
];
const corsOptions = {
    origin: function (origin, callback ) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Acesso não permitido pela política de CORS'));
        }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
};
app.use(cors(corsOptions));

// b) Middleware para processar JSON
app.use(express.json());

// --- 5. Definição das Rotas de Autenticação (Não protegidas) ---

// Rota para REGISTAR um novo utilizador
app.post('/auth/register', async (req, res) => {
    // ... (código de registro continua o mesmo)
    const { email, senha } = req.body;
    if (!email || !senha) {
        return res.status(400).json({ error: "Email e senha são obrigatórios." });
    }
    try {
        const salt = await bcrypt.genSalt(10);
        const senhaHash = await bcrypt.hash(senha, salt);
        const novoUtilizador = await pool.query(
            "INSERT INTO utilizadores (email, senha_hash) VALUES ($1, $2) RETURNING id, email",
            [email, senhaHash]
        );
        res.status(201).json({
            message: "Utilizador registado com sucesso!",
            user: novoUtilizador.rows[0]
        });
    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({ error: "Este email já está registado." });
        }
        console.error('Erro ao registar utilizador:', err.message);
        res.status(500).json({ error: "Erro no servidor ao registar utilizador." });
    }
});

// Rota para fazer LOGIN de um utilizador
app.post('/auth/login', async (req, res) => {
    // ... (código de login continua o mesmo)
    const { email, senha } = req.body;
    console.log('\n--- Nova Tentativa de Login ---');
    console.log('Email recebido:', email);
    console.log('Senha recebida (primeiros caracteres):', senha ? senha.substring(0, 3) + '...' : '(vazia)');
    if (!email || !senha) {
        return res.status(400).json({ error: "Email e senha são obrigatórios." });
    }
    try {
        const result = await pool.query("SELECT * FROM utilizadores WHERE email = $1", [email]);
        const utilizador = result.rows[0];
        if (!utilizador) {
            console.log('Resultado da consulta: Usuário não encontrado.');
            return res.status(401).json({ error: "Credenciais inválidas." });
        }
        console.log('Usuário encontrado:', utilizador.email);
        console.log('Hash da senha no banco:', utilizador.senha_hash);
        const senhaCorreta = await bcrypt.compare(senha, utilizador.senha_hash);
        console.log('Resultado da comparação de senha (bcrypt):', senhaCorreta);
        if (!senhaCorreta) {
            console.log('Motivo da falha: Senhas não correspondem.');
            return res.status(401).json({ error: "Credenciais inválidas." });
        }
        console.log('Login bem-sucedido! Gerando token JWT...');
        const token = jwt.sign(
            { email: utilizador.email, id: utilizador.id, perfil: utilizador.perfil },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );
        res.json({ token });
    } catch (err) {
        console.error('ERRO INESPERADO no bloco de login:', err.message);
        res.status(500).json({ error: "Erro no servidor durante o login." });
    }
});

/**
 * --- 6. Definição das Rotas de Dados da API (Protegidas) ---
 * CORREÇÃO: Removidas as linhas duplicadas e incorretas.
 * Todas as rotas sob '/api' agora exigem um token válido.
 */
app.use('/api/clientes', verifyToken, clientesRouter);
app.use('/api/produtos', verifyToken, produtosRouter);
app.use('/api/movimentacoes', verifyToken, movimentacoesRouter);
app.use('/api/despesas', verifyToken, despesasRouter); // Adicionada a proteção de token

// --- 7. Inicialização do Servidor ---
app.listen(PORT, () => {
    console.log(`✅ Servidor limpo e refatorado a correr na porta ${PORT}`);
});
