document.addEventListener('DOMContentLoaded', () => {
    
    const movimentacoesContainer = document.getElementById('movimentacoes-container');
    const form = document.getElementById('add-movimentacao-form');
    
    // Elementos do novo Dashboard
    const totalEntradasEl = document.getElementById('total-entradas');
    const totalSaidasEl = document.getElementById('total-saidas');
    const saldoAtualEl = document.getElementById('saldo-atual');
    const categoryChartCanvas = document.getElementById('categoryChart');
    let categoryChart = null; // Variável para guardar a instância do gráfico

    // Função para formatar números como moeda brasileira
    function formatCurrency(value) {
        return parseFloat(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    // Função assíncrona para buscar os dados da nossa API
    async function fetchMovimentacoes() {
        try {
            const response = await fetch('http://localhost:3000/api/movimentacoes');
            if (!response.ok) throw new Error(`Erro HTTP! Status: ${response.status}`);
            const data = await response.json();
            
            // Transforma os dados em objetos para facilitar a manipulação
            const formattedData = formatData(data);

            updateDashboard(formattedData); // Atualiza os cards e o gráfico
            displayTable(data); // A tabela ainda pode usar o formato original

        } catch (error) {
            console.error('Erro ao buscar dados da API:', error);
            movimentacoesContainer.innerHTML = '<p class="text-red-500">Falha ao carregar os dados. Verifique se o servidor backend está a correr.</p>';
        }
    }

    // Nova função para formatar os dados
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

    // Função para atualizar os cards e o gráfico
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
                if (categoria) {
                    categoryTotals[categoria] = (categoryTotals[categoria] || 0) + valor;
                }
            } else if (tipo === 'Saída') {
                totalSaidas += valor;
                if (categoria) {
                    categoryTotals[categoria] = (categoryTotals[categoria] || 0) + valor;
                }
            }
        });

        const saldoAtual = totalEntradas - totalSaidas;

        totalEntradasEl.textContent = formatCurrency(totalEntradas);
        totalSaidasEl.textContent = formatCurrency(totalSaidas);
        saldoAtualEl.textContent = formatCurrency(saldoAtual);

        // Atualiza o gráfico
        updateChart(categoryTotals);
    }

    // Função para criar ou atualizar o gráfico de categorias
    function updateChart(categoryData) {
        const labels = Object.keys(categoryData);
        const data = Object.values(categoryData);

        if (categoryChart) {
            // Se o gráfico já existe, apenas atualiza os dados
            categoryChart.data.labels = labels;
            categoryChart.data.datasets[0].data = data;
            categoryChart.update();
        } else {
            // Se não existe, cria um novo
            const ctx = categoryChartCanvas.getContext('2d');
            categoryChart = new Chart(ctx, {
                type: 'doughnut', // Tipo de gráfico: rosca
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Valor por Categoria',
                        data: data,
                        backgroundColor: [
                            '#3b82f6', '#ef4444', '#22c55e', '#f97316',
                            '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'
                        ],
                        hoverOffset: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                }
            });
        }
    }

    // Função para exibir os dados na tabela (mantida do Dia 5)
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

    // Lógica para o formulário (igual a antes)
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

    // Executa a função para buscar os dados assim que a página carrega
    fetchMovimentacoes();
});