document.addEventListener('DOMContentLoaded', () => {
    // URL da API do Backend
    const API_BASE_URL = 'https://api-caipirao-maurizzio-procopio.onrender.com';

    // --- LÓGICA DE REGISTO ---
    const registerForm = document.getElementById('register-form'  );
    if (registerForm) {
        registerForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            
            const formData = new FormData(registerForm);
            const data = Object.fromEntries(formData.entries());

            try {
                const response = await fetch(`${API_BASE_URL}/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                const responseText = await response.text();
                if (!response.ok) {
                    // Tenta extrair uma mensagem de erro mais clara do JSON
                    try {
                        const errorJson = JSON.parse(responseText);
                        throw new Error(errorJson.error || 'Erro desconhecido no registo.');
                    } catch (e) {
                        throw new Error(responseText || 'Erro desconhecido no registo.');
                    }
                }

                alert('Registo bem-sucedido! Agora pode fazer login.');
                window.location.href = 'login.html'; // Redireciona para a página de login

            } catch (error) {
                console.error('Erro no registo:', error);
                alert(`Falha no registo: ${error.message}`);
            }
        });
    }

    // --- LÓGICA DE LOGIN ---
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const formData = new FormData(loginForm);
            const data = Object.fromEntries(formData.entries());

            try {
                const response = await fetch(`${API_BASE_URL}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                // Primeiro, pegamos o resultado como JSON para poder inspecionar
                const result = await response.json();

                if (!response.ok) {
                    // Se a resposta não for OK, usamos a mensagem de erro do JSON
                    throw new Error(result.error || 'Credenciais inválidas.');
                }
                
                // O passo mais importante: guardar o token!
                if (result.token) {
                    
                    // =======================================================
                    // ==========> INÍCIO DA ALTERAÇÃO TEMPORÁRIA <==========
                    // =======================================================

                    // 1. Mostra a resposta completa da API no console
                    console.log('Resposta completa da API de login:', result);

                    // 2. Mostra o token JWT especificamente para facilitar a cópia
                    console.log('Token JWT recebido:', result.token);

                    // 3. Salva o token no localStorage como antes
                    localStorage.setItem('jwtToken', result.token);
                    
                    // 4. Adiciona um alerta para notificar o utilizador e instruir
                    alert('Login bem-sucedido! O token foi impresso no console (Pressione F12 para ver).');

                    // 5. A LINHA DE REDIRECIONAMENTO FOI REMOVIDA/COMENTADA
                    // window.location.href = 'index.html'; 
                    
                    // =======================================================
                    // ===========> FIM DA ALTERAÇÃO TEMPORÁRIA <=============
                    // =======================================================

                } else {
                    throw new Error('Token não recebido do servidor.');
                }

            } catch (error) {
                console.error('Erro no login:', error);
                alert(`Falha no login: ${error.message}`);
            }
        });
    }
});
