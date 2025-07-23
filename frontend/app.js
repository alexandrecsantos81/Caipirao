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
    const tipoMovimentacaoSelect = document.getElementById('tipo');
    const categoriaMovimentacaoInput = document.getElementById('categoria');
    const clienteFieldWrapper = document.getElementById('cliente-field-wrapper');
    const clienteMovimentacaoSelect = document.getElementById('cliente-movimentacao');

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
    function fetchMovimentacoes() { return fetchData('movimentacoes', document.getElementById('movimentacoes-container'), CONFIG.SHEET_IDS.movimentacoes); }
    function fetchProdutos() { return fetchData('produtos', document.getElementById('produtos-container')); }
    
    async function fetchClientes() {
        const container = document.getElementById('clientes-container');
        await fetchData('clientes', container);
        populateClientesDropdown(allClientes);
    }

    function reloadDataForEntity(entity) {
        if (entity === 'dashboard' || entity === 'movimentacoes') {
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
            let processedData;

            // CORREÇÃO 2 e 3 APLICADA AQUI
            if (entity === 'produtos' || entity === 'clientes') {
                processedData = data; // Usa o JSON da API do PG diretamente
            } else {
                processedData = formatData(data); // Formata os dados do Google Sheets
            }

            if (entity === 'movimentacoes') {
                allMovimentacoes = processedData;
                if (document.getElementById('page-dashboard').classList.contains('active')) {
                    updateDashboard(processedData);
                }
            } else if (entity === 'clientes') {
                allClientes = processedData;
            } else if (entity === 'produtos') {
                allProdutos = processedData;
            }

            if (container) {
                createTable(container, processedData, entity, sheetId);
            }
        } catch (error) {
            console.error(`Erro ao buscar ${entity}:`, error);
            if (container) {
                container.innerHTML = `<p class="text-red-500">Falha ao carregar os dados de ${entity}.</p>`;
            }
            showNotification(`Falha ao carregar dados de ${entity}`, 'error');
        } finally {
            hideLoader();
        }
    }

    // --- LÓGICA DE ADIÇÃO (CREATE) ---
    async function handleAddFormSubmit(event) {
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
            await reloadDataForEntity(entity); 
        } catch (error) {
            console.error(`Erro ao adicionar ${entity}:`, error);
            showNotification(`Falha ao adicionar: ${error.message}`, 'error');
        } finally {
            hideLoader();
        }
    }

    // --- LÓGICA DE EDIÇÃO (UPDATE) ---
    function openEditModal(entity, rowData) {
        const idKey = (entity === 'movimentacoes') ? 'ID Mov.' : 'id'; // <-- Ajustado para 'id' minúsculo do PG
        const idValue = rowData[idKey];

        if (!idValue) {
            showNotification('Não é possível editar um registo sem ID.', 'error');
            return;
        }
        currentEditInfo = { entity, id: idValue };
        editFormFields.innerHTML = '';

        for (const key in rowData) {
            if (key.toLowerCase() === 'sheetid') continue;
            const fieldWrapper = document.createElement('div');
            const label = document.createElement('label');
            label.className = 'block text-sm font-medium text-slate-700 dark:text-slate-300';
            label.textContent = key;
            let input;

            if (key === 'Tipo (Entrada/Saída)') {
                input = document.createElement('select');
                input.className = 'form-input';
                ['ENTRADA', 'SAÍDA'].forEach(opt => {
                    const option = document.createElement('option');
                    option.value = option.textContent = opt;
                    input.appendChild(option);
                });
                input.value = rowData[key];
            } else {
                input = document.createElement('input');
                input.type = 'text';
                input.value = rowData[key];
                input.className = 'form-input';
            }
            input.id = `edit-${key}`;
            input.name = key;
            if (key === idKey) {
                input.disabled = true;
                input.classList.add('bg-slate-200', 'dark:bg-slate-600');
            }
            fieldWrapper.appendChild(label);
            fieldWrapper.appendChild(input);
            editFormFields.appendChild(fieldWrapper);
        }

        modalBackdrop.classList.remove('hidden');
        modalBackdrop.classList.add('flex');
        modal.classList.remove('-translate-y-full');
        modal.classList.add('translate-y-0');
    }

    function closeEditModal() {
        modalBackdrop.classList.add('hidden');
        modalBackdrop.classList.remove('flex');
        modal.classList.add('-translate-y-full');
        modal.classList.remove('translate-y-0');
    }

    async function handleEditFormSubmit(event) {
        event.preventDefault();
        showLoader();
        const formData = new FormData(editForm);
        const updatedData = Object.fromEntries(formData.entries());
        const { entity, id } = currentEditInfo;
        
        // Para PUT, a API espera o ID no URL, não no corpo
        const endpoint = `${CONFIG.API_BASE_URL}/api/${entity}/${id}`;

        try {
            const response = await fetch(endpoint, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(updatedData)
            });
            if (!response.ok) throw new Error(await response.text());
            showNotification('Registo atualizado com sucesso!', 'success');
            closeEditModal();
            await reloadDataForEntity(entity); 
        } catch (error) {
            console.error(`Erro ao atualizar ${entity}:`, error);
            showNotification(`Falha ao atualizar: ${error.message}`, 'error');
        } finally {
            hideLoader();
        }
    }

    // --- LÓGICA DE EXCLUSÃO (DELETE) ---
    async function deleteRow(entity, rowData) {
        const idKey = (entity === 'movimentacoes') ? 'ID Mov.' : 'id'; // <-- Ajustado para 'id' minúsculo do PG
        const uniqueId = rowData[idKey];
        if (!uniqueId) {
            showNotification('Não foi possível apagar: o registo não tem um ID.', 'error');
            return;
        }
        if (!confirm(`Tem a certeza de que quer apagar o registo com ID: ${uniqueId}?`)) return;
        showLoader();
        try {
            // A URL para DELETE já estava correta
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/${entity}/${uniqueId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            if (!response.ok) throw new Error(await response.text());
            showNotification('Registo apagado com sucesso!', 'success');
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

    function createTable(container, data, entityName) { // sheetId não é mais necessário aqui
        container.innerHTML = '';
        if (!data || data.length === 0) {
            container.innerHTML = '<p>Nenhum dado encontrado.</p>';
            return;
        }
        const table = document.createElement('table');
        table.className = 'w-full text-left border-collapse';
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        const headers = Object.keys(data[0] || {});
        headers.forEach(headerText => {
            const th = document.createElement('th');
            th.textContent = headerText;
            headerRow.appendChild(th);
        });
        const thAcoes = document.createElement('th');
        thAcoes.textContent = 'Ações';
        thAcoes.className = 'text-right';
        headerRow.appendChild(thAcoes);
        thead.appendChild(headerRow);
        table.appendChild(thead);
        const tbody = document.createElement('tbody');
        data.forEach(rowData => {
            if (Object.values(rowData).every(val => val === null || val === '')) return;
            const row = document.createElement('tr');
            headers.forEach(header => {
                const td = document.createElement('td');
                td.textContent = rowData[header];
                row.appendChild(td);
            });
            const tdBotao = document.createElement('td');
            tdBotao.className = 'text-right space-x-2';
            const editButton = document.createElement('button');
            editButton.textContent = 'Editar';
            editButton.className = 'bg-blue-500 text-white text-xs font-semibold py-1 px-2 rounded-md hover:bg-blue-600';
            editButton.addEventListener('click', () => openEditModal(entityName, rowData));
            tdBotao.appendChild(editButton);
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Apagar';
            deleteButton.className = 'bg-red-500 text-white text-xs font-semibold py-1 px-2 rounded-md hover:bg-red-600';
            deleteButton.addEventListener('click', () => deleteRow(entityName, rowData));
            tdBotao.appendChild(deleteButton);
            row.appendChild(tdBotao);
            tbody.appendChild(row);
        });
        table.appendChild(tbody);
        container.appendChild(table);
    }

    function populateClientesDropdown(clientes) {
        if (!clienteMovimentacaoSelect) return;
        clienteMovimentacaoSelect.innerHTML = '<option value="">Selecione um cliente</option>';
        if (Array.isArray(clientes)) {
            clientes.forEach(cliente => {
                const id = cliente.id; // <-- Ajustado para 'id' minúsculo do PG
                const nome = cliente.nome; // <-- Ajustado para 'nome' minúsculo do PG
                if (id && nome) {
                    const option = document.createElement('option');
                    option.value = nome;
                    option.textContent = nome;
                    clienteMovimentacaoSelect.appendChild(option);
                }
            });
        }
    }

    function toggleClienteField() {
        if (!tipoMovimentacaoSelect || !categoriaMovimentacaoInput || !clienteFieldWrapper) return;
        const tipo = tipoMovimentacaoSelect.value.toUpperCase();
        const categoria = categoriaMovimentacaoInput.value.toUpperCase();
        if (tipo === 'ENTRADA' && categoria === 'VENDA') {
            clienteFieldWrapper.classList.remove('hidden');
        } else {
            clienteFieldWrapper.classList.add('hidden');
            clienteMovimentacaoSelect.value = '';
        }
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
                    const tipoMovimentacao = (mov['Tipo (Entrada/Saída)'] || '').toLowerCase();
                    if (tipoMovimentacao === 'entrada') totalEntradas += valor;
                    else if (tipoMovimentacao === 'saída') totalSaidas += valor;
                    if (mov.Categoria) {
                        categoryTotals[mov.Categoria] = (categoryTotals[mov.Categoria] || 0) + valor;
                    }
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
        Chart.defaults.color = document.documentElement.classList.contains('dark') ? '#cbd5e1' : '#334155';
        categoryChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(categoryData),
                datasets: [{
                    label: 'Valor por Categoria',
                    data: Object.values(categoryData),
                    backgroundColor: ['#3b82f6', '#ef4444', '#22c55e', '#f97316', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'],
                    hoverOffset: 4,
                    borderColor: document.documentElement.classList.contains('dark') ? '#1e293b' : '#ffffff'
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
            showPage(pageId); 
        });
    });

    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('jwtToken');
        showNotification('Sessão terminada com sucesso!');
        setTimeout(() => { window.location.href = 'login.html'; }, 1000);
    });

    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const themeToggleDarkIcon = document.getElementById('theme-toggle-dark-icon');
    const themeToggleLightIcon = document.getElementById('theme-toggle-light-icon');

    const applyTheme = (isDark) => {
        if (isDark) {
            document.documentElement.classList.add('dark');
            themeToggleLightIcon.classList.remove('hidden');
            themeToggleDarkIcon.classList.add('hidden');
        } else {
            document.documentElement.classList.remove('dark');
            themeToggleLightIcon.classList.add('hidden');
            themeToggleDarkIcon.classList.remove('hidden');
        }
        if (document.getElementById('page-dashboard').classList.contains('active') && allMovimentacoes.length > 0) {
            updateChart(allMovimentacoes.reduce((acc, mov) => {
                if (mov.Categoria) acc[mov.Categoria] = (acc[mov.Categoria] || 0) + (parseFloat(String(mov.Valor || '0').replace(/[^0-9,.]/g, '').replace(',', '.')) || 0);
                return acc;
            }, {}));
        }
    };

    const storedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDarkMode = storedTheme === 'dark' || (storedTheme === null && systemPrefersDark);
    applyTheme(isDarkMode);

    themeToggleBtn.addEventListener('click', () => {
        const isDark = document.documentElement.classList.toggle('dark');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        applyTheme(isDark);
    });

    document.querySelectorAll('form[id^="add-"]').forEach(form => {
        let entityName = form.id.replace('add-', '').replace('-form', '');
        if (entityName === 'movimentacao') {
            entityName = 'movimentacoes';
        } else {
            entityName += 's';
        }
        form.dataset.entity = entityName;
        form.addEventListener('submit', handleAddFormSubmit);
    });

    editForm.addEventListener('submit', handleEditFormSubmit);
    closeModalBtn.addEventListener('click', closeEditModal);
    cancelEditBtn.addEventListener('click', closeEditModal);

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

    if (tipoMovimentacaoSelect && categoriaMovimentacaoInput) {
        tipoMovimentacaoSelect.addEventListener('change', toggleClienteField);
        categoriaMovimentacaoInput.addEventListener('input', toggleClienteField);
    }

    // Carrega os clientes uma vez no início para popular o dropdown
    fetchData('clientes', null).then(() => {
        populateClientesDropdown(allClientes);
    });

    // INICIALIZAÇÃO DA APLICAÇÃO
    const initialPage = window.location.hash.substring(1) || 'dashboard';
    showPage(initialPage);
});
