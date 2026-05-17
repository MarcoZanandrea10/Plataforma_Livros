const LIVROS_BASE_KEY = "livrosMah";

const statusLabels = {
    "lendo": "Lendo agora",
    "para-ler": "Para ler depois",
    "lido": "Lido",
    "pausado": "Pausado",
    "compra": "Lista de compra",
    "desejo": "Desejo",
    "melhor": "Melhores/Favoritos"
};

let filtroAtual = "todos";
let termoBusca = "";

document.addEventListener("DOMContentLoaded", () => {
    iniciarFormulario();
    iniciarFiltros();

    if (estaLogado()) {
        renderizarLivros();
    }
});

document.addEventListener("auth-change", () => {
    if (estaLogado()) {
        renderizarLivros();
    } else {
        limparLista();
    }
});

function getLivrosKey() {
    const usuario = getUsuarioAtual();

    if (!usuario) {
        return null;
    }

    return `${LIVROS_BASE_KEY}_${usuario.usuario}`;
}

function buscarLivros() {
    const key = getLivrosKey();

    if (!key) return [];

    return JSON.parse(localStorage.getItem(key)) || [];
}

function salvarLivros(livros) {
    const key = getLivrosKey();

    if (!key) return;

    localStorage.setItem(key, JSON.stringify(livros));
}

function limparLista() {
    const lista = document.getElementById("listaLivros");

    if (lista) {
        lista.innerHTML = "";
    }
}

function dataAtual() {
    return new Date().toISOString().split("T")[0];
}

function iniciarFormulario() {
    const form = document.getElementById("livroForm");

    if (!form) return;

    form.addEventListener("submit", (event) => {
        event.preventDefault();

        if (!estaLogado()) {
            alert("Você precisa estar logado para adicionar livros.");
            return;
        }

        const paginas = Number(document.getElementById("paginas").value);
        let paginaAtual = Number(document.getElementById("paginaAtual").value || 0);
        const status = document.getElementById("status").value;

        if (paginaAtual > paginas) {
            paginaAtual = paginas;
        }

        const livro = {
            id: Date.now(),
            titulo: document.getElementById("titulo").value.trim(),
            autor: document.getElementById("autor").value.trim(),
            paginas,
            paginaAtual,
            status,
            dataInicio: document.getElementById("dataInicio").value,
            dataFim: document.getElementById("dataFim").value,
            nota: document.getElementById("nota").value,
            observacoes: document.getElementById("observacoes").value.trim(),
            criadoEm: dataAtual()
        };

        if (livro.status === "lendo" && !livro.dataInicio) {
            livro.dataInicio = dataAtual();
        }

        if (livro.status === "lido") {
            livro.paginaAtual = livro.paginas;

            if (!livro.dataFim) {
                livro.dataFim = dataAtual();
            }
        }

        const livros = buscarLivros();
        livros.push(livro);
        salvarLivros(livros);

        form.reset();
        document.getElementById("paginaAtual").value = 0;

        renderizarLivros();
    });
}

function iniciarFiltros() {
    const botoesFiltro = document.querySelectorAll(".filtro");
    const busca = document.getElementById("buscaLivro");

    botoesFiltro.forEach((botao) => {
        botao.addEventListener("click", () => {
            botoesFiltro.forEach((b) => b.classList.remove("ativo"));
            botao.classList.add("ativo");

            filtroAtual = botao.dataset.filter;
            renderizarLivros();
        });
    });

    if (busca) {
        busca.addEventListener("input", () => {
            termoBusca = busca.value.toLowerCase().trim();
            renderizarLivros();
        });
    }
}

function renderizarLivros() {
    const lista = document.getElementById("listaLivros");

    if (!lista || !estaLogado()) return;

    const pagina = document.body.dataset.page;
    let livros = buscarLivros();

    if (pagina === "ativos") {
        livros = livros.filter((livro) => livro.status === "lendo");
    }

    if (pagina !== "ativos" && filtroAtual !== "todos") {
        livros = livros.filter((livro) => livro.status === filtroAtual);
    }

    if (termoBusca) {
        livros = livros.filter((livro) => {
            return livro.titulo.toLowerCase().includes(termoBusca) ||
                livro.autor.toLowerCase().includes(termoBusca);
        });
    }

    livros.sort((a, b) => b.id - a.id);

    if (livros.length === 0) {
        lista.innerHTML = `
            <div class="empty">
                Nenhum livro encontrado.
            </div>
        `;
        return;
    }

    lista.innerHTML = livros.map((livro) => criarCardLivro(livro)).join("");

    adicionarEventosDosCards();
}

function criarCardLivro(livro) {
    const progresso = calcularProgresso(livro);
    const inicio = livro.dataInicio ? formatarData(livro.dataInicio) : "Não iniciado";
    const fim = livro.dataFim ? formatarData(livro.dataFim) : "Não finalizado";
    const nota = livro.nota ? `${livro.nota}/10` : "Sem nota";

    return `
        <article class="livro-card">
            <h4>${escaparHTML(livro.titulo)}</h4>
            <p><strong>Autor:</strong> ${escaparHTML(livro.autor)}</p>

            <span class="badge">${statusLabels[livro.status]}</span>

            <p><strong>Páginas:</strong> ${livro.paginaAtual || 0} de ${livro.paginas}</p>

            <div class="progresso-area">
                <div class="barra">
                    <span style="width: ${progresso}%"></span>
                </div>
                <p>${progresso}% concluído</p>
            </div>

            <p><strong>Início:</strong> ${inicio}</p>
            <p><strong>Finalização:</strong> ${fim}</p>
            <p><strong>Nota:</strong> ${nota}</p>

            ${livro.observacoes ? `<p><strong>Obs:</strong> ${escaparHTML(livro.observacoes)}</p>` : ""}

            <div class="livro-controles">
                <input 
                    type="number" 
                    min="0" 
                    max="${livro.paginas}" 
                    value="${livro.paginaAtual || 0}" 
                    data-id="${livro.id}" 
                    data-action="progresso"
                    title="Página atual"
                >

                <select data-id="${livro.id}" data-action="status">
                    ${Object.keys(statusLabels).map((status) => `
                        <option value="${status}" ${livro.status === status ? "selected" : ""}>
                            ${statusLabels[status]}
                        </option>
                    `).join("")}
                </select>

                <input 
                    type="number" 
                    min="0" 
                    max="10" 
                    step="0.5" 
                    value="${livro.nota || ""}" 
                    placeholder="Nota"
                    data-id="${livro.id}" 
                    data-action="nota"
                >
            </div>

            <div class="acoes">
                ${livro.status !== "lendo" && livro.status !== "lido" ? `
                    <button class="btn btn-small" data-id="${livro.id}" data-action="iniciar">
                        Iniciar
                    </button>
                ` : ""}

                ${livro.status === "lendo" ? `
                    <button class="btn btn-small btn-secondary" data-id="${livro.id}" data-action="pausar">
                        Pausar
                    </button>
                ` : ""}

                ${livro.status === "pausado" ? `
                    <button class="btn btn-small" data-id="${livro.id}" data-action="retomar">
                        Retomar
                    </button>
                ` : ""}

                ${livro.status !== "lido" ? `
                    <button class="btn btn-small" data-id="${livro.id}" data-action="finalizar">
                        Finalizar
                    </button>
                ` : ""}

                <button class="btn btn-small btn-danger" data-id="${livro.id}" data-action="excluir">
                    Excluir
                </button>
            </div>
        </article>
    `;
}

function adicionarEventosDosCards() {
    document.querySelectorAll("[data-action]").forEach((elemento) => {
        const acao = elemento.dataset.action;
        const id = Number(elemento.dataset.id);

        if (elemento.tagName === "BUTTON") {
            elemento.addEventListener("click", () => executarAcaoLivro(id, acao));
        }

        if (elemento.tagName === "SELECT") {
            elemento.addEventListener("change", () => alterarStatus(id, elemento.value));
        }

        if (elemento.tagName === "INPUT" && acao === "progresso") {
            elemento.addEventListener("change", () => alterarProgresso(id, elemento.value));
        }

        if (elemento.tagName === "INPUT" && acao === "nota") {
            elemento.addEventListener("change", () => alterarNota(id, elemento.value));
        }
    });
}

function executarAcaoLivro(id, acao) {
    if (acao === "excluir") {
        excluirLivro(id);
        return;
    }

    const livros = buscarLivros();

    const livrosAtualizados = livros.map((livro) => {
        if (livro.id !== id) return livro;

        if (acao === "iniciar") {
            livro.status = "lendo";

            if (!livro.dataInicio) {
                livro.dataInicio = dataAtual();
            }
        }

        if (acao === "pausar") {
            livro.status = "pausado";
        }

        if (acao === "retomar") {
            livro.status = "lendo";
        }

        if (acao === "finalizar") {
            livro.status = "lido";
            livro.paginaAtual = livro.paginas;
            livro.dataFim = dataAtual();
        }

        return livro;
    });

    salvarLivros(livrosAtualizados);
    renderizarLivros();
}

function alterarStatus(id, novoStatus) {
    const livros = buscarLivros();

    const livrosAtualizados = livros.map((livro) => {
        if (livro.id !== id) return livro;

        livro.status = novoStatus;

        if (novoStatus === "lendo" && !livro.dataInicio) {
            livro.dataInicio = dataAtual();
        }

        if (novoStatus === "lido") {
            livro.paginaAtual = livro.paginas;

            if (!livro.dataFim) {
                livro.dataFim = dataAtual();
            }
        }

        return livro;
    });

    salvarLivros(livrosAtualizados);
    renderizarLivros();
}

function alterarProgresso(id, valor) {
    const livros = buscarLivros();

    const livrosAtualizados = livros.map((livro) => {
        if (livro.id !== id) return livro;

        let paginaAtual = Number(valor);

        if (paginaAtual < 0) paginaAtual = 0;
        if (paginaAtual > livro.paginas) paginaAtual = livro.paginas;

        livro.paginaAtual = paginaAtual;

        if (paginaAtual === livro.paginas) {
            livro.status = "lido";
            livro.dataFim = dataAtual();
        }

        return livro;
    });

    salvarLivros(livrosAtualizados);
    renderizarLivros();
}

function alterarNota(id, valor) {
    const livros = buscarLivros();

    const livrosAtualizados = livros.map((livro) => {
        if (livro.id !== id) return livro;

        livro.nota = valor;
        return livro;
    });

    salvarLivros(livrosAtualizados);
    renderizarLivros();
}

function excluirLivro(id) {
    const confirmar = confirm("Tem certeza que deseja excluir este livro?");

    if (!confirmar) return;

    const livros = buscarLivros().filter((livro) => livro.id !== id);
    salvarLivros(livros);
    renderizarLivros();
}

function calcularProgresso(livro) {
    if (!livro.paginas || livro.paginas <= 0) return 0;

    const progresso = Math.round((Number(livro.paginaAtual || 0) / Number(livro.paginas)) * 100);

    if (progresso > 100) return 100;
    if (progresso < 0) return 0;

    return progresso;
}

function formatarData(data) {
    const partes = data.split("-");
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function escaparHTML(texto) {
    return String(texto)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}