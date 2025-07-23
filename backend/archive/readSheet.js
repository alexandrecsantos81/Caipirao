require('dotenv').config();
const { google } = require('googleapis');
const path = require('path');

// AJUSTE O NOME DO SEU FICHEIRO JSON AQUI
const KEYFILEPATH = path.join(__dirname, '../data/credenciais.json');
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;

const auth = new google.auth.GoogleAuth({
    keyFile: KEYFILEPATH,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});

async function readSheetData() {
    try {
        const client = await auth.getClient();
        const googleSheets = google.sheets({ version: 'v4', auth: client });

        const res = await googleSheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: '_Movimentacoes', // Garanta que esta aba existe
        });

        console.log('Conexão bem-sucedida! Dados lidos:');
        console.log(res.data.values);

    } catch (error) {
        console.error('Erro ao ler a planilha:', error.message);
    }
}

readSheetData();
