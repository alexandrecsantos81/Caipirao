// =================================================================
//          FICHEIRO: backend/scripts/migrar_movimentacoes.js
// =================================================================
// DESCRIÇÃO: Script para migrar os dados históricos de movimentações
//            do Google Sheets para a tabela 'movimentacoes' no PostgreSQL.
//            Este script associa o nome do cliente ao seu ID no banco.
// =================================================================

// --- 1. Importação de Módulos ---
require('dotenv').config({ path: '../.env' }); // Garante que o .env na raiz do backend seja lido
const { google } = require('googleapis');
const pool = require('../db'); // Reutiliza a nossa conexão com o banco de dados

// --- 2. Configuração ---
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const SHEET_NAME = '_Movimentacoes'; // O nome exato da aba na sua planilha

// Configuração da autenticação com a API do Google (OAuth 2.0)
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

// --- 3. Função Principal de Migração ---
async function migrarMovimentacoes() {
    let client; // Variável para a conexão do pool, para garantir que seja libertada no final

    try {
        console.log('🚀 Iniciando a migração de movimentações...');

        // DENTRO DE: async function migrarMovimentacoes() { ... }

        // ETAPA 1: Buscar todos os clientes do PostgreSQL e criar um mapa de consulta.
        // Isso é muito mais eficiente do que consultar o banco para cada linha da planilha.
        console.log('   [1/5] Buscando clientes existentes no PostgreSQL...');
        const clientesResult = await pool.query('SELECT id, nome FROM clientes');
        const mapaClientes = {};
        clientesResult.rows.forEach(cliente => {
            // Armazena o nome do cliente em maiúsculas como chave para uma busca sem erros de digitação
            mapaClientes[cliente.nome.toUpperCase()] = cliente.id;
        });
        console.log(`   ✔️ ${Object.keys(mapaClientes).length} clientes carregados para o mapa de consulta.`);

        // ETAPA 2: Ler todos os dados da planilha de movimentações.
        console.log(`   [2/5] Buscando dados da planilha: "${SHEET_NAME}"...`);
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: SHEET_NAME,
        });

        const rows = response.data.values;
        if (!rows || rows.length <= 1) {
            console.log('   ⚠️ Nenhum dado encontrado na planilha para migrar.');
            return;
        }

        // Guarda os cabeçalhos e as linhas de dados separadamente.
        const headers = rows[0];
        const movimentacoesParaMigrar = rows.slice(1);
        console.log(`   ✔️ Encontradas ${movimentacoesParaMigrar.length} movimentações para migrar.`);

        // Mapeia os nomes dos cabeçalhos para os seus índices para tornar o código mais legível.
        const headerMap = {};
        headers.forEach((header, index) => {
            headerMap[header] = index;
        });

        // ETAPA 3: Conectar ao banco de dados e iniciar uma transação.
        // A transação garante que ou tudo é inserido com sucesso, ou nada é.
        console.log('   [3/5] Conectando ao banco e iniciando transação...');
        client = await pool.connect();
        await client.query('BEGIN');

        // ETAPA 4: Limpar a tabela de movimentações para evitar duplicados em futuras execuções.
        console.log('   [4/5] Limpando a tabela de movimentações existente (TRUNCATE)...');
        await client.query('TRUNCATE TABLE movimentacoes RESTART IDENTITY CASCADE');

        // ETAPA 5: Iterar sobre cada movimentação da planilha e inseri-la no banco.
        console.log('   [5/5] Inserindo dados no PostgreSQL...');
        const insertQuery = `
            INSERT INTO movimentacoes (data, tipo, categoria, descricao, valor, responsavel, observacoes, cliente_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `;

            for (const row of movimentacoesParaMigrar) {
                // Extrai os dados da linha usando o mapa de cabeçalhos
                const data = row[headerMap['Data']];
                const tipo = row[headerMap['Tipo (Entrada/Saída)']];
                const categoria = row[headerMap['Categoria']];
                let descricao = row[headerMap['Descrição']]; // Modificado para 'let'
                const valorRaw = row[headerMap['Valor']];
                const responsavel = row[headerMap['Responsável']];
                const observacoes = row[headerMap['Observações']];
                const nomeCliente = row[headerMap['Cliente']];

            // Validação: Ignora linhas sem dados essenciais
            if (!data || !tipo || !valorRaw) {
                continue; // Pula para a próxima linha
            }

            if (!descricao) {
                descricao = 'SEM DESCRIÇÃO';
            }
            // ===================================

            // Tratamento de dados
            const valorNumerico = parseFloat(String(valorRaw).replace(',', '.')) || 0;
            const tipoFormatado = String(tipo).toUpperCase();

            // LÓGICA CRÍTICA: Encontra o ID do cliente no nosso mapa.
            let clienteId = null;
            if (nomeCliente && mapaClientes[nomeCliente.toUpperCase()]) {
                clienteId = mapaClientes[nomeCliente.toUpperCase()];
            }

            // Executa a inserção no banco de dados
            await client.query(insertQuery, [
                data,
                tipoFormatado,
                categoria,
                descricao,
                valorNumerico,
                responsavel,
                observacoes,
                clienteId // Insere o ID do cliente (ou null se não encontrado)
            ]);
        }

        // Se o loop terminar sem erros, confirma todas as inserções no banco.
        await client.query('COMMIT');

        console.log('✅ Migração de movimentações concluída com sucesso!');

    } catch (error) {
        // Em caso de qualquer erro, desfaz todas as operações
        if (client) {
            await client.query('ROLLBACK');
            console.log('❌ A transação foi revertida (ROLLBACK). Nenhuma alteração foi salva no banco.');
        }
        console.error('💥 Erro crítico durante a migração de movimentações:', error);

    } finally {
        // Garante que a conexão com o banco seja sempre libertada no final
        if (client) {
            client.release();
            console.log('🔌 Conexão com o banco de dados liberada.');
        }
    }
}

// --- 4. Execução do Script ---
migrarMovimentacoes();
