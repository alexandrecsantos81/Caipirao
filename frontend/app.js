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
            clientes: 1386962696,
            produtos: 18808149
        }
    };
    // =======================================================================

    // --- ELEMENTOS GLOBAIS E VARIÁVEIS DE ESTADO ---
    const navLinks = document.querySelectorAll('.nav-link' );
    const pageContents = document.querySelectorAll('.page-content');
    const pageTitle = document.getElementById('page-title');
    const logoutBtn = document.getElementById('logout-btn');
    const notificationContainer = document.getElementById('notification-container');
    const loadingOverlay = document.getElementById('loading-overlay');
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
    let categoryChart = null;

    // --- FUNÇÕES AUXILIARES (Loader, Notificação, Headers) ---
    function showLoader() { loadingOverlay.classList.remove('hidden'); loadingOverlay.classList.add('flex'); }
    function hideLoader() { loadingOverlay.classList.add('hidden'); loadingOverlay.classList.remove('flex'); }
    function getAuthHeaders() { return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }; }

    function showNotification(message, type = 'success') {
        const toast = document.createElement('div');
        const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
        toast.className = `p-4 rounded-lg shadow-lg text-white ${bgColor} toast-in`;
        toast.textContent = message;
        notificationContainer.appendChild(toast);
        setTimeout(() => {
            toast.classList.remove('toast-in');
            toast.classList.add('toast-out');
            toast.addEventListener('animationend', () => toast.remove());
        }, 3000);
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
        
        reloadDataForEntity(pageId);
    }

    // --- FUNÇÕES DE BUSCA DE DADOS (FETCH) ---
    function fetchMovimentacoes() { fetchData('movimentacoes', document.getElementById('movimentacoes-container'), CONFIG.SHEET_IDS.movimentacoes); }
    function fetchClientes() { fetchData('clientes', document.getElementById('clientes-container'), CONFIG.SHEET_IDS.clientes); }
    function fetchProdutos() { fetchData('produtos', document.getElementById('produtos-container'), CONFIG.SHEET_IDS.produtos); }

function reloadDataForEntity(entity) {
    if (entity === 'dashboard' || entity === 'movimentacoes') {
        // Adicione 'return' para que a promessa seja retornada e 'await' funcione
        return fetchMovimentacoes(); 
    } else if (entity === 'clientes') {
        return fetchClientes();
    } else if (entity === 'produtos') {
        return fetchProdutos();
    }
}

    async function fetchData(entity, container, sheetId) {
        showLoader();
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/${entity}`, { headers: getAuthHeaders() });
            if (response.status === 401 || response.status === 403) {
                localStorage.removeItem('jwtToken');
                window.location.href = 'login.html';
                return;
            }
            if (!response.ok) throw new Error(`Erro HTTP! Status: ${response.status}`);
            const data = await response.json();
            const formattedData = formatData(data);

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
            console.error(`Erro ao buscar ${entity}:`, error);
            container.innerHTML = `<p class="text-red-500">Falha ao carregar os dados de ${entity}.</p>`;
            showNotification(`Falha ao carregar dados de ${entity}`, 'error');
        } finally {
            hideLoader();
        }
    }

    // --- LÓGICA DE ADIÇÃO (CREATE) ---
async function handleAddFormSubmit(event) { // 1. Adicione 'async' aqui
    event.preventDefault();
    const form = event.target;
    const entity = form.dataset.entity;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    for (const key in data) {
        if (typeof data[key] === 'string') {
            data[key] = data[key].toUpperCase();
        }
    }
    
    showLoader();
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/api/${entity}`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error(await response.text());
        
        showNotification(`${entity.slice(0, -1)} adicionado com sucesso!`, 'success');
        form.reset();
        
        // 2. Use 'await' para esperar a recarga dos dados antes de continuar
        await reloadDataForEntity(entity); 

    } catch (error) {
        console.error(`Erro ao adicionar ${entity}:`, error);
        showNotification(`Falha ao adicionar: ${error.message}`, 'error');
    } finally {
        hideLoader();
    }
}


    // --- LÓGICA DE EDIÇÃO (UPDATE) ---
// SUBSTITUA A SUA FUNÇÃO openEditModal POR ESTA
function openEditModal(entity, rowData, sheetId) {
    const idKey = entity === 'movimentacoes' ? 'ID Mov.' : 'ID';
    const idValue = rowData[idKey];
    if (!idValue) {
        showNotification('Não é possível editar um registo sem ID.', 'error');
        return;
    }
    currentEditInfo = { entity, sheetId, id: idValue };
    editFormFields.innerHTML = '';

    for (const key in rowData) {
        if (key.toLowerCase() === 'sheetid') continue;
        const fieldWrapper = document.createElement('div');
        const label = document.createElement('label');
        label.className = 'block text-sm font-medium text-slate-700';
        label.textContent = key;
        let input;

        if (key === 'Tipo (Entrada/Saída)') {
            input = document.createElement('select');
            input.className = 'mt-1 block w-full rounded-md border-slate-300 shadow-sm';
            ['Entrada', 'Saída'].forEach(opt => {
                const option = document.createElement('option');
                option.value = option.textContent = opt;
                input.appendChild(option);
            });
            input.value = rowData[key];
        } else {
            input = document.createElement('input');
            input.type = 'text';
            input.value = rowData[key];
            input.className = 'mt-1 block w-full rounded-md border-slate-300 shadow-sm';
        }
        input.id = `edit-${key}`;
        input.name = key;
        if (key === idKey) {
            input.disabled = true;
            input.classList.add('bg-slate-100');
        }
        fieldWrapper.appendChild(label);
        fieldWrapper.appendChild(input);
        editFormFields.appendChild(fieldWrapper);
    }

    // --- CORREÇÃO APLICADA AQUI ---
    // Mostra o fundo escuro
    modalBackdrop.classList.remove('hidden');
    modalBackdrop.classList.add('flex'); // Usa flex para centralizar
    // Traz o modal para a visão
    modal.classList.remove('-translate-y-full');
    modal.classList.add('translate-y-0');
}

// SUBSTITUA A SUA FUNÇÃO closeEditModal POR ESTA
function closeEditModal() {
    // Esconde o fundo escuro
    modalBackdrop.classList.add('hidden');
    modalBackdrop.classList.remove('flex');
    // Move o modal para fora da visão para a próxima vez
    modal.classList.add('-translate-y-full');
    modal.classList.remove('translate-y-0');
}


// DENTRO DA FUNÇÃO handleEditFormSubmit
async function handleEditFormSubmit(event) {
    event.preventDefault();
    showLoader();
    const formData = new FormData(editForm);
    const updatedData = Object.fromEntries(formData.entries());
    const { entity, id } = currentEditInfo;
    updatedData.id = id;

    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/api/${entity}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(updatedData)
        });
        if (!response.ok) throw new Error(await response.text());
        showNotification('Registo atualizado com sucesso!', 'success');
        closeEditModal();
        
        // --- CORREÇÃO APLICADA AQUI ---
        await reloadDataForEntity(entity); 

    } catch (error) {
        console.error(`Erro ao atualizar ${entity}:`, error);
        showNotification(`Falha ao atualizar: ${error.message}`, 'error');
    } finally {
        hideLoader();
    }
}

    // --- LÓGICA DE EXCLUSÃO (DELETE) ---
// DENTRO DA FUNÇÃO deleteRow
async function deleteRow(entity, rowData, sheetId) {
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

        // --- CORREÇÃO APLICADA AQUI ---
        await reloadDataForEntity(entity);

    } catch (error) {
        console.error(`Erro ao apagar ${entity}:`, error);
        showNotification(`Falha ao apagar: ${error.message}`, 'error');
    } finally {
        hideLoader();
    }
}

    // --- FUNÇÕES DE CRIAÇÃO DE INTERFACE (UI) ---
    function formatData(rawData) {
        if (!rawData || rawData.length < 2) return [];
        const [headers, ...dataRows] = rawData;
        return dataRows.map(row => headers.reduce((obj, header, index) => {
            obj[header] = row[index];
            return obj;
        }, {}));
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
        data.forEach(rowData => {
            if (Object.values(rowData).every(val => val === '')) return;
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
            editButton.addEventListener('click', () => openEditModal(entityName, rowData, sheetId));
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

    // --- LÓGICA DO DASHBOARD ---
    function formatCurrency(value) { return parseFloat(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
    function updateDashboard(data) {
        let totalEntradas = 0, totalSaidas = 0;
        const categoryTotals = {};
        if (Array.isArray(data)) {
            data.forEach(mov => {
                if (mov && typeof mov === 'object') {
                    const valor = parseFloat(String(mov.Valor || '0').replace(/[^0-9,.]/g, '').replace(',', '.')) || 0;
                    if (mov['Tipo (Entrada/Saída)'] === 'Entrada') totalEntradas += valor;
                    else if (mov['Tipo (Entrada/Saída)'] === 'Saída') totalSaidas += valor;
                    if (mov.Categoria) categoryTotals[mov.Categoria] = (categoryTotals[mov.Categoria] || 0) + valor;
                }
            });
        }
        document.getElementById('total-entradas').textContent = formatCurrency(totalEntradas);
        document.getElementById('total-saidas').textContent = formatCurrency(totalSaidas);
        document.getElementById('saldo-atual').textContent = formatCurrency(totalEntradas - totalSaidas);
        updateChart(categoryTotals);
    }

    function updateChart(categoryData) {
        if (categoryChart) categoryChart.destroy();
        const ctx = document.getElementById('categoryChart').getContext('2d');
        categoryChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(categoryData),
                datasets: [{
                    label: 'Valor por Categoria',
                    data: Object.values(categoryData),
                    backgroundColor: ['#3b82f6', '#ef4444', '#22c55e', '#f97316', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'],
                    hoverOffset: 4
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }

// --- EVENT LISTENERS E INICIALIZAÇÃO ---
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const pageId = link.getAttribute('href').substring(1);
        window.location.hash = pageId;
        // A FUNÇÃO showPage AGORA SÓ MOSTRA A PÁGINA E CARREGA OS DADOS
        showPage(pageId); 
    });
});

logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('jwtToken');
    showNotification('Sessão terminada com sucesso!');
    setTimeout(() => { window.location.href = 'login.html'; }, 1000);
});

// =====================================================================
// NOVA LÓGICA CENTRALIZADA PARA ADICIONAR LISTENERS (FAÇA ISSO APENAS UMA VEZ)
// =====================================================================
document.querySelectorAll('form[id^="add-"]').forEach(form => {
    let entityName = form.id.replace('add-', '').replace('-form', '');

    if (entityName === 'movimentacao') {
        entityName = 'movimentacoes';
    } else if (entityName.endsWith('o') || entityName.endsWith('e')) {
        entityName += 's';
    }
    
    form.dataset.entity = entityName;
    
    // A linha abaixo é a mais importante. Ela adiciona o listener uma única vez.
    form.addEventListener('submit', handleAddFormSubmit);
});
// =====================================================================


editForm.addEventListener('submit', handleEditFormSubmit);
closeModalBtn.addEventListener('click', closeEditModal);
cancelEditBtn.addEventListener('click', closeEditModal);

// Lógica de filtragem para movimentações
const searchInput = document.getElementById('search-movimentacoes');
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredMovimentacoes = allMovimentacoes.filter(mov => 
            Object.values(mov).some(value => String(value).toLowerCase().includes(searchTerm))
        );
        createTable(document.getElementById('movimentacoes-container'), filteredMovimentacoes, 'movimentacoes', CONFIG.SHEET_IDS.movimentacoes);
    });
}

// INICIALIZAÇÃO DA APLICAÇÃO
const initialPage = window.location.hash.substring(1) || 'dashboard';
showPage(initialPage);

});