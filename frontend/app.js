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
            pageTitle.textContent = targetLink.textContent.trim().replace(/^[^\w\s]+/, ''); // Remove emoji
        }
        if (targetLink) {
            targetLink.classList.add('active');
        }
        
        if (pageId === 'dashboard' && allMovimentacoes.length > 0) {
            updateDashboard(allMovimentacoes);
        } else {
            reloadDataForEntity(pageId);
        }
    }

    // --- FUNÇÕES DE BUSCA DE DADOS (FETCH) ---
    function reloadDataForEntity(entity) {
        const pageContainers = {
            dashboard: null,
            movimentacoes: document.getElementById('movimentacoes-container'),
            clientes: document.getElementById('clientes-container'),
            produtos: document.getElementById('produtos-container')
        };
        
        const entityToFetch = (entity === 'dashboard') ? 'movimentacoes' : entity;
        const container = pageContainers[entity];

        fetchData(entityToFetch, container).then(() => {
            if (entity === 'clientes') {
                populateClientesDropdown(allClientes);
            }
            if (entity === 'dashboard') {
                updateDashboard(allMovimentacoes);
            }
        });
    }

    async function fetchData(entity, container) {
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

            if (entity === 'movimentacoes') allMovimentacoes = data;
            else if (entity === 'clientes') allClientes = data;
            else if (entity === 'produtos') allProdutos = data;

            if (container) {
                // Adicionando a classe para a responsividade da tabela
                container.classList.add('responsive-table-container');
                createTable(container, data, entity);
            }
        } catch (error) {
            console.error(`Erro ao buscar ${entity}:`, error);
            if (container) container.innerHTML = `<p class="text-red-500">Falha ao carregar os dados de ${entity}.</p>`;
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
   
        showLoader();
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/${entity}`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(data)
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erro desconhecido');
            }
            
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
        const idValue = rowData.id;
        if (!idValue) {
            showNotification('Não é possível editar um registo sem ID.', 'error');
            return;
        }
        currentEditInfo = { entity, id: idValue };
        editFormFields.innerHTML = '';

        for (const key in rowData) {
            if (key.toLowerCase() === 'id') continue;
            const fieldWrapper = document.createElement('div');
            const label = document.createElement('label');
            label.className = 'block text-sm font-medium text-slate-700 dark:text-slate-300';
            label.textContent = key;
            
            let input;
            if (key === 'tipo') {
                input = document.createElement('select');
                input.className = 'form-input';
                ['ENTRADA', 'SAÍDA'].forEach(opt => {
                    const option = document.createElement('option');
                    option.value = option.textContent = opt;
                    input.appendChild(option);
                });
            } else {
                input = document.createElement('input');
                input.type = 'text';
                input.className = 'form-input';
            }
            
            input.value = rowData[key];
            input.id = `edit-${key}`;
            input.name = key;

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
        
        const endpoint = `${CONFIG.API_BASE_URL}/api/${entity}/${id}`;

        try {
            const response = await fetch(endpoint, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(updatedData)
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erro desconhecido');
            }
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
        const uniqueId = rowData.id;
        if (!uniqueId) {
            showNotification('Não foi possível apagar: o registo não tem um ID.', 'error');
            return;
        }
        if (!confirm(`Tem a certeza de que quer apagar o registo com ID: ${uniqueId}?`)) return;
        
        showLoader();
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/${entity}/${uniqueId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erro desconhecido');
            }
            showNotification('Registo apagado com sucesso!', 'success');
            await reloadDataForEntity(entity);
        } catch (error) {
            console.error(`Erro ao apagar ${entity}:`, error);
            showNotification(`Falha ao apagar: ${error.message}`, 'error');
        } finally {
            hideLoader();
        }
    }

    // --- FUNÇÃO PARA CRIAR TABELAS ---
    function createTable(container, data, entityName) {
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
                td.setAttribute('data-label', header); // Essencial para a responsividade
                if (header === 'data' && rowData[header]) {
                    td.textContent = new Date(rowData[header]).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
                } else {
                    td.textContent = rowData[header];
                }
                row.appendChild(td);
            });
            
            const tdBotao = document.createElement('td');
            tdBotao.setAttribute('data-label', 'Ações'); 
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

    // --- FUNÇÕES ESPECÍFICAS DE UI ---
    function populateClientesDropdown(clientes) {
        if (!clienteMovimentacaoSelect) return;
        clienteMovimentacaoSelect.innerHTML = '<option value="">Selecione um cliente</option>';
        if (Array.isArray(clientes)) {
            clientes.forEach(cliente => {
                if (cliente.id && cliente.nome) {
                    const option = document.createElement('option');
                    option.value = cliente.nome;
                    option.textContent = cliente.nome.toUpperCase();
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
        if (!document.getElementById('total-entradas')) return;

        let totalEntradas = 0, totalSaidas = 0;
        const categoryTotals = {};
        if (Array.isArray(data)) {
            data.forEach(mov => {
                if (mov && typeof mov === 'object') {
                    const valor = parseFloat(mov.valor || 0);
                    const tipoMovimentacao = (mov.tipo || '').toLowerCase();
                    if (tipoMovimentacao === 'entrada') totalEntradas += valor;
                    else if (tipoMovimentacao === 'saída') totalSaidas += valor;
                    if (mov.categoria) categoryTotals[mov.categoria] = (categoryTotals[mov.categoria] || 0) + valor;
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
            // A função showPage já é chamada pelo evento hashchange
        });
    });

    // Atualiza a página com base no hash da URL
    window.addEventListener('hashchange', () => showPage(window.location.hash.substring(1) || 'dashboard'));

    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('jwtToken');
        showNotification('Sessão terminada com sucesso!');
        setTimeout(() => { window.location.href = 'login.html'; }, 1000);
    });

    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    if (themeToggleBtn) {
        const themeToggleDarkIcon = document.getElementById('theme-toggle-dark-icon');
        const themeToggleLightIcon = document.getElementById('theme-toggle-light-icon');
        const applyTheme = (isDark) => {
            document.documentElement.classList.toggle('dark', isDark);
            themeToggleLightIcon.classList.toggle('hidden', !isDark);
            themeToggleDarkIcon.classList.toggle('hidden', isDark);
            if (document.getElementById('page-dashboard').classList.contains('active') && allMovimentacoes.length > 0) {
                updateDashboard(allMovimentacoes);
            }
        };
        const storedTheme = localStorage.getItem('theme');
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const isDarkMode = storedTheme === 'dark' || (storedTheme === null && systemPrefersDark);
        applyTheme(isDarkMode);
        themeToggleBtn.addEventListener('click', () => {
            const newIsDark = document.documentElement.classList.toggle('dark');
            localStorage.setItem('theme', newIsDark ? 'dark' : 'light');
            applyTheme(newIsDark);
        });
    }

    document.querySelectorAll('form[id^="add-"]').forEach(form => {
        let entityName = form.id.replace('add-', '').replace('-form', '');
        entityName = (entityName === 'movimentacao') ? 'movimentacoes' : `${entityName}s`;
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
            createTable(document.getElementById('movimentacoes-container'), filteredMovimentacoes, 'movimentacoes');
        });
    }

    if (tipoMovimentacaoSelect && categoriaMovimentacaoInput) {
        tipoMovimentacaoSelect.addEventListener('change', toggleClienteField);
        categoriaMovimentacaoInput.addEventListener('input', toggleClienteField);
    }

    // ================================================================
    // ====> INÍCIO: LÓGICA DO MENU HAMBÚRGUER E SIDEBAR <====
    // ================================================================
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');

    const toggleSidebar = () => {
        sidebar.classList.toggle('active');
        sidebarOverlay.classList.toggle('hidden');
    };

    if (hamburgerBtn && sidebar && sidebarOverlay) {
        hamburgerBtn.addEventListener('click', toggleSidebar);
        sidebarOverlay.addEventListener('click', toggleSidebar);
    }

    // Fecha o menu ao clicar num link (útil em mobile)
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            // Apenas fecha se o menu estiver visível (em telas menores que 'lg')
            if (window.innerWidth < 1024) {
                if (sidebar.classList.contains('active')) {
                    toggleSidebar();
                }
            }
        });
    });
    // ================================================================
    // ====> FIM: LÓGICA DO MENU HAMBÚRGUER E SIDEBAR <====
    // ================================================================

    // --- INICIALIZAÇÃO DA APLICAÇÃO ---
    fetchData('clientes', null).then(() => {
        populateClientesDropdown(allClientes);
    });
    
    const initialPage = window.location.hash.substring(1) || 'dashboard';
    showPage(initialPage);
});
