const CONTAS_KEY = "contasMah";
const USUARIO_ATUAL_KEY = "usuarioAtualMah";

document.addEventListener("DOMContentLoaded", () => {
    iniciarAutenticacao();
    atualizarTelaPorLogin();
});

function getUsuarioAtual() {
    const usuario = localStorage.getItem(USUARIO_ATUAL_KEY);

    if (!usuario) {
        return null;
    }

    return JSON.parse(usuario);
}

function estaLogado() {
    return getUsuarioAtual() !== null;
}

function buscarContas() {
    return JSON.parse(localStorage.getItem(CONTAS_KEY)) || [];
}

function salvarContas(contas) {
    localStorage.setItem(CONTAS_KEY, JSON.stringify(contas));
}

function iniciarAutenticacao() {
    const modal = document.getElementById("modalLogin");
    const fechar = document.getElementById("fecharLogin");

    const tabLogin = document.getElementById("tabLogin");
    const tabCadastro = document.getElementById("tabCadastro");

    const loginForm = document.getElementById("loginForm");
    const cadastroForm = document.getElementById("cadastroForm");

    const areaVisitante = document.getElementById("areaAuthVisitante");
    const areaLogado = document.getElementById("areaAuthLogado");

    const btnSair = document.getElementById("btnSair");
    const botoesAbrir = document.querySelectorAll("#abrirLogin, [data-open-login]");

    if (!modal) {
        return;
    }

    botoesAbrir.forEach((botao) => {
        botao.addEventListener("click", () => {
            modal.classList.add("aberto");
            atualizarModalAuth();
        });
    });

    if (fechar) {
        fechar.addEventListener("click", () => {
            modal.classList.remove("aberto");
        });
    }

    modal.addEventListener("click", (event) => {
        if (event.target === modal) {
            modal.classList.remove("aberto");
        }
    });

    if (tabLogin) {
        tabLogin.addEventListener("click", () => {
            mostrarAbaAuth("login");
        });
    }

    if (tabCadastro) {
        tabCadastro.addEventListener("click", () => {
            mostrarAbaAuth("cadastro");
        });
    }

    if (loginForm) {
        loginForm.addEventListener("submit", (event) => {
            event.preventDefault();

            const usuarioInput = document.getElementById("usuarioLogin");
            const senhaInput = document.getElementById("senhaLogin");

            if (!usuarioInput || !senhaInput) {
                alert("Erro no formulário de login. Verifique os IDs dos campos.");
                return;
            }

            const usuario = usuarioInput.value.trim();
            const senha = senhaInput.value.trim();

            const contas = buscarContas();

            const contaEncontrada = contas.find((conta) => {
                return conta.usuario === usuario && conta.senha === senha;
            });

            if (!contaEncontrada) {
                alert("Usuário ou senha inválidos.");
                return;
            }

            localStorage.setItem(USUARIO_ATUAL_KEY, JSON.stringify({
                nome: contaEncontrada.nome,
                usuario: contaEncontrada.usuario
            }));

            loginForm.reset();
            modal.classList.remove("aberto");

            atualizarTelaPorLogin();
            document.dispatchEvent(new Event("auth-change"));
        });
    }

    if (cadastroForm) {
        cadastroForm.addEventListener("submit", (event) => {
            event.preventDefault();

            const nomeInput = document.getElementById("nomeCadastro");
            const usuarioInput = document.getElementById("usuarioCadastro");
            const senhaInput = document.getElementById("senhaCadastro");
            const confirmarSenhaInput = document.getElementById("confirmarSenhaCadastro");

            if (!nomeInput || !usuarioInput || !senhaInput || !confirmarSenhaInput) {
                alert("Erro no formulário de cadastro. Verifique os IDs dos campos.");
                return;
            }

            const nome = nomeInput.value.trim();
            const usuario = usuarioInput.value.trim();
            const senha = senhaInput.value.trim();
            const confirmarSenha = confirmarSenhaInput.value.trim();

            if (senha !== confirmarSenha) {
                alert("As senhas não são iguais.");
                return;
            }

            const contas = buscarContas();

            const usuarioJaExiste = contas.some((conta) => {
                return conta.usuario === usuario;
            });

            if (usuarioJaExiste) {
                alert("Esse usuário já existe.");
                return;
            }

            const novaConta = {
                id: Date.now(),
                nome,
                usuario,
                senha
            };

            contas.push(novaConta);
            salvarContas(contas);

            localStorage.setItem(USUARIO_ATUAL_KEY, JSON.stringify({
                nome: novaConta.nome,
                usuario: novaConta.usuario
            }));

            cadastroForm.reset();
            modal.classList.remove("aberto");

            atualizarTelaPorLogin();
            document.dispatchEvent(new Event("auth-change"));
        });
    }

    if (btnSair) {
        btnSair.addEventListener("click", () => {
            localStorage.removeItem(USUARIO_ATUAL_KEY);

            modal.classList.remove("aberto");

            atualizarTelaPorLogin();
            document.dispatchEvent(new Event("auth-change"));
        });
    }

    function atualizarModalAuth() {
        if (estaLogado()) {
            if (areaVisitante) areaVisitante.classList.add("escondido");
            if (areaLogado) areaLogado.classList.remove("escondido");
        } else {
            if (areaVisitante) areaVisitante.classList.remove("escondido");
            if (areaLogado) areaLogado.classList.add("escondido");

            mostrarAbaAuth("login");
        }
    }
}

function mostrarAbaAuth(aba) {
    const tabLogin = document.getElementById("tabLogin");
    const tabCadastro = document.getElementById("tabCadastro");

    const loginForm = document.getElementById("loginForm");
    const cadastroForm = document.getElementById("cadastroForm");

    if (aba === "login") {
        if (tabLogin) tabLogin.classList.add("ativo");
        if (tabCadastro) tabCadastro.classList.remove("ativo");

        if (loginForm) loginForm.classList.remove("escondido");
        if (cadastroForm) cadastroForm.classList.add("escondido");
    }

    if (aba === "cadastro") {
        if (tabCadastro) tabCadastro.classList.add("ativo");
        if (tabLogin) tabLogin.classList.remove("ativo");

        if (cadastroForm) cadastroForm.classList.remove("escondido");
        if (loginForm) loginForm.classList.add("escondido");
    }
}

function atualizarTelaPorLogin() {
    const paginaPublica = document.getElementById("paginaPublica");
    const areaLogada = document.getElementById("areaLogada");

    if (estaLogado()) {
        if (paginaPublica) paginaPublica.classList.add("escondido");
        if (areaLogada) areaLogada.classList.remove("escondido");
    } else {
        if (paginaPublica) paginaPublica.classList.remove("escondido");
        if (areaLogada) areaLogada.classList.add("escondido");
    }
}

window.getUsuarioAtual = getUsuarioAtual;
window.estaLogado = estaLogado;
window.atualizarTelaPorLogin = atualizarTelaPorLogin;