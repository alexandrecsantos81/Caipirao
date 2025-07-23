# Projeto Caipirão - Sistema de Gestão Financeira

O Projeto Caipirão é uma aplicação web Full-Stack para gestão financeira de um pequeno negócio. A aplicação foi migrada de uma solução baseada em Google Sheets para uma arquitetura robusta com API RESTful e banco de dados PostgreSQL.

## Funcionalidades

- **Autenticação de Utilizadores:** Sistema seguro de registo e login com JWT e senhas criptografadas.
- **Gestão de Clientes (CRUD):** Criar, ler, atualizar e apagar registos de clientes.
- **Gestão de Produtos (CRUD):** Criar, ler, atualizar e apagar registos de produtos.
- **Gestão de Movimentações (CRUD):** Registar entradas e saídas financeiras, com associação a clientes quando aplicável.
- **Dashboard Interativo:** Visualização rápida do balanço financeiro (entradas, saídas, saldo) e um gráfico de análise de despesas por categoria.
- **Interface Reativa:** Frontend construído com JavaScript puro, com notificações, loaders e navegação dinâmica sem recarregamento da página.

## Tecnologias Utilizadas

- **Frontend:** HTML5, Tailwind CSS, JavaScript (Vanilla)
- **Backend:** Node.js, Express.js
- **Banco de Dados:** PostgreSQL
- **Autenticação:** JSON Web Tokens (JWT), bcrypt

---

## Configuração do Ambiente de Desenvolvimento

Siga os passos abaixo para configurar e executar o projeto localmente.

### Pré-requisitos

- **Node.js:** Versão 18 ou superior.
- **PostgreSQL:** Uma instância do PostgreSQL a correr localmente.

### Passos para Configuração

1.  **Clonar o Repositório:**
    ```bash
    git clone <URL_DO_SEU_REPOSITORIO_NO_GITHUB>
    cd caipirao
    ```

2.  **Configurar o Banco de Dados:**
    - Aceda ao seu gestor de PostgreSQL (como o `psql` ou DBeaver).
    - Crie um novo banco de dados:
      ```sql
      CREATE DATABASE caipirao_db;
      ```
    - Conecte-se a este novo banco e execute o script `backend/schema.sql` para criar todas as tabelas necessárias.

3.  **Configurar o Backend:**
    - Navegue até a pasta do backend:
      ```bash
      cd backend
      ```
    - Instale as dependências do Node.js:
      ```bash
      npm install
      ```
    - Crie um ficheiro de configuração `.env` na raiz da pasta `backend/`. Copie o conteúdo do exemplo abaixo e substitua com as suas credenciais:
      ```env
      # Configuração da Conexão com o Banco de Dados
      DB_USER=seu_usuario_postgres
      DB_HOST=localhost
      DB_DATABASE=caipirao_db
      DB_PASSWORD=sua_senha_do_postgres
      DB_PORT=5432

      # Chave Secreta para a assinatura dos Tokens JWT
      JWT_SECRET=crie_aqui_uma_frase_secreta_bem_longa_e_segura
      ```

4.  **Iniciar a Aplicação:**
    - **Para iniciar o backend:** Dentro da pasta `backend/`, execute o comando:
      ```bash
      npm start
      ```
      O servidor da API estará a correr em `http://localhost:3000`.

    - **Para iniciar o frontend:** Abra o ficheiro `frontend/index.html` com uma extensão de Live Server no seu editor (como o do VS Code ) ou simplesmente abra o ficheiro diretamente no seu navegador.

5.  **Primeiro Acesso:**
    - Com a aplicação aberta no navegador, aceda à página de **Registo** e crie o seu primeiro utilizador.
    - Após o registo, faça **Login** para aceder ao dashboard e começar a usar o sistema.

