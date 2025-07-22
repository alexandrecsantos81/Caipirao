-- SQL para criar a estrutura inicial do banco de dados "caipirao_db"

-- Tabela para armazenar os Clientes
-- Substitui a aba "Clientes" da planilha.
CREATE TABLE clientes (
    id SERIAL PRIMARY KEY, -- Gera um ID numérico único automaticamente.
    nome VARCHAR(255) NOT NULL,
    contato VARCHAR(100),
    endereco TEXT,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP -- Registra quando o cliente foi criado.
);

-- Tabela para armazenar os Produtos
-- Substitui a aba "Produtos" da planilha.
CREATE TABLE produtos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    preco NUMERIC(10, 2), -- Tipo de dado ideal para dinheiro, com 10 dígitos no total e 2 casas decimais.
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela para armazenar as Movimentações Financeiras
-- Substitui a aba "_Movimentacoes" da planilha.
CREATE TABLE movimentacoes (
    id SERIAL PRIMARY KEY,
    data DATE NOT NULL,
    tipo VARCHAR(7) NOT NULL CHECK (tipo IN ('ENTRADA', 'SAÍDA')), -- Restrição para garantir a integridade dos dados.
    categoria VARCHAR(100) NOT NULL,
    descricao TEXT NOT NULL,
    valor NUMERIC(10, 2) NOT NULL,
    responsavel VARCHAR(100),
    observacoes TEXT,
    cliente_id INTEGER REFERENCES clientes(id) ON DELETE SET NULL, -- Esta é a chave da relação: conecta esta tabela à tabela de clientes.
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela para os Utilizadores (para login)
-- Substitui a aba "Utilizadores" da planilha.
CREATE TABLE utilizadores (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL, -- Garante que não haverá e-mails duplicados.
    senha_hash VARCHAR(255) NOT NULL, -- Armazenará a senha criptografada.
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Mensagem de sucesso para o script
\echo 'Schema criado com sucesso: tabelas clientes, produtos, movimentacoes e utilizadores foram criadas.'
