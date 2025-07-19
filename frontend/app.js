document.addEventListener('DOMContentLoaded', () => {
    // --- VERIFICAÇÃO INICIAL DE TOKEN ---
    const token = localStorage.getItem('jwtToken');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // ======================= CONFIGURAÇÃO CENTRALIZADA =======================
    const CONFIG = {
        API_BASE_URL: 'https://api-caipirao-maurizzio-procopio.onrender.com',
        SHEET_IDS: {
            movimentacoes: 1381900325,
            clientes: 1386962696,      // SUBSTITUA PELO ID CORRETO DA ABA 'Clientes'
            produtos: 18808149       // SUBSTITUA PELO ID CORRETO DA ABA 'Produtos'
        }
    };
    // =======================================================================

    // --- FUNÇÃO AUXILIAR PARA CABEÇALHOS DE AUTENTICAÇÃO ---
    function getAuthHeaders() {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
    }

    // --- ELEMENTOS GLOBAIS DA PÁGINA ---
    const navLinks = document.querySelectorAll('.nav-link');
    const pageContents = document.querySelectorAll('.page-content');
    const pageTitle = document.getElementById('page-title');
    const logoutBtn = document.getElementById('logout-btn');

    // --- ELEMENTOS DO MODAL DE EDIÇÃO ---
    const modalBackdrop = document.getElementById('edit-modal-backdrop');
    const modal = document.getElementById('edit-modal');
    const editForm = document.getElementById('edit-form');
    const editFormFields = document.getElementById('edit-form-fields');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    let currentEditInfo = {};
    let allMovimentacoes = [];
    let allClientes = [];
    let allProdutos = [];

    // --- LÓGICA DE NOTIFICAÇÃO (TOAST) ---
    const notificationContainer = document.getElementById('notification-container');

    function showNotification(message, type = 'success') {
        const toast = document.createElement('div');
        const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
        
        toast.className = `p-4 rounded-lg shadow-lg text-white ${bgColor} toast-in`;
        toast.textContent = message;
        
        notificationContainer.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.remove('toast-in');
            toast.classList.add('toast-out');
            toast.addEventListener('animationend', () => {
                toast.remove();
            });
        }, 3000);
    }

    // --- LÓGICA DO INDICADOR DE CARREGAMENTO ---
    const loadingOverlay = document.getElementById('loading-overlay');

    function showLoader() {
        loadingOverlay.classList.remove('hidden');
        loadingOverlay.classList.add('flex');
    }

    function hideLoader() {
        loadingOverlay.classList.add('hidden');
        loadingOverlay.classList.remove('flex');
    }

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
        if (pageId === 'dashboard') {
            fetchMovimentacoes();
        } else if (pageId === 'movimentacoes') {
            fetchMovimentacoes();
            
            // Lógica de filtragem
            const searchInput = document.getElementById('search-movimentacoes');
            if (searchInput) {
                searchInput.addEventListener('input', (e) => {
                    const searchTerm = e.target.value.toLowerCase();
                    
                    if (!searchTerm) {
                        createTable(movimentacoesContainer, allMovimentacoes, 'movimentacoes', 1381900325);
                        return;
                    }

                    const filteredMovimentacoes = allMovimentacoes.filter(mov => {
                        return Object.values(mov).some(value => 
                            String(value).toLowerCase().includes(searchTerm)
                        );
                    });

                    createTable(movimentacoesContainer, filteredMovimentacoes, 'movimentacoes', 1381900325);
                });
            }
        } else if (pageId === 'clientes') {
            fetchClientes();
        } else if (pageId === 'produtos') {
            fetchProdutos();
        }
    }

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const pageId = link.getAttribute('href').substring(1);
            window.location.hash = pageId;
            showPage(pageId);
        });
    });

    // --- LÓGICA DE LOGOUT ---
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('jwtToken');
        showNotification('Sessão terminada com sucesso!');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1000);
    });

        // --- FUNÇÕES ESPECÍFICAS DE FETCH ---
    const movimentacoesContainer = document.getElementById('movimentacoes-container');
    const clientesContainer = document.getElementById('clientes-container');
    const produtosContainer = document.getElementById('produtos-container');

    function fetchMovimentacoes() {
        fetchData('movimentacoes', movimentacoesContainer, CONFIG.SHEET_IDS.movimentacoes);
    }

    function fetchClientes() {
        fetchData('clientes', clientesContainer, CONFIG.SHEET_IDS.clientes);
    }

    function fetchProdutos() {
        fetchData('produtos', produtosContainer, CONFIG.SHEET_IDS.produtos);
    }


    // --- FUNÇÕES CRUD (Create, Read, Update, Delete) ---
    async function fetchData(entity, container, sheetId) {
    showLoader();
    const timeout = setTimeout(() => {
        hideLoader();
        showNotification('Tempo de carregamento excedido', 'error');
    }, 10000); // Timeout de 10 segundos

    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/api/${entity}`, {
        headers: getAuthHeaders()
        });

        // Limpa o timeout se a requisição concluir antes
        clearTimeout(timeout);

        if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('jwtToken');
        window.location.href = 'login.html';
        return;
        }

        if (!response.ok) throw new Error(`Erro HTTP! Status: ${response.status}`);

        const data = await response.json();
        const formattedData = formatData(data);

        // Bloco novo e corrigido
        if (entity === 'movimentacoes') {
            allMovimentacoes = formattedData;
            if (document.getElementById('page-dashboard').classList.contains('active')) {
                updateDashboard(formattedData);
            }
        } else if (entity === 'clientes') {
            allClientes = formattedData;
        } else if (entity === 'produtos') {
            allProdutos = formattedData;
        }

        createTable(container, formattedData, entity, sheetId);
    } catch (error) {
        clearTimeout(timeout); // Limpa o timeout em caso de erro
        console.error(`Erro ao buscar ${entity}:`, error);
        container.innerHTML = `<p class="text-red-500">Falha ao carregar os dados de ${entity}.</p>`;
        showNotification(`Falha ao carregar dados de ${entity}`, 'error');
    } finally {
        hideLoader();
    }
    }

    async function deleteRow(entity, rowData, sheetId) {
        // LÓGICA CORRIGIDA PARA PEGAR O ID CORRETO
        const idKey = entity === 'movimentacoes' ? 'ID Mov.' : 'ID';
        const uniqueId = rowData[idKey];

        if (!uniqueId) {
            showNotification('Não foi possível apagar: o registo não tem um ID.', 'error');
            return;
        }

        if (!confirm(`Tem a certeza de que quer apagar o registo com ID: ${uniqueId}?`)) return;
        
        showLoader();
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/${entity}?id=${uniqueId}&sheetId=${sheetId}`, { 
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            
            if (!response.ok) throw new Error(await response.text());
            
            showNotification('Registo apagado com sucesso!', 'success');
            
            if (entity === 'clientes') { fetchClientes(); } 
            else if (entity === 'produtos') { fetchProdutos(); } 
            else if (entity === 'movimentacoes') { fetchMovimentacoes(); }

        } catch (error) {
            console.error(`Erro ao apagar ${entity}:`, error);
            showNotification(`Falha ao apagar: ${error.message}`, 'error');
        } finally {
            hideLoader();
        }
    }



    // VERSÃO MELHORADA DO MODAL DE EDIÇÃO
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
            let currentValue = data[key];

            // Lógica especial para campos de preço/valor
            if (key.toLowerCase() === 'preço' || key.toLowerCase() === 'valor') {
                // Remove o "R$" e outros caracteres não numéricos, troca vírgula por ponto
                currentValue = String(currentValue)
                    .replace(/[^0-9,.]/g, '') // Remove tudo que não for número, vírgula ou ponto
                    .replace(',', '.');      // Garante que o separador seja ponto
                
                input.type = 'text';
                input.inputMode = 'decimal';
                input.pattern = "[0-9]*[.,]?[0-9]+";
            } else {
                input.type = 'text';
            }
            
            input.id = `edit-${key}`;
            input.name = key;
            input.value = currentValue;
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
        showLoader();
        
        const formData = new FormData(editForm);
        const updatedData = Object.fromEntries(formData.entries());
        const { entity, rowIndex, sheetId } = currentEditInfo;
        updatedData.sheetId = sheetId;
        
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/${entity}/${rowIndex}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(updatedData)
            });
            
            const responseText = await response.text();
            if (!response.ok) {
                showNotification(`Falha ao atualizar: ${responseText}`, 'error');
                return;
            }
            
            showNotification('Registo atualizado com sucesso!', 'success');
            closeEditModal();
            showPage(entity);
        } catch (error) {
            console.error(`Erro de rede ao atualizar ${entity}:`, error);
            showNotification(`Erro de rede: ${error.message}`, 'error');
        } finally {
            hideLoader();
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
            deleteButton.addEventListener('click', () => deleteRow(entityName, rowData, sheetId));
            tdBotao.appendChild(deleteButton);
            
            row.appendChild(tdBotao);
            tbody.appendChild(row);
        });
        
        table.appendChild(tbody);
        container.appendChild(table);
    }

    // --- LÓGICA DOS FORMULÁRIOS DE ADIÇÃO ---
    const produtoForm = document.getElementById('add-produto-form');
    const clienteForm = document.getElementById('add-cliente-form');
    const movimentacaoForm = document.getElementById('add-movimentacao-form');

    produtoForm.addEventListener('submit', (e) => handleAddFormSubmit(e, 'produtos', produtoForm, fetchProdutos));
    clienteForm.addEventListener('submit', (e) => handleAddFormSubmit(e, 'clientes', clienteForm, fetchClientes));
    movimentacaoForm.addEventListener('submit', (e) => handleAddFormSubmit(e, 'movimentacoes', movimentacaoForm, fetchMovimentacoes));

    async function handleAddFormSubmit(event, entity, form, fetchFunction) {
        event.preventDefault();
        showLoader();
        
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/${entity}`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(data)
            });
            
            if (!response.ok) throw new Error(await response.text());
            
            showNotification(`${entity.slice(0, -1)} adicionado com sucesso!`, 'success');
            form.reset();
            fetchFunction();
        } catch (error) {
            console.error(`Erro ao adicionar ${entity}:`, error);
            showNotification(`Falha ao adicionar: ${error.message}`, 'error');
        } finally {
            hideLoader();
        }
    }

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

    // --- MANIPULADOR DE ERRO GLOBAL ---
    window.addEventListener('error', function(error) {
        showNotification(`Ocorreu um erro inesperado: ${error.message}`, 'error');
        console.error('Erro global:', error);
    });
});