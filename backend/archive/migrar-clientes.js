// Importa as bibliotecas necessárias
require('dotenv').config();
const { google } = require('googleapis');
const pool = require('../db'); // Reutiliza a conexão com o banco de dados que já criámos

// --- CONFIGURAÇÃO ---
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const SHEET_NAME = 'Clientes'; // O nome exato da aba na sua planilha

// Configuração da autenticação com a API do Google (igual à do server.js)
const { OAuth2 } = google.auth;
const oauth2Client = new OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    "https://developers.google.com/oauthplayground"
 );
oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN
});
const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

// --- FUNÇÃO PRINCIPAL DE MIGRAÇÃO ---
async function migrarClientes() {
    let client; // Variável para a conexão do pool
    try {
        console.log('Iniciando a migração de clientes...');

        // 1. LER DADOS DA PLANILHA GOOGLE SHEETS
        console.log(`Buscando dados da planilha: ${SHEET_NAME}...`);
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: SHEET_NAME, // Busca todos os dados da aba especificada
        });

        const rows = response.data.values;
        if (!rows || rows.length <= 1) {
            console.log('Nenhum dado encontrado na planilha para migrar.');
            return;
        }

        // Remove a primeira linha (cabeçalhos) e guarda os dados dos clientes
        const clientesParaMigrar = rows.slice(1);
        console.log(`Encontrados ${clientesParaMigrar.length} clientes para migrar.`);

        // 2. CONECTAR AO BANCO DE DADOS E INICIAR TRANSAÇÃO
        client = await pool.connect(); // Pega uma conexão do pool
        await client.query('BEGIN'); // Inicia uma transação

        console.log('Limpando a tabela de clientes existente (TRUNCATE)...');
        // Limpa a tabela para evitar duplicados em execuções futuras
        await client.query('TRUNCATE TABLE clientes RESTART IDENTITY CASCADE');

        console.log('Inserindo novos dados no PostgreSQL...');
        // 3. INSERIR CADA CLIENTE NO BANCO DE DADOS
        // Prepara a query de inserção
        const insertQuery = 'INSERT INTO clientes (nome, contato, endereco) VALUES ($1, $2, $3)';

        // Itera sobre cada linha da planilha e executa a inserção
        for (const row of clientesParaMigrar) {
            // Mapeia as colunas da sua planilha para as variáveis
            // IMPORTANTE: Ajuste os índices [0], [1], [2] se a ordem das suas colunas for diferente
            const nome = row[1];     // Assumindo que 'Nome' é a coluna B
            const contato = row[2];  // Assumindo que 'Contato' é a coluna C
            const endereco = row[3]; // Assumindo que 'Endereço' é a coluna D

            // Ignora linhas que não tenham um nome
            if (nome) {
                await client.query(insertQuery, [nome, contato, endereco]);
            }
        }

        // 4. FINALIZAR A TRANSAÇÃO
        await client.query('COMMIT'); // Confirma todas as inserções no banco

        console.log('✅ Migração concluída com sucesso!');

    } catch (error) {
        // Em caso de qualquer erro, desfaz todas as operações
        if (client) {
            await client.query('ROLLBACK');
        }
        console.error('❌ Erro durante a migração:', error);
        console.log('A transação foi revertida (ROLLBACK). Nenhuma alteração foi salva no banco.');

    } finally {
        // Garante que a conexão com o banco seja sempre liberada
        if (client) {
            client.release();
            console.log('Conexão com o banco de dados liberada.');
        }
    }
}

// Executa a função
migrarClientes();
