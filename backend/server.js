require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middlewares Essenciais para PRODUÇÃO ---

// Configuração de CORS para permitir pedidos apenas do seu site no Netlify.
// O URL 'https://guileless-gecko-d10e1f.netlify.app' é o que você forneceu.
const corsOptions = {
  origin: 'https://caipiraosys.netlify.app', // URL EXATO do seu frontend
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE", // Permite todos os métodos
  credentials: true,
  optionsSuccessStatus: 204
};
app.use(cors(corsOptions ));

app.use(express.json());

// A linha app.use(express.static(...)) foi REMOVIDA, pois não é necessária no Render.


// --- Configuração da Autenticação ---
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
console.log('--- DIAGNÓSTICO: SPREADSHEET_ID a ser usado:', SPREADSHEET_ID, '---'); 

// Lógica para usar as credenciais do Render (via variável de ambiente)
// A opção de carregar o ficheiro local é mantida para facilitar testes futuros.
const creds = process.env.GOOGLE_CREDS_V2 ? // <-- MUDANÇA AQUI
    JSON.parse(process.env.GOOGLE_CREDS_V2) : // <-- MUDANÇA AQUI
    require(path.join(__dirname, 'data/credenciais.json'));

const auth = new google.auth.GoogleAuth({
    credentials: creds,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
} );

// --- ROTAS DA API ---

// Rota para buscar dados de uma aba específica
app.get('/api/:sheetName', async (req, res) => {
    let { sheetName } = req.params;
    const originalSheetName = sheetName;

    const allowedSheets = ['movimentacoes', 'clientes', 'produtos'];
    if (!allowedSheets.includes(sheetName.toLowerCase())) {
        return res.status(400).send('Nome da planilha inválido.');
    }

    // Tradução dos nomes para corresponder EXATAMENTE aos nomes das abas na planilha
    if (sheetName === 'movimentacoes') {
        sheetName = '_Movimentacoes';
    } else if (sheetName === 'clientes') {
        sheetName = 'Clientes';
    } else if (sheetName === 'produtos') {
        sheetName = 'Produtos';
    }

    try {
        const sheets = google.sheets({ version: 'v4', auth });
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: sheetName,
        });
        res.json(response.data.values);
    } catch (error) {
        console.error(`Erro ao buscar dados da aba ${originalSheetName} (tentando como '${sheetName}'):`, error.message);
        res.status(500).send(`Erro ao buscar dados da aba ${originalSheetName}.`);
    }
});

// Rota para adicionar dados a uma aba específica
app.post('/api/:sheetName', async (req, res) => {
    let { sheetName } = req.params;
    const data = req.body;

    const allowedSheets = ['movimentacoes', 'clientes', 'produtos'];
    if (!allowedSheets.includes(sheetName.toLowerCase())) {
        return res.status(400).send('Nome da planilha inválido.');
    }

    // A mesma tradução para a rota de POST
    if (sheetName === 'movimentacoes') {
        sheetName = '_Movimentacoes';
    } else if (sheetName === 'clientes') {
        sheetName = 'Clientes';
    } else if (sheetName === 'produtos') {
        sheetName = 'Produtos';
    }

    try {
        const sheets = google.sheets({ version: 'v4', auth });

        const headerResponse = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: `${sheetName}!1:1`,
        });
        const headers = headerResponse.data.values[0];
        
        const newRow = headers.map(header => data[header] || '');

        // --- ADICIONE ESTES LOGS PARA DEPURAR ---
        console.log('Dados recebidos do formulário:', data);
        console.log('Cabeçalhos da planilha:', headers);
        console.log('Nova linha preparada para envio:', newRow);
        // -----------------------------------------

        await sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: sheetName,
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

// Rota para apagar uma linha de uma aba específica (VERSÃO CORRIGIDA)
app.delete('/api/:sheetName/:rowIndex', async (req, res) => {
    const { sheetName, rowIndex } = req.params;
    const { sheetId } = req.body; // Recebemos o ID da aba do frontend

    // Validação de segurança
    const allowedSheets = ['movimentacoes', 'clientes', 'produtos'];
    if (!allowedSheets.includes(sheetName.toLowerCase())) {
        return res.status(400).send('Nome da planilha inválido.');
    }

    if (sheetId === undefined) {
        return res.status(400).send('O ID da aba (sheetId) é necessário.');
    }

    try {
        const sheets = google.sheets({ version: 'v4', auth });
        
        // O índice da API é baseado em 0. A primeira linha de dados (linha 2 da planilha)
        // corresponde ao rowIndex 0 que vem do frontend.
        // Portanto, o startIndex para a API é o rowIndex + 1.
        const apiStartIndex = parseInt(rowIndex, 10) + 1;

        const request = {
            spreadsheetId: SPREADSHEET_ID,
            resource: {
                requests: [
                    {
                        deleteDimension: {
                            range: {
                                sheetId: parseInt(sheetId, 10),
                                dimension: 'ROWS',
                                startIndex: apiStartIndex,
                                endIndex: apiStartIndex + 1
                            }
                        }
                    }
                ]
            }
        };

        await sheets.spreadsheets.batchUpdate(request);

        // Envia uma resposta de sucesso simples, sem JSON.
        res.status(200).send(`Linha ${rowIndex} apagada com sucesso da aba ${sheetName}.`);

    } catch (error) {
        console.error(`Erro ao apagar linha da aba ${sheetName}:`, error.message, error.stack);
        res.status(500).send(`Erro no servidor ao apagar a linha: ${error.message}`);
    }
});

// Rota para ATUALIZAR (EDITAR) uma linha existente
app.put('/api/:sheetName/:rowIndex', async (req, res) => {
    let { sheetName, rowIndex } = req.params;
    const updatedData = req.body;

    // Validação de segurança
    const allowedSheets = ['movimentacoes', 'clientes', 'produtos'];
    if (!allowedSheets.includes(sheetName.toLowerCase())) {
        return res.status(400).send('Nome da planilha inválido.');
    }

    // Tradução dos nomes para corresponder EXATAMENTE aos nomes das abas
    let actualSheetName = '';
    if (sheetName === 'movimentacoes') actualSheetName = '_Movimentacoes';
    else if (sheetName === 'clientes') actualSheetName = 'Clientes';
    else if (sheetName === 'produtos') actualSheetName = 'Produtos';

    try {
        const sheets = google.sheets({ version: 'v4', auth });

        // Busca os cabeçalhos para garantir a ordem correta dos dados
        const headerResponse = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: `${actualSheetName}!1:1`,
        });
        const headers = headerResponse.data.values[0];

        // Mapeia os dados atualizados para a mesma ordem dos cabeçalhos
        const updatedRow = headers.map(header => updatedData[header] || '');

        // Calcula o número da linha na planilha.
        // O índice do frontend (rowIndex) começa em 0.
        // A primeira linha de dados está na linha 2 da planilha.
        // Portanto, a linha a ser atualizada é rowIndex + 2.
        const sheetRowNumber = parseInt(rowIndex, 10) + 2;

        // Constrói o range para a atualização, ex: 'Produtos!A3'
        // Assumimos que os dados começam na coluna A.
        const range = `${actualSheetName}!A${sheetRowNumber}`;

        await sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: range,
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [updatedRow],
            },
        });

        res.status(200).send('Registo atualizado com sucesso!');

    } catch (error) {
        console.error(`Erro ao atualizar registo na aba ${sheetName}:`, error.message);
        res.status(500).send(`Erro ao atualizar registo: ${error.message}`);
    }
});



app.listen(PORT, () => {
    console.log(`Servidor de produção a correr na porta ${PORT}`);
});
// Forçando a atualização para diagnóstico - [Data de hoje]
