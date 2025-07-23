require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const clientesRouter = require('./routes/clientes');
const produtosRouter = require('./routes/produtos');
const movimentacoesRouter = require('./routes/movimentacoes');
const app = express();
const PORT = process.env.PORT || 3000;

// --- Middlewares Essenciais ---

// Lista de origens permitidas
const allowedOrigins = [
    'https://caipiraosys.netlify.app',
    'http://localhost:5500', // Para testes com o Live Server
    'http://127.0.0.1:5500'  // Outra variação do localhost
];

// Configuração do CORS
const corsOptions = {
    origin: function (origin, callback ) {
        // Permite requisições sem 'origin' (como Postman, apps mobile, etc.)
        // ou se a origem estiver na lista de permitidas.
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Não permitido pela política de CORS'));
        }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Garante que todos os métodos HTTP são permitidos
    credentials: true // Se você precisar lidar com cookies ou headers de autorização
};


// --- Middlewares Essenciais ---

app.use(cors(corsOptions)); // <-- 1. PRIMEIRO: Aplica as políticas de CORS a TODAS as requisições.
app.use(express.json()); // <-- 2. SEGUNDO: Habilita o processamento de JSON para TODAS as rotas que precisarem.
app.use('/api/clientes', clientesRouter); // <-- 3. TERCEIRO: Agora, direcione as requisições para os roteadores corretos.
app.use('/api/produtos', produtosRouter);
app.use('/api/movimentacoes', movimentacoesRouter);

// --- Configuração da Autenticação Google ---
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
console.log('--- DIAGNÓSTICO: SPREADSHEET_ID a ser usado:', SPREADSHEET_ID, '---');

// --- NOVA CONFIGURAÇÃO DE AUTENTICAÇÃO OAUTH 2.0 ---
const { OAuth2 } = google.auth;
const oauth2Client = new OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    "https://developers.google.com/oauthplayground" // Redirect URL
 );

oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN
});

// O 'auth' a ser usado nas chamadas da API agora é o oauth2Client
const auth = oauth2Client;
// --- FIM DA NOVA CONFIGURAÇÃO ---

// --- ROTAS DA API (Dados) ---

// Rota para buscar dados de uma aba
app.get('/api/:sheetName', verifyToken, async (req, res) => {
    let { sheetName } = req.params;
    const originalSheetName = sheetName;
    const allowedSheets = { movimentacoes: '_Movimentacoes', clientes: 'Clientes', produtos: 'Produtos' };
    const actualSheetName = allowedSheets[sheetName.toLowerCase()];

    if (!actualSheetName) {
        return res.status(400).send('Nome da planilha inválido.');
    }

    try {
        const sheets = google.sheets({ version: 'v4', auth });
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: actualSheetName,
        });
        res.json(response.data.values);
    } catch (error) {
        console.error(`Erro ao buscar dados da aba ${originalSheetName}:`, error.message);
        res.status(500).send(`Erro ao buscar dados da aba ${originalSheetName}.`);
    }
});

// SUBSTITUA A SUA ROTA POST ANTIGA POR ESTA VERSÃO COMPLETA E CORRIGIDA
app.post('/api/:sheetName', verifyToken, async (req, res) => {
    const { sheetName } = req.params;
    const receivedData = req.body; // Dados que vêm do formulário do frontend

    const allowedSheets = { movimentacoes: '_Movimentacoes', clientes: 'Clientes', produtos: 'Produtos' };
    const actualSheetName = allowedSheets[sheetName.toLowerCase()];

    if (!actualSheetName) {
        return res.status(400).send('Erro: Nome da planilha inválido.');
    }

    console.log(`--- INICIANDO ADIÇÃO NA ABA: ${actualSheetName} ---`);
    console.log('Dados recebidos do frontend:', receivedData);

    try {
        const sheets = google.sheets({ version: 'v4', auth });

        // Passo 1: Ler os cabeçalhos da planilha para saber a ordem correta das colunas
        const headerResponse = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: `${actualSheetName}!1:1`, // Pega apenas a primeira linha (cabeçalhos)
        });

        const headers = headerResponse.data.values[0];
        if (!headers || headers.length === 0) {
            return res.status(500).send('Erro: Não foi possível ler os cabeçalhos da planilha de destino.');
        }
        console.log('Cabeçalhos lidos da planilha:', headers);

        // Passo 2: Gerar um ID único para a nova linha
        const generatedId = Date.now().toString().slice(-6) + Math.floor(Math.random() * 100);
        const idColumnName = actualSheetName === '_Movimentacoes' ? 'ID Mov.' : 'ID';

        // Passo 3: Construir a nova linha (newRow) dinamicamente, na ordem correta dos cabeçalhos
        const newRow = headers.map(header => {
            // Trata a coluna de ID
            if (header === idColumnName) {
                return generatedId;
            }

            // Procura a chave correspondente nos dados recebidos (ignorando maiúsculas/minúsculas)
            const receivedDataKey = Object.keys(receivedData).find(key => key.toLowerCase() === header.toLowerCase());
            
            if (receivedDataKey) {
                const value = receivedData[receivedDataKey];
                // Converte valores numéricos (Valor, Preço) para o formato correto
                if ((header.toLowerCase() === 'valor' || header.toLowerCase() === 'preço') && value) {
                    return parseFloat(String(value).replace(',', '.'));
                }
                return value; // Retorna o valor como está para outras colunas
            }

            return ''; // Retorna uma string vazia se não houver dado correspondente
        });

        console.log('Linha montada para inserção:', newRow);

        // Passo 4: Adicionar a linha construída à planilha
        await sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: actualSheetName,
            valueInputOption: 'USER_ENTERED', // Permite que o Google Sheets interprete os dados (ex: formate como moeda)
            resource: { values: [newRow] },
        });

        console.log('--- SUCESSO: Dados adicionados na planilha. ---');
        res.status(201).send({ message: 'Dados adicionados com sucesso!', id: generatedId });

    } catch (error) {
        console.error(`!!! ERRO AO ADICIONAR DADOS NA ABA ${actualSheetName} !!!`, error.message);
        res.status(500).send(`Erro no servidor ao adicionar dados: ${error.message}`);
    }
});




// Rota para apagar uma linha (VERSÃO FINALÍSSIMA CORRIGIDA)
app.delete('/api/:sheetName', verifyToken, async (req, res) => {
    const { sheetName } = req.params;
    const { id, sheetId } = req.query;

    if (!['movimentacoes', 'clientes', 'produtos'].includes(sheetName.toLowerCase())) { return res.status(400).send('Nome da planilha inválido.'); }
    if (!id) { return res.status(400).send('O ID do registo é obrigatório para a exclusão.'); }
    if (!sheetId) { return res.status(400).send('O ID da aba (sheetId) é obrigatório.'); }

    try {
        const sheets = google.sheets({ version: 'v4', auth });
        const allowedSheets = { movimentacoes: '_Movimentacoes', clientes: 'Clientes', produtos: 'Produtos' };
        const actualSheetName = allowedSheets[sheetName.toLowerCase()];

        const getRows = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: actualSheetName });
        const allData = getRows.data.values || [];
        const headers = allData[0];
        
        // LÓGICA CORRIGIDA PARA ENCONTRAR A COLUNA DE ID
        const idColumnName = actualSheetName === '_Movimentacoes' ? 'ID Mov.' : 'ID';
        const idColumnIndex = headers.findIndex(header => header === idColumnName);

        if (idColumnIndex === -1) { return res.status(500).send(`A coluna "${idColumnName}" não foi encontrada na planilha.`); }

        let targetRowIndex = -1;
        for (let i = 1; i < allData.length; i++) {
            if (allData[i][idColumnIndex] === id) {
                targetRowIndex = i;
                break;
            }
        }

        if (targetRowIndex === -1) { return res.status(404).send(`Registo com ID "${id}" não encontrado.`); }

        await sheets.spreadsheets.batchUpdate({
            spreadsheetId: SPREADSHEET_ID,
            resource: {
                requests: [{
                    deleteDimension: {
                        range: {
                            sheetId: parseInt(sheetId, 10),
                            dimension: 'ROWS',
                            startIndex: targetRowIndex,
                            endIndex: targetRowIndex + 1
                        }
                    }
                }]
            }
        });

        console.log(`SUCESSO: Linha física ${targetRowIndex} deletada na API do Google.`);
        res.status(200).send(`Registo com ID ${id} deletado com sucesso.`);

    } catch (error) {
        console.error('!!! ERRO DA API DO GOOGLE AO TENTAR DELETAR A LINHA FÍSICA !!!');
        console.error(error.message);
        res.status(500).send(`Erro no servidor ao deletar a linha: ${error.message}`);
    }
});


    // VERSÃO COM COMPARAÇÃO INSENSÍVEL A MAIÚSCULAS/MINÚSCULAS
    app.put('/api/:sheetName', verifyToken, async (req, res) => {
        const { sheetName } = req.params;
        const updatedData = req.body;
        const { id } = updatedData;

        if (!id) {
            return res.status(400).send('Erro: O ID do registo é obrigatório para a edição.');
        }
        const allowedSheets = { movimentacoes: '_Movimentacoes', clientes: 'Clientes', produtos: 'Produtos' };
        const actualSheetName = allowedSheets[sheetName.toLowerCase()];
        if (!actualSheetName) {
            return res.status(400).send('Nome da planilha inválido.');
        }

        try {
            const sheets = google.sheets({ version: 'v4', auth });

            const getResponse = await sheets.spreadsheets.values.get({
                spreadsheetId: SPREADSHEET_ID,
                range: actualSheetName,
            });
            const allRows = getResponse.data.values || [];
            const headers = allRows[0];
            
            const idKey = sheetName === 'movimentacoes' ? 'ID Mov.' : 'ID';
            
            const idColumnIndex = headers.findIndex(header => header.toLowerCase() === idKey.toLowerCase());
            
            let targetRowIndex = -1;
            for (let i = 1; i < allRows.length; i++) {
                if (allRows[i][idColumnIndex] == id) {
                    targetRowIndex = i;
                    break;
                }
            }

            if (targetRowIndex === -1) {
                return res.status(404).send('Registo não encontrado na planilha.');
            }

            const updatedRowValues = headers.map(header => {
                if (header.toLowerCase() === idKey.toLowerCase()) {
                    return id;
                }
                if ((header.toLowerCase() === 'preço' || header.toLowerCase() === 'valor') && updatedData[header]) {
                    const numericValue = parseFloat(String(updatedData[header]).replace(',', '.'));
                    return isNaN(numericValue) ? '' : numericValue;
                }
                // Procura a chave correspondente em updatedData ignorando maiúsculas/minúsculas
                const dataKey = Object.keys(updatedData).find(k => k.toLowerCase() === header.toLowerCase());
                return dataKey ? updatedData[dataKey] : '';
            });

            const rangeToUpdate = `${actualSheetName}!A${targetRowIndex + 1}`;
            
            await sheets.spreadsheets.values.update({
                spreadsheetId: SPREADSHEET_ID,
                range: rangeToUpdate,
                valueInputOption: 'USER_ENTERED',
                resource: {
                    values: [updatedRowValues]
                }
            });

            res.status(200).send('Registo atualizado com sucesso!');

        } catch (error) {
            console.error(`Erro ao atualizar registo:`, error.message);
            res.status(500).send(`Erro no servidor ao atualizar: ${error.message}`);
        }
    });

// --- ROTAS DE AUTENTICAÇÃO ---

// --- MIDDLEWARE DE VERIFICAÇÃO DE TOKEN ---
function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Formato: "Bearer TOKEN"

    if (token == null) {
        return res.sendStatus(401); // Unauthorized - Nenhum token fornecido
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.sendStatus(403); // Forbidden - Token inválido ou expirado
        }
        req.user = user;
        next(); // O token é válido, pode prosseguir para a rota
    });
}


// Rota para fazer login de um utilizador
app.post('/auth/login', async (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).send('Email e senha são obrigatórios.');
    }

    try {
        const sheets = google.sheets({ version: 'v4', auth });
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Utilizadores!A:B',
        });

        const utilizadores = response.data.values || [];
        const utilizadorEncontrado = utilizadores.slice(1).find(row => row[0] === email);

        if (!utilizadorEncontrado) {
            return res.status(401).send('Credenciais inválidas.');
        }

        const senhaHash = utilizadorEncontrado[1];
        const senhaCorreta = await bcrypt.compare(senha, senhaHash);

        if (!senhaCorreta) {
            return res.status(401).send('Credenciais inválidas.');
        }

        const token = jwt.sign(
            { email: utilizadorEncontrado[0] },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.json({ token: token });
    } catch (error) {
        console.error('Erro no login:', error.message);
        res.status(500).send('Erro no servidor durante o login.');
    }
});

// --- INICIALIZAÇÃO DO SERVIDOR ---
app.listen(PORT, () => {
    console.log(`Servidor de produção a correr na porta ${PORT}`);
});
