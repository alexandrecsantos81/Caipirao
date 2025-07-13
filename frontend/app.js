// Espera que todo o conteúdo da página seja carregado antes de executar o código
document.addEventListener('DOMContentLoaded', () => {

    const movimentacoesContainer = document.getElementById('movimentacoes-container');

    // Função assíncrona para buscar os dados da nossa API
    async function fetchMovimentacoes() {
        try {
            // Faz a chamada à API que criámos no backend
            const response = await fetch('http://localhost:3000/api/movimentacoes');

            if (!response.ok) {
                throw new Error(`Erro HTTP! Status: ${response.status}`);
            }

            const data = await response.json();

            displayData(data);

        } catch (error) {
            console.error('Erro ao buscar dados da API:', error);
            movimentacoesContainer.innerHTML = '<p class="text-red-500">Falha ao carregar os dados. Verifique se o servidor backend está a correr.</p>';
        }
    }

    // Função para exibir os dados na página
    function displayData(data) {
        // Limpa a mensagem "A carregar dados..."
        movimentacoesContainer.innerHTML = '';

        // Se não houver dados (além do cabeçalho), exibe uma mensagem
        if (!data || data.length <= 1) {
            movimentacoesContainer.innerHTML = '<p>Nenhuma movimentação encontrada.</p>';
            return;
        }

        // Cria uma tabela para exibir os dados
        const table = document.createElement('table');
        table.className = 'w-full text-left';

        // Cria o cabeçalho da tabela com a primeira linha dos dados
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

        // Cria o corpo da tabela com o resto das linhas
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

    // Executa a função para buscar os dados assim que a página carrega
    fetchMovimentacoes();
});