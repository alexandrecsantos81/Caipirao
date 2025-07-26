// =================================================================
//          FICHEIRO: backend/server.js (VERSÃO PÓS-MIGRAÇÃO)
// =================================================================
// DESCRIÇÃO: Servidor principal da API do Projeto Caipirão.
//            Utiliza Express, CORS e JWT para fornecer endpoints
//            seguros que interagem com um banco de dados PostgreSQL.
// =================================================================

// --- 1. Importação de Módulos Essenciais ---
require('dotenv').config(); // Carrega as variáveis de ambiente do ficheiro .env
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('./db'); // Importa a configuração de conexão com o banco de dados

// --- 2. Importação dos Módulos de Rota (Endpoints da API) ---
const clientesRouter = require('./routes/clientes');
const produtosRouter = require('./routes/produtos');
const movimentacoesRouter = require('./routes/movimentacoes');

// --- 3. Inicialização e Configuração do Express ---
const app = express();
const PORT = process.env.PORT || 3000;

// --- 4. Configuração de Middlewares ---

// a) Configuração do CORS (Cross-Origin Resource Sharing)
// Define quais origens (websites) podem fazer requisições para esta API.
const allowedOrigins = [
    'https://caipiraosys.netlify.app', // O seu frontend em produção
    'http://localhost:5500',          // Ambiente de desenvolvimento local (Live Server )
    'http://127.0.0.1:5500'           // Variação do localhost
];

const corsOptions = {
    origin: function (origin, callback ) {
        // Permite requisições sem 'origin' (ex: Postman) ou se a origem estiver na lista.
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Acesso não permitido pela política de CORS'));
        }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Métodos HTTP permitidos
};

app.use(cors(corsOptions)); // Aplica as configurações de CORS a todas as requisições.

// b) Middleware para processar JSON
// Habilita a API a entender e processar corpos de requisição no formato JSON.
app.use(express.json());

// --- 5. Definição das Rotas de Autenticação ---

// Rota para REGISTAR um novo utilizador
app.post('/auth/register', async (req, res) => {
    const { email, senha } = req.body;
    if (!email || !senha) {
        return res.status(400).json({ error: "Email e senha são obrigatórios." });
    }

    try {
        // Gera o hash da senha com um "sal" de 10 rounds
        const salt = await bcrypt.genSalt(10);
        const senhaHash = await bcrypt.hash(senha, salt);

        // Insere o novo utilizador no banco de dados
        const novoUtilizador = await pool.query(
            "INSERT INTO utilizadores (email, senha_hash) VALUES ($1, $2) RETURNING id, email",
            [email, senhaHash]
        );

        res.status(201).json({
            message: "Utilizador registado com sucesso!",
            user: novoUtilizador.rows[0]
        });

    } catch (err) {
        // Trata o erro de email duplicado
        if (err.code === '23505') {
            return res.status(409).json({ error: "Este email já está registado." });
        }
        console.error('Erro ao registar utilizador:', err.message);
        res.status(500).json({ error: "Erro no servidor ao registar utilizador." });
    }
});

// Rota para fazer LOGIN de um utilizador
app.post('/auth/login', async (req, res) => {
    const { email, senha } = req.body;
    if (!email || !senha) {
        return res.status(400).json({ error: "Email e senha são obrigatórios." });
    }

    try {
        // Procura o utilizador pelo email no banco de dados
        const result = await pool.query("SELECT * FROM utilizadores WHERE email = $1", [email]);
        const utilizador = result.rows[0];

        if (!utilizador) {
            return res.status(401).json({ error: "Credenciais inválidas." });
        }

        // Compara a senha fornecida com o hash guardado no banco
        const senhaCorreta = await bcrypt.compare(senha, utilizador.senha_hash);
        if (!senhaCorreta) {
            return res.status(401).json({ error: "Credenciais inválidas." });
        }

        // Se as credenciais estiverem corretas, gera um token JWT
        const token = jwt.sign(
            { 
                email: utilizador.email, 
                id: utilizador.id,
                perfil: utilizador.perfil // <--- ALTERAÇÃO APLICADA AQUI
            },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.json({ token });

    } catch (err) {
        console.error('Erro no login:', err.message);
        res.status(500).json({ error: "Erro no servidor durante o login." });
    }
});



// --- 6. Middleware de Verificação de Token JWT ---
// Este middleware será aplicado às rotas de dados para protegê-las.
function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Extrai o token do cabeçalho "Bearer TOKEN"

    if (token == null) {
        return res.status(401).json({ error: "Acesso negado. Nenhum token fornecido." });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: "Token inválido ou expirado." });
        }
        req.user = user; // Adiciona os dados do utilizador (payload) à requisição
        next(); // O token é válido, a requisição pode prosseguir para a rota final.
    });
}

// --- 7. Definição das Rotas de Dados da API (Protegidas) ---
// Todas as requisições para estes endpoints devem passar primeiro pelo `verifyToken`.
app.use('/api/clientes', verifyToken, clientesRouter);
app.use('/api/produtos', verifyToken, produtosRouter);
app.use('/api/movimentacoes', verifyToken, movimentacoesRouter);


// --- 8. Inicialização do Servidor ---
app.listen(PORT, () => {
    console.log(`✅ Servidor limpo e refatorado a correr na porta ${PORT}`);
});
