# 📊 Sistema de Gestão Financeira - Caipirão

Este é um sistema web completo para gestão de vendas e controle de caixa, desenvolvido para fornecer uma solução prática e eficiente para o gerenciamento de movimentações, clientes e produtos.

## ✨ Funcionalidades Principais

*   **Dashboard Interativo:** Visualização rápida do balanço financeiro com gráficos de entradas, saídas e saldo atual.
*   **Autenticação Segura:** Sistema de login e registro de usuários com senhas criptografadas e tokens JWT para proteção das rotas.
*   **Gestão de Movimentações:** Adicione, edite e apague registros de entradas e saídas financeiras.
*   **Cadastro de Clientes:** Mantenha uma lista atualizada de seus clientes.
*   **Cadastro de Produtos:** Gerencie os produtos, incluindo nome, descrição e preço.
*   **Pesquisa e Filtragem:** Encontre rapidamente qualquer movimentação usando a barra de pesquisa.
*   **Interface Responsiva:** O sistema se adapta a diferentes tamanhos de tela, funcionando em desktops e dispositivos móveis.

## 🚀 Tecnologias Utilizadas

*   **Frontend:**
    *   HTML5
    *   CSS3 com **TailwindCSS**
    *   JavaScript (Vanilla JS)
    *   **Chart.js** para visualização de dados
*   **Backend:**
    *   **Node.js** com **Express.js**
    *   **Google Sheets API** como banco de dados
*   **Autenticação:**
    *   **bcrypt** para criptografia de senhas
    *   **jsonwebtoken (JWT)** para gerenciamento de sessão
*   **Hospedagem:**
    *   Frontend hospedado no **Netlify**
    *   Backend hospedado na **Render**

## 🔧 Configuração e Instalação

Siga os passos abaixo para configurar e rodar o projeto em um ambiente local.

### Pré-requisitos

*   [Node.js](https://nodejs.org/ ) (versão LTS recomendada)
*   Uma conta Google e um projeto no [Google Cloud Platform](https://console.cloud.google.com/ ).
*   Credenciais da API do Google (ID do Cliente, Chave Secreta e Refresh Token).

### Passos para o Backend

1.  **Navegue até a pasta do backend:**
    ```bash
    cd backend
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    ```

3.  **Crie um arquivo `.env`** na pasta `backend` e adicione as seguintes variáveis de ambiente:
    ```env
    SPREADSHEET_ID=SEU_ID_DA_PLANILHA_AQUI
    JWT_SECRET=SUA_CHAVE_SECRETA_PARA_JWT_AQUI
    GOOGLE_CLIENT_ID=SEU_ID_DE_CLIENTE_OAUTH_AQUI
    GOOGLE_CLIENT_SECRET=SUA_CHAVE_SECRETA_DE_CLIENTE_OAUTH_AQUI
    GOOGLE_REFRESH_TOKEN=SEU_REFRESH_TOKEN_AQUI
    ```

4.  **Inicie o servidor de desenvolvimento:**
    ```bash
    npm start
    ```
    O backend estará rodando em `http://localhost:3000`.

### Passos para o Frontend

1.  **Abra o arquivo `frontend/index.html`** em seu navegador, preferencialmente usando uma extensão como o "Live Server" do VS Code para evitar problemas de CORS localmente.

2.  **Importante:** Certifique-se de que a variável `API_BASE_URL` no arquivo `frontend/app.js` está apontando para o endereço do seu backend local (`http://localhost:3000` ) durante o desenvolvimento.

---
*Este projeto foi desenvolvido como uma solução prática e didática para aprendizado de tecnologias full-stack.*
