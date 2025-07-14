require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middlewares Essenciais ---
app.use(cors());
app.use(express.json());

// --- Servindo os Ficheiros do Frontend ---
// Como o server.js está na raiz, o caminho para 'frontend' é direto.
app.use(express.static('frontend'));


// --- Configuração da Autenticação ---
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;

const creds = process.env.GOOGLE_CREDENTIALS ?
    JSON.parse(process.env.GOOGLE_CREDENTIALS) :
    require(path.join(__dirname, 'data/credenciais.json')); // Caminho direto para a pasta 'data'

const auth = new google.auth.GoogleAuth({
    credentials: creds,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
} );

// --- ROTAS DA API ---

// Rota para buscar dados de uma aba específica (Movimentações, Clientes, Produtos)
app.get('/api/:sheetName', async (req, res) => {
    let { sheetName } = req.params; // Usamos 'let' para poder modificar o valor
    const originalSheetName = sheetName; // Guardamos o nome original para o log de erro

    // Validação para garantir que só aceitamos os nomes esperados do frontend
    const allowedSheets = ['movimentacoes', 'clientes', 'produtos'];
    if (!allowedSheets.includes(sheetName.toLowerCase())) {
        return res.status(400).send('Nome da planilha inválido.');
    }

    // =================================================================
    // TRADUÇÃO DOS NOMES PARA CORRESPONDER À PLANILHA - ESTA É A CORREÇÃO
    // =================================================================
    if (sheetName === 'movimentacoes') {
        sheetName = '_Movimentacoes'; // Nome exato da sua aba na planilha
    } else if (sheetName === 'clientes') {
        sheetName = 'Clientes'; // Nome exato da sua aba na planilha
    } else if (sheetName === 'produtos') {
        sheetName = 'Produtos'; // Nome exato da sua aba na planilha
    }
    // =================================================================

    try {
        const sheets = google.sheets({ version: 'v4', auth });
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: sheetName, // Usamos o nome corrigido/traduzido aqui
        });
        res.json(response.data.values);
    } catch (error) {
        // Usamos o nome original no log para facilitar a depuração
        console.error(`Erro ao buscar dados da aba ${originalSheetName} (tentando como '${sheetName}'):`, error.message);
        res.status(500).send(`Erro ao buscar dados da aba ${originalSheetName}.`);
    }
});

// Rota para adicionar dados a uma aba específica
app.post('/api/:sheetName', async (req, res) => {
    let { sheetName } = req.params; // Usamos 'let'
    const data = req.body;

    const allowedSheets = ['movimentacoes', 'clientes', 'produtos'];
    if (!allowedSheets.includes(sheetName.toLowerCase())) {
        return res.status(400).send('Nome da planilha inválido.');
    }

    // =================================================================
    // ADICIONE A MESMA TRADUÇÃO AQUI
    // =================================================================
    if (sheetName === 'movimentacoes') {
        sheetName = '_Movimentacoes';
    } else if (sheetName === 'clientes') {
        sheetName = 'Clientes';
    } else if (sheetName === 'produtos') {
        sheetName = 'Produtos';
    }
    // =================================================================

    try {
        const sheets = google.sheets({ version: 'v4', auth });

        const headerResponse = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: `${sheetName}!1:1`,
        });
        const headers = headerResponse.data.values[0];
        
        const newRow = headers.map(header => data[header] || '');

        await sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: sheetName, // Usa o nome corrigido
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [newRow],
            },
        });
        res.status(201).send('Dados adicionados com sucesso!');
    } catch (error) {
        console.error(`Erro ao adicionar dados na aba ${sheetName}:`, error.message);
        res.status(500).send(`Erro ao adicionar dados na aba ${sheetName}.`);
    }
});


app.listen(PORT, () => {
    console.log(`Servidor a correr na porta ${PORT}. Aceda em http://127.0.0.1:${PORT}/index.html` );
});
