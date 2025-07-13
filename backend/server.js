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

// --- Configuração da Autenticação ---
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

// Rota para LER dados da aba _Movimentacoes
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

// Rota para ADICIONAR dados na aba _Movimentacoes
app.post('/api/movimentacoes', async (req, res) => {
    try {
        const client = await auth.getClient();
        const googleSheets = google.sheets({ version: 'v4', auth: client });

        const newRow = [
            req.body.id_mov,
            req.body.data,
            req.body.tipo,
            req.body.categoria,
            req.body.descricao,
            req.body.valor,
            req.body.responsavel,
            req.body.observacoes
        ];

        await googleSheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: '_Movimentacoes',
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [newRow],
            },
        });

        res.status(201).json({ message: 'Movimentação adicionada com sucesso!' });

    } catch (error) {
        console.error('Erro ao adicionar movimentação:', error.message);
        res.status(500).send('Erro no servidor ao adicionar movimentação.');
    }
});


// --- Inicia o Servidor ---
app.listen(PORT, () => {
    console.log(`Servidor a correr na porta ${PORT}`);
    console.log(`Aceda a http://localhost:${PORT}/status para testar a conexão.`);
});