document.addEventListener('DOMContentLoaded', () => {
    // URL da API do Backend
    const API_BASE_URL = 'https://api-caipirao-maurizzio-procopio.onrender.com';

    // --- LÓGICA DE REGISTO ---
    const registerForm = document.getElementById('register-form' );
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
                    throw new Error(responseText || 'Erro desconhecido no registo.');
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

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(errorText || 'Credenciais inválidas.');
                }

                const result = await response.json();
                
                // O passo mais importante: guardar o token!
                if (result.token) {
                    localStorage.setItem('jwtToken', result.token);
                    alert('Login bem-sucedido!');
                    window.location.href = 'index.html'; // Redireciona para o dashboard
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
