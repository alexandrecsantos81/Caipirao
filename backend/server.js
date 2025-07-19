require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

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

app.use(cors(corsOptions));
app.use(express.json());

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

// Rota para adicionar dados a uma aba (VERSÃO CORRIGIDA)
app.post('/api/:sheetName', verifyToken, async (req, res) => {
    let { sheetName } = req.params;
    const data = req.body;
    const allowedSheets = { movimentacoes: '_Movimentacoes', clientes: 'Clientes', produtos: 'Produtos' };
    const actualSheetName = allowedSheets[sheetName.toLowerCase()];

    if (!actualSheetName) {
        return res.status(400).send('Nome da planilha inválido.');
    }

    try {
        const sheets = google.sheets({ version: 'v4', auth });
        let newRow = [];

        // Lógica específica para cada aba para garantir a ordem correta dos dados
        if (actualSheetName === 'Clientes') {
            newRow = [
                data['ID'] || '',
                data['Nome'] || '',
                data['Contato'] || '',
                data['Endereço'] || ''
            ];
        } else if (actualSheetName === 'Produtos') {
            newRow = [
                data['ID'] || '',
                data['Nome'] || '',
                data['Descrição'] || '',
                data['Preço'] ? parseFloat(data['Preço'].replace(',', '.')) : ''
            ];
        } else if (actualSheetName === '_Movimentacoes') {
            // Pega os cabeçalhos dinamicamente para movimentações, pois são muitos campos
            const headerResponse = await sheets.spreadsheets.values.get({
                spreadsheetId: SPREADSHEET_ID,
                range: `${actualSheetName}!1:1`,
            });
            const headers = headerResponse.data.values[0];
            newRow = headers.map(header => data[header] || '');
        } else {
            // Se for uma aba desconhecida, retorna um erro
            return res.status(400).send('Tipo de entidade não suportado para adição.');
        }

        await sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: actualSheetName,
            valueInputOption: 'USER_ENTERED',
            resource: { values: [newRow] },
        });

        res.status(201).send('Dados adicionados com sucesso!');

    } catch (error) {
        console.error(`Erro ao adicionar dados na aba ${actualSheetName}:`, error.message);
        res.status(500).send(`Erro ao adicionar dados na aba ${actualSheetName}.`);
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


// Rota para atualizar (editar) uma linha (VERSÃO FINALÍSSIMA CORRIGIDA)
app.put('/api/:sheetName/:rowIndex', verifyToken, async (req, res) => {
    const { sheetName, rowIndex } = req.params;
    const updatedData = req.body;
    const { sheetId } = updatedData;
    const allowedSheets = { movimentacoes: '_Movimentacoes', clientes: 'Clientes', produtos: 'Produtos' };
    const actualSheetName = allowedSheets[sheetName.toLowerCase()];

    if (!actualSheetName) { return res.status(400).send('Nome da planilha inválido.'); }
    if (sheetId === undefined) { return res.status(400).send('O ID da aba (sheetId) é necessário para a edição.'); }

    try {
        const sheets = google.sheets({ version: 'v4', auth });
        let updatedRowValues = [];
        let fieldsToUpdate = 'userEnteredValue';

        const headerResponse = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: `${actualSheetName}!1:1` });
        const headers = headerResponse.data.values[0];

        // LÓGICA RESTAURADA E CORRIGIDA
        if (actualSheetName === '_Movimentacoes') {
            updatedRowValues = headers.map(header => {
                const value = updatedData[header] || '';
                if (header === 'Valor') {
                    const valorNumerico = value ? parseFloat(String(value).replace(',', '.')) : null;
                    return { userEnteredValue: { numberValue: valorNumerico }, userEnteredFormat: { numberFormat: { type: 'CURRENCY', pattern: '"R$"#,##0.00' } } };
                }
                return { userEnteredValue: { stringValue: value.toString() } };
            });
            fieldsToUpdate = 'userEnteredValue,userEnteredFormat';
        } else if (actualSheetName === 'Clientes') {
            updatedRowValues = [ { userEnteredValue: { stringValue: updatedData['ID'] || '' } }, { userEnteredValue: { stringValue: updatedData['Nome'] || '' } }, { userEnteredValue: { stringValue: updatedData['Contato'] || '' } }, { userEnteredValue: { stringValue: updatedData['Endereço'] || '' } } ];
        } else if (actualSheetName === 'Produtos') {
            const preco = updatedData['Preço'] ? String(updatedData['Preço']).replace(',', '.') : '';
            updatedRowValues = [ { userEnteredValue: { stringValue: updatedData['ID'] || '' } }, { userEnteredValue: { stringValue: updatedData['Nome'] || '' } }, { userEnteredValue: { stringValue: updatedData['Descrição'] || '' } }, { userEnteredValue: { numberValue: preco ? parseFloat(preco) : null }, userEnteredFormat: { numberFormat: { type: 'CURRENCY', pattern: '"R$"#,##0.00' } } } ];
            fieldsToUpdate = 'userEnteredValue,userEnteredFormat';
        }

        await sheets.spreadsheets.batchUpdate({
            spreadsheetId: SPREADSHEET_ID,
            resource: {
                requests: [{
                    updateCells: {
                        start: { sheetId: parseInt(sheetId, 10), rowIndex: parseInt(rowIndex, 10) + 1, columnIndex: 0 },
                        rows: [{ values: updatedRowValues }],
                        fields: fieldsToUpdate
                    }
                }]
            }
        });
        res.status(200).send('Registo atualizado com sucesso!');
    } catch (error) {
        console.error(`Erro ao atualizar registo na aba ${actualSheetName}:`, error.message);
        res.status(500).send(`Erro ao atualizar registo: ${error.message}`);
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

// Rota para adicionar dados a uma aba (VERSÃO FINAL COM MOVIMENTAÇÕES)
app.post('/api/:sheetName', verifyToken, async (req, res) => {
    let { sheetName } = req.params;
    const data = req.body;
    const allowedSheets = { movimentacoes: '_Movimentacoes', clientes: 'Clientes', produtos: 'Produtos' };
    const actualSheetName = allowedSheets[sheetName.toLowerCase()];

    if (!actualSheetName) {
        return res.status(400).send('Nome da planilha inválido.');
    }

    try {
        const sheets = google.sheets({ version: 'v4', auth });
        let newRow = [];

        if (actualSheetName === 'Clientes') {
            newRow = [ data['ID'] || '', data['Nome'] || '', data['Contato'] || '', data['Endereço'] || '' ];
        } else if (actualSheetName === 'Produtos') {
            newRow = [ data['ID'] || '', data['Nome'] || '', data['Descrição'] || '', data['Preço'] ? parseFloat(String(data['Preço']).replace(',', '.')) : '' ];
        } else if (actualSheetName === '_Movimentacoes') {
            // LÓGICA NOVA E ESPECÍFICA PARA MOVIMENTAÇÕES
            const headerResponse = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: `${actualSheetName}!1:1` });
            const headers = headerResponse.data.values[0];
            newRow = headers.map(header => {
                const value = data[header] || '';
                // Se a coluna for "Valor", trata como número; senão, como texto.
                if (header === 'Valor') {
                    return value ? parseFloat(String(value).replace(',', '.')) : '';
                }
                return value;
            });
        } else {
            return res.status(400).send('Tipo de entidade não suportado para adição.');
        }

        await sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: actualSheetName,
            valueInputOption: 'USER_ENTERED',
            resource: { values: [newRow] },
        });

        res.status(201).send('Dados adicionados com sucesso!');

    } catch (error) {
        console.error(`Erro ao adicionar dados na aba ${actualSheetName}:`, error.message);
        res.status(500).send(`Erro ao adicionar dados na aba ${actualSheetName}.`);
    }
});



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
