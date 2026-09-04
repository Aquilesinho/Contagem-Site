const API = "https://contagem-92rm.onrender.com";

const GOOGLE_CLIENT_ID =
    "748439688946-auplni3i67796q1naegduagd1ikrte31.apps.googleusercontent.com";

const ADMIN_EMAIL = "aquiles.mm.enzo@gmail.com";

let googleToken = null;
let usuario = null;


// ============================================================
// GOOGLE
// ============================================================

function iniciarGoogle() {
    if (!window.google || !google.accounts) {
        setTimeout(iniciarGoogle, 200);
        return;
    }

    google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: loginGoogle
    });

    const login = document.getElementById("login-google");

    google.accounts.id.renderButton(
        login,
        {
            theme: "outline",
            size: "large",
            text: "signin_with",
            shape: "rectangular",
            width: 300
        }
    );
}


async function loginGoogle(resposta) {
    googleToken = resposta.credential;

    try {
        const respostaServidor = await fetch(
            API + "/api/eu",
            {
                headers: {
                    "Authorization": "Bearer " + googleToken
                }
            }
        );

        const dados = await respostaServidor.json();

        if (!respostaServidor.ok) {
            throw new Error(
                dados.erro || "Falha no login."
            );
        }

        usuario = dados;

        atualizarInterface();

    } catch (erro) {
        console.error(erro);

        googleToken = null;
        usuario = null;

        document.getElementById("mensagem").textContent =
            "Não foi possível entrar com o Google.";
    }
}


// ============================================================
// REQUISIÇÃO AUTENTICADA
// ============================================================

function headersAutenticados() {
    return {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + googleToken
    };
}


// ============================================================
// INTERFACE
// ============================================================

function atualizarInterface() {
    const formulario =
        document.querySelector(".formulario");

    const login =
        document.getElementById("login-google");

    const usuarioInfo =
        document.getElementById("usuario-info");

    if (!usuario) {
        formulario.style.display = "none";
        return;
    }

    formulario.style.display = "flex";

    usuarioInfo.textContent =
        "Entrou como " + usuario.nome;

    const nomeInput =
        document.getElementById("nome");

    nomeInput.value = usuario.nome;
    nomeInput.disabled = true;

    if (usuario.numero !== null) {
        document.getElementById("numero").disabled = true;

        document.querySelector(
            ".formulario button"
        ).disabled = true;

        document.getElementById("mensagem").textContent =
            "Você já escolheu o número " +
            usuario.numero +
            ".";
    }

    if (usuario.admin) {
        criarPainelAdmin();
    }
}


// ============================================================
// LISTA
// ============================================================

async function carregarLista() {
    const lista =
        document.getElementById("lista");

    try {
        const resposta = await fetch(
            API + "/api/lista"
        );

        if (!resposta.ok) {
            throw new Error("Erro HTTP");
        }

        const dados = await resposta.json();

        lista.innerHTML = "";

        const numeros =
            dados.numeros || {};

        const chaves =
            Object.keys(numeros)
                .map(Number)
                .sort(function(a, b) {
                    return a - b;
                });

        if (chaves.length === 0) {
            lista.innerHTML =
                "<p>Ninguém escolheu um número ainda.</p>";

            return;
        }

        for (const numero of chaves) {
            const item =
                document.createElement("div");

            item.className = "item";

            const numeroElemento =
                document.createElement("span");

            numeroElemento.className =
                "numero";

            numeroElemento.textContent =
                numero;

            const nomeElemento =
                document.createElement("span");

            nomeElemento.className =
                "nome";

            nomeElemento.textContent =
                numeros[String(numero)];

            item.appendChild(numeroElemento);
            item.appendChild(nomeElemento);

            lista.appendChild(item);
        }

        mostrarMensagemTopo(
            dados.mensagem || ""
        );

    } catch (erro) {
        console.error(erro);

        lista.innerHTML =
            "<p>Não foi possível carregar a lista.</p>";
    }
}


// ============================================================
// MENSAGEM NO TOPO
// ============================================================

function mostrarMensagemTopo(mensagem) {
    let elemento =
        document.getElementById(
            "mensagem-topo"
        );

    if (!elemento) {
        elemento =
            document.createElement("div");

        elemento.id =
            "mensagem-topo";

        document.body.prepend(elemento);
    }

    if (!mensagem) {
        elemento.style.display =
            "none";

        return;
    }

    elemento.textContent =
        mensagem;

    elemento.style.display =
        "block";
}


// ============================================================
// ESCOLHER
// ============================================================

async function escolherNumero() {
    const numeroInput =
        document.getElementById("numero");

    const mensagem =
        document.getElementById("mensagem");

    if (!googleToken || !usuario) {
        mensagem.textContent =
            "Entre com o Google primeiro.";

        return;
    }

    if (usuario.numero !== null) {
        mensagem.textContent =
            "Você já escolheu um número.";

        return;
    }

    const numero =
        Number(numeroInput.value);

    if (
        !Number.isInteger(numero) ||
        numero < 0 ||
        numero > 100
    ) {
        mensagem.textContent =
            "Escolha um número entre 0 e 100.";

        return;
    }

    mensagem.textContent =
        "Escolhendo...";

    try {
        const resposta = await fetch(
            API + "/api/escolher",
            {
                method: "POST",

                headers:
                    headersAutenticados(),

                body: JSON.stringify({
                    numero: numero
                })
            }
        );

        const dados =
            await resposta.json();

        if (!resposta.ok) {
            mensagem.textContent =
                dados.erro ||
                "Não foi possível escolher.";

            return;
        }

        usuario.numero =
            dados.numero;

        mensagem.textContent =
            "Número " +
            dados.numero +
            " escolhido com sucesso!";

        numeroInput.disabled = true;

        document.querySelector(
            ".formulario button"
        ).disabled = true;

        carregarLista();

    } catch (erro) {
        console.error(erro);

        mensagem.textContent =
            "Erro ao conectar ao servidor.";
    }
}


// ============================================================
// PAINEL ADMIN
// ============================================================

function criarPainelAdmin() {
    if (
        document.getElementById(
            "painel-admin"
        )
    ) {
        return;
    }

    const painel =
        document.createElement("div");

    painel.id =
        "painel-admin";

    painel.innerHTML =
        "<h2>⚙️ Administração</h2>" +

        "<div class='admin-form'>" +
        "<input id='admin-mensagem' " +
        "type='text' maxlength='200' " +
        "placeholder='Mensagem para aparecer no topo'>" +
        "<button onclick='enviarMensagemAdmin()'>" +
        "Enviar mensagem" +
        "</button>" +
        "</div>" +

        "<div class='admin-form'>" +
        "<input id='admin-bloqueio' " +
        "type='text' maxlength='50' " +
        "placeholder='Nome para bloquear'>" +
        "<button onclick='bloquearNome()'>" +
        "Bloquear nome" +
        "</button>" +
        "</div>" +

        "<div class='admin-form'>" +
        "<input id='admin-desbloqueio' " +
        "type='text' maxlength='50' " +
        "placeholder='Nome para desbloquear'>" +
        "<button onclick='desbloquearNome()'>" +
        "Desbloquear nome" +
        "</button>" +
        "</div>" +

        "<div class='admin-form'>" +
        "<input id='admin-excluir' " +
        "type='number' min='0' max='100' " +
        "placeholder='Número para excluir'>" +
        "<button onclick='excluirNumero()'>" +
        "Excluir número" +
        "</button>" +
        "</div>";

    document
        .querySelector(".container")
        .appendChild(painel);
}


// ============================================================
// ADMIN — MENSAGEM
// ============================================================

async function enviarMensagemAdmin() {
    const input =
        document.getElementById(
            "admin-mensagem"
        );

    const mensagem =
        input.value.trim();

    if (!mensagem) {
        return;
    }

    try {
        const resposta = await fetch(
            API + "/api/admin/mensagem",
            {
                method: "POST",

                headers:
                    headersAutenticados(),

                body: JSON.stringify({
                    mensagem: mensagem
                })
            }
        );

        const dados =
            await resposta.json();

        if (!resposta.ok) {
            alert(
                dados.erro ||
                "Erro ao enviar mensagem."
            );

            return;
        }

        input.value = "";

        carregarLista();

    } catch (erro) {
        console.error(erro);

        alert(
            "Erro ao conectar ao servidor."
        );
    }
}


// ============================================================
// ADMIN — BLOQUEAR
// ============================================================

async function bloquearNome() {
    const input =
        document.getElementById(
            "admin-bloqueio"
        );

    const nome =
        input.value.trim();

    if (!nome) {
        return;
    }

    try {
        const resposta = await fetch(
            API + "/api/admin/bloquear",
            {
                method: "POST",

                headers:
                    headersAutenticados(),

                body: JSON.stringify({
                    nome: nome
                })
            }
        );

        const dados =
            await resposta.json();

        if (!resposta.ok) {
            alert(
                dados.erro ||
                "Erro ao bloquear."
            );

            return;
        }

        input.value = "";

        alert(
            "Nome bloqueado com sucesso!"
        );

    } catch (erro) {
        console.error(erro);

        alert(
            "Erro ao conectar ao servidor."
        );
    }
}


// ============================================================
// ADMIN — DESBLOQUEAR
// ============================================================

async function desbloquearNome() {
    const input =
        document.getElementById(
            "admin-desbloqueio"
        );

    const nome =
        input.value.trim();

    if (!nome) {
        return;
    }

    try {
        const resposta = await fetch(
            API + "/api/admin/desbloquear",
            {
                method: "POST",

                headers:
                    headersAutenticados(),

                body: JSON.stringify({
                    nome: nome
                })
            }
        );

        const dados =
            await resposta.json();

        if (!resposta.ok) {
            alert(
                dados.erro ||
                "Erro ao desbloquear."
            );

            return;
        }

        input.value = "";

        alert(
            "Nome desbloqueado!"
        );

    } catch (erro) {
        console.error(erro);

        alert(
            "Erro ao conectar ao servidor."
        );
    }
}


// ============================================================
// ADMIN — EXCLUIR
// ============================================================

async function excluirNumero() {
    const input =
        document.getElementById(
            "admin-excluir"
        );

    const numero =
        Number(input.value);

    if (
        !Number.isInteger(numero) ||
        numero < 0 ||
        numero > 100
    ) {
        alert(
            "Número inválido."
        );

        return;
    }

    try {
        const resposta = await fetch(
            API + "/api/admin/excluir",
            {
                method: "POST",

                headers:
                    headersAutenticados(),

                body: JSON.stringify({
                    numero: numero
                })
            }
        );

        const dados =
            await resposta.json();

        if (!resposta.ok) {
            alert(
                dados.erro ||
                "Erro ao excluir."
            );

            return;
        }

        input.value = "";

        alert(
            "Número excluído!"
        );

        carregarLista();

    } catch (erro) {
        console.error(erro);

        alert(
            "Erro ao conectar ao servidor."
        );
    }
}


// ============================================================
// INICIALIZAÇÃO
// ============================================================

function iniciarInterface() {
    const container =
        document.querySelector(
            ".container"
        );

    const login =
        document.createElement("div");

    login.id =
        "login-google";

    container.insertBefore(
        login,
        document.querySelector(
            ".formulario"
        )
    );

    const info =
        document.createElement("p");

    info.id =
        "usuario-info";

    info.textContent =
        "Entre com sua conta Google.";

    container.insertBefore(
        info,
        document.querySelector(
            ".formulario"
        )
    );

    document.querySelector(
        ".formulario"
    ).style.display = "none";

    carregarLista();

    setInterval(
        carregarLista,
        5000
    );

    iniciarGoogle();
}


iniciarInterface();
