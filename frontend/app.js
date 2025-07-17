document.addEventListener('DOMContentLoaded', () => {
    
    // ATENÇÃO: Substitua pelo seu URL real do Render
    const API_BASE_URL = 'https://api-caipirao-maurizzio-procopio.onrender.com';

    // --- LÓGICA DE NAVEGAÇÃO ---
    const navLinks = document.querySelectorAll('.nav-link');
    const pageContents = document.querySelectorAll('.page-content');
    const pageTitle = document.getElementById('page-title');

    function showPage(pageId) {
        pageContents.forEach(page => page.classList.remove('active'));
        navLinks.forEach(link => link.classList.remove('active'));
        const targetPage = document.getElementById(`page-${pageId}`);
        const targetLink = document.querySelector(`a[href="#${pageId}"]`);
        
        if (targetPage) {
            targetPage.classList.add('active');
            pageTitle.textContent = targetLink.textContent.trim().replace(/^[^\w]+/, '');
        }
        if (targetLink) targetLink.classList.add('active');
        
        // Carrega os dados da página selecionada
        if (pageId === 'dashboard') fetchMovimentacoes();
        else if (pageId === 'movimentacoes') fetchMovimentacoes();
        else if (pageId === 'clientes') fetchClientes();
        else if (pageId === 'produtos') fetchProdutos();
    }

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const pageId = link.getAttribute('href').substring(1);
            showPage(pageId);
        });
    });

    // --- FUNÇÃO GENÉRICA DE DELETE ---
    async function deleteRow(entity, rowIndex, sheetId) {
        if (!confirm(`Tem a certeza de que quer apagar esta linha?`)) return;
        try {
            // O índice da API do Sheets é baseado em 0, e a primeira linha de dados é a linha 2 da planilha (índice 1)
            const apiRowIndex = rowIndex + 1;
            const response = await fetch(`${API_BASE_URL}/api/${entity}/${apiRowIndex}`, { 
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sheetId: sheetId }) // Enviando o sheetId para o backend
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || `Erro ao apagar! Status: ${response.status}`);
            }
            alert(`${entity.slice(0, -1)} apagado com sucesso!`);
            showPage(entity); // Recarrega os dados da página atual
        } catch (error) {
            console.error(`Erro ao apagar ${entity}:`, error);
            alert(`Falha ao apagar: ${error.message}`);
        }
    }

    // --- LÓGICA DA PÁGINA DE PRODUTOS ---
    const produtosContainer = document.getElementById('produtos-container');
    const produtoForm = document.getElementById('add-produto-form');
    async function fetchProdutos() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/produtos`);
            if (!response.ok) throw new Error(`Erro HTTP! Status: ${response.status}`);
            const data = await response.json();
            const formattedData = formatData(data);
            // ATUALIZADO: Usando o seu ID de Produtos
            createTable(produtosContainer, formattedData, 'produtos', 18808149);
        } catch (error) {
            console.error('Erro ao buscar produtos:', error);
            produtosContainer.innerHTML = '<p class="text-red-500">Falha ao carregar os dados dos produtos.</p>';
        }
    }
    produtoForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(produtoForm);
        const data = Object.fromEntries(formData.entries());
        try {
            const response = await fetch(`${API_BASE_URL}/api/produtos`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
            if (!response.ok) throw new Error(`Erro ao enviar dados! Status: ${response.status}`);
            alert('Produto adicionado com sucesso!');
            produtoForm.reset();
            fetchProdutos();
        } catch (error) {
            console.error('Erro ao adicionar produto:', error);
            alert('Falha ao adicionar produto.');
        }
    });

    // --- LÓGICA DA PÁGINA DE CLIENTES ---
    const clientesContainer = document.getElementById('clientes-container');
    const clienteForm = document.getElementById('add-cliente-form');
    async function fetchClientes() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/clientes`);
            if (!response.ok) throw new Error(`Erro HTTP! Status: ${response.status}`);
            const data = await response.json();
            const formattedData = formatData(data);
            // ATUALIZADO: Usando o seu ID de Clientes
            createTable(clientesContainer, formattedData, 'clientes', 1386962696);
        } catch (error) {
            console.error('Erro ao buscar clientes:', error);
            clientesContainer.innerHTML = '<p class="text-red-500">Falha ao carregar os dados dos clientes.</p>';
        }
    }
    clienteForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(clienteForm);
        const data = Object.fromEntries(formData.entries());
        try {
            const response = await fetch(`${API_BASE_URL}/api/clientes`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
            if (!response.ok) throw new Error(`Erro ao enviar dados! Status: ${response.status}`);
            alert('Cliente adicionado com sucesso!');
            clienteForm.reset();
            fetchClientes();
        } catch (error) {
            console.error('Erro ao adicionar cliente:', error);
            alert('Falha ao adicionar cliente.');
        }
    });

    // --- LÓGICA DO DASHBOARD E MOVIMENTAÇÕES ---
    const movimentacoesContainer = document.getElementById('movimentacoes-container');
    const movimentacaoForm = document.getElementById('add-movimentacao-form');
    const totalEntradasEl = document.getElementById('total-entradas');
    const totalSaidasEl = document.getElementById('total-saidas');
    const saldoAtualEl = document.getElementById('saldo-atual');
    const categoryChartCanvas = document.getElementById('categoryChart');
    let categoryChart = null;

    function formatCurrency(value) {
        return parseFloat(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    async function fetchMovimentacoes() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/movimentacoes`);
            if (!response.ok) throw new Error(`Erro HTTP! Status: ${response.status}`);
            const data = await response.json();
            const formattedData = formatData(data);
            if(document.getElementById('page-dashboard').classList.contains('active')) {
                updateDashboard(formattedData);
            }
            // ATUALIZADO: Usando o seu ID de Movimentações
            createTable(movimentacoesContainer, formattedData, 'movimentacoes', 1381900325);
        } catch (error) {
            console.error('Erro ao buscar dados da API:', error);
            movimentacoesContainer.innerHTML = '<p class="text-red-500">Falha ao carregar os dados. Verifique se o servidor backend está a correr.</p>';
        }
    }
    
    function formatData(rawData) {
        if (!rawData || rawData.length < 2) return [];
        const headers = rawData[0];
        const dataRows = rawData.slice(1);
        return dataRows.map(row => {
            const rowData = {};
            headers.forEach((header, index) => {
                rowData[header] = row[index];
            });
            return rowData;
        });
    }

    function updateDashboard(data) {
        let totalEntradas = 0, totalSaidas = 0;
        const categoryTotals = {};
        if (Array.isArray(data)) {
            data.forEach(mov => {
                if (mov && typeof mov === 'object') {
                    const valorString = mov.Valor || '0';
                    const valor = parseFloat(valorString.replace('R$', '').replace(/\./g, '').replace(',', '.').trim()) || 0;
                    const tipo = mov['Tipo (Entrada/Saída)'];
                    const categoria = mov.Categoria;
                    if (tipo === 'Entrada') {
                        totalEntradas += valor;
                        if (categoria) categoryTotals[categoria] = (categoryTotals[categoria] || 0) + valor;
                    } else if (tipo === 'Saída') {
                        totalSaidas += valor;
                        if (categoria) categoryTotals[categoria] = (categoryTotals[categoria] || 0) + valor;
                    }
                }
            });
        }
        const saldoAtual = totalEntradas - totalSaidas;
        totalEntradasEl.textContent = formatCurrency(totalEntradas);
        totalSaidasEl.textContent = formatCurrency(totalSaidas);
        saldoAtualEl.textContent = formatCurrency(saldoAtual);
        updateChart(categoryTotals);
    }

    function updateChart(categoryData) {
        const labels = Object.keys(categoryData);
        const data = Object.values(categoryData);
        if (categoryChart) {
            categoryChart.data.labels = labels;
            categoryChart.data.datasets[0].data = data;
            categoryChart.update();
        } else {
            const ctx = categoryChartCanvas.getContext('2d');
            categoryChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Valor por Categoria',
                        data: data,
                        backgroundColor: ['#3b82f6', '#ef4444', '#22c55e', '#f97316', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'],
                        hoverOffset: 4
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false }
            });
        }
    }
    
    function createTable(container, data, entityName, sheetId) {
        container.innerHTML = '';
        if (!data || data.length === 0) {
            container.innerHTML = '<p>Nenhum dado encontrado.</p>';
            return;
        }
        const table = document.createElement('table');
        table.className = 'w-full text-left';
        const thead = document.createElement('thead');
        thead.className = 'bg-slate-100';
        const headerRow = document.createElement('tr');
        const headers = Object.keys(data[0] || {});
        headers.forEach(headerText => {
            const th = document.createElement('th');
            th.className = 'p-3 font-semibold';
            th.textContent = headerText;
            headerRow.appendChild(th);
        });
        const thAcoes = document.createElement('th');
        thAcoes.className = 'p-3 font-semibold text-right';
        thAcoes.textContent = 'Ações';
        headerRow.appendChild(thAcoes);
        thead.appendChild(headerRow);
        table.appendChild(thead);
        const tbody = document.createElement('tbody');
        data.forEach((rowData, index) => {
            const row = document.createElement('tr');
            row.className = 'border-b border-slate-200 hover:bg-slate-50';
            headers.forEach(header => {
                const td = document.createElement('td');
                td.className = 'p-3';
                td.textContent = rowData[header];
                row.appendChild(td);
            });
            const tdBotao = document.createElement('td');
            tdBotao.className = 'p-3 text-right space-x-2'; // Adicionado space-x-2 para espaçamento

            // Botão Editar
            const editButton = document.createElement('button');
            editButton.textContent = 'Editar';
            editButton.className = 'bg-blue-500 text-white text-xs font-semibold py-1 px-2 rounded-md hover:bg-blue-600';
            // A função openEditModal será criada no Passo 3
            editButton.addEventListener('click', () => openEditModal(entityName, index, rowData)); 
            tdBotao.appendChild(editButton);

            // Botão Apagar
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Apagar';
            deleteButton.className = 'bg-red-500 text-white text-xs font-semibold py-1 px-2 rounded-md hover:bg-red-600';
            deleteButton.addEventListener('click', () => deleteRow(entityName, index, sheetId));
            tdBotao.appendChild(deleteButton);

            row.appendChild(tdBotao);
            tbody.appendChild(row);
        });
        table.appendChild(tbody);
        container.appendChild(table);
    }

    movimentacaoForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(movimentacaoForm);
        const data = Object.fromEntries(formData.entries());
        try {
            const response = await fetch(`${API_BASE_URL}/api/movimentacoes`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
            if (!response.ok) throw new Error(`Erro ao enviar dados! Status: ${response.status}`);
            alert('Movimentação adicionada com sucesso!');
            movimentacaoForm.reset();
            fetchMovimentacoes();
        } catch (error) {
            console.error('Erro ao enviar formulário:', error);
            alert('Falha ao adicionar movimentação.');
        }
    });

    showPage('dashboard');
});

// --- LÓGICA DO MODAL DE EDIÇÃO ---

const modalBackdrop = document.getElementById('edit-modal-backdrop');
const modal = document.getElementById('edit-modal');
const editForm = document.getElementById('edit-form');
const editFormFields = document.getElementById('edit-form-fields');
const closeModalBtn = document.getElementById('close-modal-btn');
const cancelEditBtn = document.getElementById('cancel-edit-btn');

let currentEditInfo = {}; // Para guardar a informação do registo a ser editado

// Função para ABRIR o modal e preencher o formulário
function openEditModal(entity, rowIndex, data) {
    currentEditInfo = { entity, rowIndex }; // Guarda a entidade e o índice
    editFormFields.innerHTML = ''; // Limpa campos antigos

    // Cria dinamicamente os campos de input baseados nos dados
    for (const key in data) {
        // Não cria campo para o ID da planilha ou outros campos internos
        if (key.toLowerCase() === 'sheetid') continue;

        const fieldWrapper = document.createElement('div');
        
        const label = document.createElement('label');
        label.for = `edit-${key}`;
        label.className = 'block text-sm font-medium text-slate-700';
        label.textContent = key;
        
        const input = document.createElement('input');
        input.type = 'text';
        input.id = `edit-${key}`;
        input.name = key;
        input.value = data[key];
        input.className = 'mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm';

        fieldWrapper.appendChild(label);
        fieldWrapper.appendChild(input);
        editFormFields.appendChild(fieldWrapper);
    }

    // Mostra o modal com uma animação
    modalBackdrop.classList.remove('hidden');
    modalBackdrop.classList.add('flex');
    setTimeout(() => {
        modal.classList.remove('-translate-y-full');
    }, 50);
}

// Função para FECHAR o modal
function closeEditModal() {
    modal.classList.add('-translate-y-full');
    setTimeout(() => {
        modalBackdrop.classList.add('hidden');
        modalBackdrop.classList.remove('flex');
    }, 300); // Tempo da animação
}

// Event listener para o botão de fechar
closeModalBtn.addEventListener('click', closeEditModal);
cancelEditBtn.addEventListener('click', closeEditModal);

// Event listener para o formulário de edição
editForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    
    const formData = new FormData(editForm);
    const updatedData = Object.fromEntries(formData.entries());
    
    const { entity, rowIndex } = currentEditInfo;

    try {
        const response = await fetch(`${API_BASE_URL}/api/${entity}/${rowIndex}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || `Erro ao atualizar! Status: ${response.status}`);
        }

        alert('Registo atualizado com sucesso!');
        closeEditModal();
        
        // Recarrega os dados da página atual para mostrar a alteração
        showPage(entity); 

    } catch (error) {
        console.error(`Erro ao atualizar ${entity}:`, error);
        alert(`Falha ao atualizar: ${error.message}`);
    }
});
