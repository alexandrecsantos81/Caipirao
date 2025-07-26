// Importa as bibliotecas necessárias
require('dotenv').config();
const { google } = require('googleapis');
const pool = require('../db'); // Reutiliza a conexão com o banco de dados que já criámos

// --- CONFIGURAÇÃO ---
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const SHEET_NAME = 'Produtos'; // O nome exato da aba de produtos na sua planilha

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
async function migrarProdutos() {
    let client; // Variável para a conexão do pool
    try {
        console.log('Iniciando a migração de produtos...');

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

        // Remove a primeira linha (cabeçalhos) e guarda os dados dos produtos
        const produtosParaMigrar = rows.slice(1);
        console.log(`Encontrados ${produtosParaMigrar.length} produtos para migrar.`);

        // 2. CONECTAR AO BANCO DE DADOS E INICIAR TRANSAÇÃO
        client = await pool.connect(); // Pega uma conexão do pool
        await client.query('BEGIN'); // Inicia uma transação

        console.log('Limpando a tabela de produtos existente (TRUNCATE)...');
        // Limpa a tabela para evitar duplicados em execuções futuras
        await client.query('TRUNCATE TABLE produtos RESTART IDENTITY CASCADE');

        console.log('Inserindo novos dados no PostgreSQL...');
        // 3. INSERIR CADA PRODUTO NO BANCO DE DADOS
        // Prepara a query de inserção
        const insertQuery = 'INSERT INTO produtos (nome, descricao, preco) VALUES ($1, $2, $3)';

        // Itera sobre cada linha da planilha e executa a inserção
        for (const row of produtosParaMigrar) {
            // Mapeia as colunas da sua planilha para as variáveis
            // IMPORTANTE: Ajuste os índices se a ordem das suas colunas for diferente
            const nome = row[1];      // Assumindo que 'Nome' é a coluna B
            const descricao = row[2]; // Assumindo que 'Descrição' é a coluna C
            const preco = row[3];     // Assumindo que 'Preço' é a coluna D

            // Ignora linhas que não tenham um nome
            if (nome) {
                // Converte o preço para um formato numérico, se necessário
                const precoNumerico = preco ? parseFloat(String(preco).replace(',', '.')) : null;
                await client.query(insertQuery, [nome, descricao, precoNumerico]);
            }
        }

        // 4. FINALIZAR A TRANSAÇÃO
        await client.query('COMMIT'); // Confirma todas as inserções no banco

        console.log('✅ Migração de produtos concluída com sucesso!');

    } catch (error) {
        // Em caso de qualquer erro, desfaz todas as operações
        if (client) {
            await client.query('ROLLBACK');
        }
        console.error('❌ Erro durante a migração de produtos:', error);
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
migrarProdutos();
