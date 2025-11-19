document.addEventListener('DOMContentLoaded', () => {

    const wrapper = document.querySelector('.wrapper');
    const logarLink = document.querySelector('.logar-link');
    const cadastrarLink = document.querySelector('.cadastrar-link');
    const loginPopup = document.querySelector('.login');
    const iconClose = document.querySelector('.icon-close');
    const sucessoCadastro = document.getElementById('sucesso-cadastro');
    const loginForm = document.getElementById('login-form');
    const cadastroForm = document.getElementById('cadastro-form');

    // Eventos de abrir/fechar popup de login e trocar entre login/cadastro
    if (loginPopup && wrapper) {
        loginPopup.addEventListener('click', () => {
            wrapper.classList.add('active-popup');
        });
    }

    if (iconClose && wrapper) {
        iconClose.addEventListener('click', () => {
            wrapper.classList.remove('active-popup');
        });
    }

    if (cadastrarLink && wrapper) {
        cadastrarLink.addEventListener('click', () => {
            wrapper.classList.add('active');
        });
    }

    if (logarLink && wrapper) {
        logarLink.addEventListener('click', () => {
            wrapper.classList.remove('active');
        });
    }

    // Lógica do Login
    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const emailInput = document.getElementById('login-email');
            const senhaInput = document.getElementById('login-senha');

            if (!emailInput || !senhaInput) return; // Segurança extra

            try {
                const response = await fetch('/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        email: emailInput.value, 
                        senha: senhaInput.value 
                    }),
                });

                const data = await response.json();

                if (response.ok) {
                    sessionStorage.setItem('usuarioLogado', JSON.stringify(data.user));
                    if (wrapper) wrapper.classList.remove('active-popup'); 
                    window.location.href = 'mapa.html'; 
                } else {
                    alert(data.message || 'Erro no login'); 
                }
            } catch (error) {
                console.error('Erro no login:', error);
                alert('Erro ao conectar com o servidor.');
            }
        });
    }

    // Lógica do Cadastro
    if (cadastroForm) {
        cadastroForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const nomeInput = document.getElementById('cadastro-nome');
            const emailInput = document.getElementById('cadastro-email');
            const senhaInput = document.getElementById('cadastro-senha');

            if (!nomeInput || !emailInput || !senhaInput) return;

            try {
                const response = await fetch('/cadastro', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        nome: nomeInput.value, 
                        email: emailInput.value, 
                        senha: senhaInput.value 
                    }),
                });

                const data = await response.json();

                if (response.ok) {
                    if (wrapper) wrapper.classList.remove('active'); 

                    if (sucessoCadastro) {
                        sucessoCadastro.classList.add('mostrar-sucesso');
                        setTimeout(() => {
                            sucessoCadastro.classList.remove('mostrar-sucesso');
                        }, 5000); 
                    }
                } else {
                    alert(data.message || 'Erro no cadastro');
                }
            } catch (error) {
                console.error('Erro no cadastro:', error);
                alert('Erro ao conectar com o servidor.');
            }
        });
    }
});