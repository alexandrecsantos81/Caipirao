document.addEventListener('DOMContentLoaded', () => {
    
    // URL da API do Backend
    const API_BASE_URL = 'https://api-caipirao-maurizzio-procopio.onrender.com';

    // --- ELEMENTOS GLOBAIS DA PÁGINA ---
    const navLinks = document.querySelectorAll('.nav-link'  );
    const pageContents = document.querySelectorAll('.page-content');
    const pageTitle = document.getElementById('page-title');

    // --- ELEMENTOS DO MODAL DE EDIÇÃO ---
    const modalBackdrop = document.getElementById('edit-modal-backdrop');
    const modal = document.getElementById('edit-modal');
    const editForm = document.getElementById('edit-form');
    const editFormFields = document.getElementById('edit-form-fields');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    let currentEditInfo = {}; // Guarda a informação do registo a ser editado

    // --- LÓGICA DE NAVEGAÇÃO ---
    function showPage(pageId) {
        pageContents.forEach(page => page.classList.remove('active'));
        navLinks.forEach(link => link.classList.remove('active'));
        
        const targetPage = document.getElementById(`page-${pageId}`);
        const targetLink = document.querySelector(`a[href="#${pageId}"]`);
        
        if (targetPage) {
            targetPage.classList.add('active');
            pageTitle.textContent = targetLink.textContent.trim().replace(/^[^\w]+/, '');
        }
        if (targetLink) {
            targetLink.classList.add('active');
        }
        
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
            window.location.hash = pageId; // Atualiza a URL para navegação
            showPage(pageId);
        });
    });

    // --- FUNÇÕES CRUD (Create, Read, Update, Delete) ---

    // Função genérica para buscar dados e criar tabelas (VERSÃO CORRIGIDA)
    async function fetchData(entity, container, sheetId) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/${entity}`);
            if (!response.ok) {
                throw new Error(`Erro HTTP! Status: ${response.status}`);
            }
            const data = await response.json();
            const formattedData = formatData(data);
            
            if (entity === 'movimentacoes' && document.getElementById('page-dashboard').classList.contains('active')) {
                updateDashboard(formattedData);
            }
            
            createTable(container, formattedData, entity, sheetId);

        } catch (error) {
            console.error(`Erro ao buscar ${entity}:`, error);
            container.innerHTML = `<p class="text-red-500">Falha ao carregar os dados de ${entity}.</p>`;
        }
    }

    // Funções específicas para cada entidade
    const produtosContainer = document.getElementById('produtos-container');
    function fetchProdutos() { fetchData('produtos', produtosContainer, 'produtos'); } 

    const clientesContainer = document.getElementById('clientes-container');
    function fetchClientes() { fetchData('clientes', clientesContainer, 'clientes'); }

    const movimentacoesContainer = document.getElementById('movimentacoes-container');
    function fetchMovimentacoes() { fetchData('movimentacoes', movimentacoesContainer, 'movimentacoes'); }

    // Função para apagar uma linha
    async function deleteRow(entity, rowIndex, sheetId) {
        if (!confirm('Tem a certeza de que quer apagar esta linha?')) return;
        try {
            const response = await fetch(`${API_BASE_URL}/api/${entity}/${rowIndex}`, { 
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sheetId })
            });
            if (!response.ok) throw new Error(await response.text());
            // alert('Registo apagado com sucesso!'); // REMOVIDO
            showPage(entity);
        } catch (error) {
            console.error(`Erro ao apagar ${entity}:`, error);
            alert(`Falha ao apagar: ${error.message}`);
        }
    }

    // --- LÓGICA DO MODAL DE EDIÇÃO ---

    function openEditModal(entity, rowIndex, data, sheetId) {
        currentEditInfo = { entity, rowIndex, sheetId };
        editFormFields.innerHTML = '';

        for (const key in data) {
            if (key.toLowerCase() === 'sheetid') continue;
            const fieldWrapper = document.createElement('div');
            const label = document.createElement('label');
            label.htmlFor = `edit-${key}`;
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

        modalBackdrop.classList.remove('hidden');
        modalBackdrop.classList.add('flex');
        setTimeout(() => modal.classList.remove('-translate-y-full'), 50);
    }

    function closeEditModal() {
        modal.classList.add('-translate-y-full');
        setTimeout(() => {
            modalBackdrop.classList.add('hidden');
            modalBackdrop.classList.remove('flex');
        }, 300);
    }

    closeModalBtn.addEventListener('click', closeEditModal);
    cancelEditBtn.addEventListener('click', closeEditModal);

    editForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        const formData = new FormData(editForm);
        const updatedData = Object.fromEntries(formData.entries());
        
        const { entity, rowIndex, sheetId } = currentEditInfo;
        
        updatedData.sheetId = sheetId; 

        try {
            const response = await fetch(`${API_BASE_URL}/api/${entity}/${rowIndex}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedData)
            });
            const responseText = await response.text();
            if (!response.ok) {
                alert(`Falha ao atualizar: ${responseText}`);
                return; 
            }
            // alert('Registo atualizado com sucesso!'); // REMOVIDO
            closeEditModal();
            showPage(entity);
        } catch (error) {
            console.error(`Erro de rede ao atualizar ${entity}:`, error);
            alert(`Erro de rede: ${error.message}`);
        }
    });


    // --- FUNÇÕES DE FORMATAÇÃO E CRIAÇÃO DE TABELA ---

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
            tdBotao.className = 'p-3 text-right space-x-2';
            const editButton = document.createElement('button');
            editButton.textContent = 'Editar';
            editButton.className = 'bg-blue-500 text-white text-xs font-semibold py-1 px-2 rounded-md hover:bg-blue-600';
            editButton.addEventListener('click', () => openEditModal(entityName, index, rowData, sheetId));
            tdBotao.appendChild(editButton);
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

    // --- LÓGICA DOS FORMULÁRIOS DE ADIÇÃO ---

    async function handleAddFormSubmit(event, entity, form, fetchFunction) {
        event.preventDefault();
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        try {
            const response = await fetch(`${API_BASE_URL}/api/${entity}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error(await response.text());
            // alert(`${entity.slice(0, -1)} adicionado com sucesso!`); // REMOVIDO
            form.reset();
            fetchFunction();
        } catch (error) {
            console.error(`Erro ao adicionar ${entity}:`, error);
            alert(`Falha ao adicionar: ${error.message}`);
        }
    }

    const produtoForm = document.getElementById('add-produto-form');
    produtoForm.addEventListener('submit', (e) => handleAddFormSubmit(e, 'produtos', produtoForm, fetchProdutos));

    const clienteForm = document.getElementById('add-cliente-form');
    clienteForm.addEventListener('submit', (e) => handleAddFormSubmit(e, 'clientes', clienteForm, fetchClientes));

    const movimentacaoForm = document.getElementById('add-movimentacao-form');
    movimentacaoForm.addEventListener('submit', (e) => handleAddFormSubmit(e, 'movimentacoes', movimentacaoForm, fetchMovimentacoes));

    // --- LÓGICA DO DASHBOARD ---
    const totalEntradasEl = document.getElementById('total-entradas');
    const totalSaidasEl = document.getElementById('total-saidas');
    const saldoAtualEl = document.getElementById('saldo-atual');
    const categoryChartCanvas = document.getElementById('categoryChart');
    let categoryChart = null;

    function formatCurrency(value) {
        return parseFloat(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
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
        totalEntradasEl.textContent = formatCurrency(totalEntradas);
        totalSaidasEl.textContent = formatCurrency(totalSaidas);
        saldoAtualEl.textContent = formatCurrency(totalEntradas - totalSaidas);
        updateChart(categoryTotals);
    }

    function updateChart(categoryData) {
        const labels = Object.keys(categoryData);
        const data = Object.values(categoryData);
        if (categoryChart) {
            categoryChart.destroy();
        }
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

    // --- INICIALIZAÇÃO DA APLICAÇÃO ---
    const initialPage = window.location.hash.substring(1) || 'dashboard';
    showPage(initialPage);
});
