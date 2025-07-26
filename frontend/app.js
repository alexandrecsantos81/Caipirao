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
            pageTitle.textContent = targetLink.textContent.trim().replace(/^[^\w]+/, '');
        }
        if (targetLink) {
            targetLink.classList.add('active');
        }
        
        if (pageId === 'dashboard' && allMovimentacoes.length > 0) {
            updateDashboard(allMovimentacoes);
        } else {

            reloadDataForEntity(pageId);
    }

    // --- FUNÇÕES DE BUSCA DE DADOS (FETCH) ---
    function reloadDataForEntity(entity) {
        const pageContainers = {
            dashboard: document.getElementById('movimentacoes-container'), // Dashboard depende de movimentações
            movimentacoes: document.getElementById('movimentacoes-container'),
            clientes: document.getElementById('clientes-container'),
            produtos: document.getElementById('produtos-container')
        };
        
        const entityToFetch = (entity === 'dashboard') ? 'movimentacoes' : entity;
        const container = pageContainers[entity];

        fetchData(entityToFetch, container).then(() => {
            // Após buscar os dados, executa ações específicas
            if (entity === 'clientes') {
                populateClientesDropdown(allClientes);
            }
            if (entity === 'dashboard') {
                updateDashboard(allMovimentacoes);
            }
        });
    }

    // ===== CORREÇÃO: Função fetchData totalmente simplificada =====
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
<<<<<<< HEAD
            
            const formattedData = formatData(data);

            if (entity === 'movimentacoes') {
                allMovimentacoes = formattedData;
                if (document.getElementById('page-dashboard').classList.contains('active')) {
                    updateDashboard(allMovimentacoes);
                }
            } else if (entity === 'clientes') {
                allClientes = formattedData;
            } else if (entity === 'produtos') {
                allProdutos = formattedData;
            }
            
            if (entity !== 'dashboard') {
            createTable(container, formattedData, entity, sheetId);
            }

=======

            // Armazena os dados na variável de estado correspondente
            if (entity === 'movimentacoes') allMovimentacoes = data;
            else if (entity === 'clientes') allClientes = data;
            else if (entity === 'produtos') allProdutos = data;

            // Se houver um container para exibir a tabela, cria a tabela
            if (container) {
                createTable(container, data, entity);
            }
>>>>>>> c0596c1ae1a7b5b845a6d15f57510b6f34adb803
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
        // ===== CORREÇÃO: A chave do ID é sempre 'id' (minúsculo) agora. =====
        const idValue = rowData.id;

        if (!idValue) {
            showNotification('Não é possível editar um registo sem ID.', 'error');
            return;
        }
        currentEditInfo = { entity, id: idValue };
        editFormFields.innerHTML = '';

        // Cria os campos do formulário dinamicamente
        for (const key in rowData) {
            // Não cria campo para o ID, pois ele não deve ser editado manualmente.
            if (key.toLowerCase() === 'id') continue;

            const fieldWrapper = document.createElement('div');
            const label = document.createElement('label');
            label.className = 'block text-sm font-medium text-slate-700 dark:text-slate-300';
            label.textContent = key; // Usa a chave do JSON como label (ex: 'cliente_nome')
            
            let input;
            // Cria um select para o campo 'tipo'
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
        // ===== CORREÇÃO: A chave do ID é sempre 'id' (minúsculo) agora. =====
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

    // ===== CORREÇÃO: Função createTable simplificada (sem sheetId) =====
function createTable(container, data, entityName) {
    container.innerHTML = '';
    if (!data || data.length === 0) {
        container.innerHTML = '<p>Nenhum dado encontrado.</p>';
        return;
    }

    // =====> MUDANÇA 1: Adiciona a classe ao container da tabela <=====
    // Esta classe ativa os estilos responsivos que definimos no style.css.
    container.classList.add('responsive-table-container');

    const table = document.createElement('table');
    table.className = 'w-full text-left border-collapse';
    
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    // Extrai os cabeçalhos do primeiro objeto de dados para garantir a ordem correta.
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
        // Ignora linhas que possam estar vazias na fonte de dados.
        if (Object.values(rowData).every(val => val === null || val === '')) return;
        
        const row = document.createElement('tr');
        
        headers.forEach(header => {
            const td = document.createElement('td');
            
            // =====> MUDANÇA 2: Adiciona o atributo data-label a cada célula <=====
            // O CSS usará este atributo para criar os "rótulos" no layout de card.
            td.setAttribute('data-label', header); 
            
            // Mantém a formatação de data existente.
            if (header === 'data' && rowData[header]) {
                td.textContent = new Date(rowData[header]).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
            } else {
                td.textContent = rowData[header];
            }
            row.appendChild(td);
        });
        
        const tdBotao = document.createElement('td');
        // Adiciona o label para a coluna de ações também, para consistência.
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

    function populateClientesDropdown(clientes) {
        if (!clienteMovimentacaoSelect) return;
        clienteMovimentacaoSelect.innerHTML = '<option value="">Selecione um cliente</option>';
        if (Array.isArray(clientes)) {
            clientes.forEach(cliente => {
                // ===== CORREÇÃO: As chaves são 'id' e 'nome' (minúsculas) =====
                if (cliente.id && cliente.nome) {
                    const option = document.createElement('option');
                    const nomeClienteUpperCase = cliente.nome.toUpperCase();
                    option.value = cliente.nome; // O valor enviado para a API é o nome
                    option.textContent = cliente.nome;
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
    
    // ===== CORREÇÃO: Função updateDashboard usando as novas chaves do PostgreSQL =====
    function updateDashboard(data) {
        let totalEntradas = 0, totalSaidas = 0;
        const categoryTotals = {};
        if (Array.isArray(data)) {
            data.forEach(mov => {
                if (mov && typeof mov === 'object') {
                    // A propriedade é 'valor' (minúsculo) e já é um número.
                    const valor = parseFloat(mov.valor || 0);
                    // A propriedade é 'tipo' (minúsculo).
                    const tipoMovimentacao = (mov.tipo || '').toLowerCase();

                    if (tipoMovimentacao === 'entrada') totalEntradas += valor;
                    else if (tipoMovimentacao === 'saída') totalSaidas += valor;
                    
                    // A propriedade é 'categoria' (minúsculo).
                    if (mov.categoria) {
                        categoryTotals[mov.categoria] = (categoryTotals[mov.categoria] || 0) + valor;
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

    // Lógica do Theme Toggle (sem alterações)
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const themeToggleDarkIcon = document.getElementById('theme-toggle-dark-icon');
    const themeToggleLightIcon = document.getElementById('theme-toggle-light-icon');
    const applyTheme = (isDark) => {
        document.documentElement.classList.toggle('dark', isDark);
        themeToggleLightIcon.classList.toggle('hidden', !isDark);
        themeToggleDarkIcon.classList.toggle('hidden', isDark);
        if (document.getElementById('page-dashboard').classList.contains('active') && allMovimentacoes.length > 0) {
            updateDashboard(allMovimentacoes); // Redesenha o gráfico com as cores corretas
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

    // Associa o submit a todos os formulários de adição
    document.querySelectorAll('form[id^="add-"]').forEach(form => {
        let entityName = form.id.replace('add-', '').replace('-form', '');
        entityName = (entityName === 'movimentacao') ? 'movimentacoes' : `${entityName}s`;
        form.dataset.entity = entityName;
        form.addEventListener('submit', handleAddFormSubmit);
    });

    editForm.addEventListener('submit', handleEditFormSubmit);
    closeModalBtn.addEventListener('click', closeEditModal);
    cancelEditBtn.addEventListener('click', closeEditModal);

    // Lógica da barra de pesquisa (sem alterações)
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

    // Carrega os clientes uma vez no início para popular o dropdown de movimentações
    fetchData('clientes', null).then(() => {
        populateClientesDropdown(allClientes);
    });

    // INICIALIZAÇÃO DA APLICAÇÃO
    const initialPage = window.location.hash.substring(1) || 'dashboard';
    showPage(initialPage);
});
