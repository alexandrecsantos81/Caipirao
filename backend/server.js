require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middlewares Essenciais ---
app.use(cors()); // Habilita o CORS para permitir pedidos de outras origens (o nosso frontend)
app.use(express.json()); // Habilita o servidor a entender JSON em pedidos POST

// --- Configuração da Autenticação (igual ao readSheet.js) ---
// Lembre-se de ajustar o nome do seu ficheiro de credenciais se for diferente
const KEYFILEPATH = path.join(__dirname, '../data/credenciais.json');
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;

const auth = new google.auth.GoogleAuth({
    keyFile: KEYFILEPATH,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'], // Escopo completo para leitura e escrita
});


// --- ROTAS DA API ---

// Rota de Status (para verificar se a API está no ar)
app.get('/status', (req, res) => {
    res.json({ status: 'ok', message: 'API está a funcionar' });
});

// Rota para ler dados da aba _Movimentacoes
app.get('/api/movimentacoes', async (req, res) => {
    try {
        const client = await auth.getClient();
        const googleSheets = google.sheets({ version: 'v4', auth: client });

        const response = await googleSheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: '_Movimentacoes',
        });

        res.json(response.data.values);

    } catch (error) {
        console.error('Erro ao ler a aba _Movimentacoes:', error.message);
        res.status(500).send('Erro no servidor ao ler a aba _Movimentacoes.');
    }
});


// --- Inicia o Servidor ---
app.listen(PORT, () => {
    console.log(`Servidor a correr na porta ${PORT}`);
    console.log(`Aceda a http://localhost:${PORT}/status para testar a conexão.`);
});