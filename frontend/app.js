document.addEventListener('DOMContentLoaded', () => {
    
    // --- LÓGICA DE NAVEGAÇÃO ---
    const navLinks = document.querySelectorAll('.nav-link');
    const pageContents = document.querySelectorAll('.page-content');
    const pageTitle = document.getElementById('page-title');

    function showPage(pageId) {
        pageContents.forEach(page => {
            page.classList.remove('active');
        });
        navLinks.forEach(link => {
            link.classList.remove('active');
        });

        const targetPage = document.getElementById(`page-${pageId}`);
        const targetLink = document.querySelector(`a[href="#${pageId}"]`);
        
        if (targetPage) {
            targetPage.classList.add('active');
            pageTitle.textContent = targetLink.textContent.trim().replace(/^[^\w]+/, ''); // Remove o emoji
        }
        if (targetLink) {
            targetLink.classList.add('active');
        }

        // Carrega os dados específicos da página quando ela é exibida
        if (pageId === 'movimentacoes' || pageId === 'dashboard') {
            fetchMovimentacoes();
        } 
        // Adicionaremos a lógica para clientes e produtos aqui no futuro
        // else if (pageId === 'clientes') { fetchClientes(); }
        // else if (pageId === 'produtos') { fetchProdutos(); }
    }

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const pageId = link.getAttribute('href').substring(1);
            showPage(pageId);
        });
    });

    // Mostrar a página inicial (Dashboard)
    showPage('dashboard');

    // --- LÓGICA DO DASHBOARD E MOVIMENTAÇÕES (CÓDIGO ANTERIOR) ---
    
    const movimentacoesContainer = document.getElementById('movimentacoes-container');
    const form = document.getElementById('add-movimentacao-form');
    
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
            const response = await fetch('http://localhost:3000/api/movimentacoes');
            if (!response.ok) throw new Error(`Erro HTTP! Status: ${response.status}`);
            const data = await response.json();
            
            const formattedData = formatData(data);
            updateDashboard(formattedData);
            displayTable(data);

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
        let totalEntradas = 0;
        let totalSaidas = 0;
        const categoryTotals = {};
        data.forEach(mov => {
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
        });
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

    function displayTable(data) {
        movimentacoesContainer.innerHTML = '';
        if (!data || data.length <= 1) {
            movimentacoesContainer.innerHTML = '<p>Nenhuma movimentação encontrada.</p>';
            return;
        }
        const table = document.createElement('table');
        table.className = 'w-full text-left';
        const thead = document.createElement('thead');
        thead.className = 'bg-slate-100';
        const headerRow = document.createElement('tr');
        const headers = data[0];
        headers.forEach(headerText => {
            const th = document.createElement('th');
            th.className = 'p-3 font-semibold';
            th.textContent = headerText;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);
        const tbody = document.createElement('tbody');
        const rows = data.slice(1);
        rows.forEach(rowData => {
            const row = document.createElement('tr');
            row.className = 'border-b border-slate-200 hover:bg-slate-50';
            rowData.forEach(cellData => {
                const td = document.createElement('td');
                td.className = 'p-3';
                td.textContent = cellData;
                row.appendChild(td);
            });
            tbody.appendChild(row);
        });
        table.appendChild(tbody);
        movimentacoesContainer.appendChild(table);
    }

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        try {
            const response = await fetch('http://localhost:3000/api/movimentacoes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!response.ok) throw new Error(`Erro ao enviar dados! Status: ${response.status}`);
            alert('Movimentação adicionada com sucesso!');
            form.reset();
            fetchMovimentacoes();
        } catch (error) {
            console.error('Erro ao enviar formulário:', error);
            alert('Falha ao adicionar movimentação.');
        }
    });

    fetchMovimentacoes();
});