const API = "https://contagem-92rm.onrender.com";

const GOOGLE_CLIENT_ID =
    "748439688946-auplni3i67796q1naegduagd1ikrte31.apps.googleusercontent.com";

const EMAIL_ADMIN = "aquiles.mm.enzo@gmail.com";

let usuarioGoogle = null;


// ============================================================
// GOOGLE LOGIN
// ============================================================

function carregarGoogle() {
    const script = document.createElement("script");

    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;

    script.onload = function() {
        google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: receberLogin
        });

        criarLogin();
    };

    document.head.appendChild(script);
}


function criarLogin() {
    let login = document.getElementById("login-google");

    if (!login) {
        login = document.createElement("div");
        login.id = "login-google";

        const container = document.querySelector(".container");

        container.insertBefore(
            login,
            document.querySelector(".formulario")
        );
    }

    login.innerHTML = "";

    google.accounts.id.renderButton(
        login,
        {
            theme: "filled_black",
            size: "large",
            text: "signin_with",
            shape: "rectangular"
        }
    );
}


async function receberLogin(resposta) {
    try {
        const partes = resposta.credential.split(".");
        const dados = JSON.parse(
            atob(
                partes[1]
                    .replace(/-/g, "+")
                    .replace(/_/g, "/")
            )
        );

        usuarioGoogle = {
            email: dados.email,
            nome: dados.name,
            picture: dados.picture,
            credential: resposta.credential
        };

        atualizarInterface();

        const mensagem = document.getElementById("mensagem");

        if (mensagem) {
            mensagem.textContent =
                "Login realizado como " + dados.name + ".";
        }

    } catch (erro) {
        console.error(erro);

        const mensagem = document.getElementById("mensagem");

        if (mensagem) {
            mensagem.textContent =
                "Não foi possível fazer login com o Google.";
        }
    }
}


// ============================================================
// INTERFACE
// ============================================================

function atualizarInterface() {
    const formulario = document.querySelector(".formulario");

    if (!formulario) {
        return;
    }

    if (!usuarioGoogle) {
        formulario.style.display = "none";
        return;
    }

    formulario.style.display = "flex";

    const nome = document.getElementById("nome");

    if (nome) {
        nome.value = usuarioGoogle.nome;
        nome.disabled = true;
    }

    criarPainelAdmin();
}


function criarPainelAdmin() {
    let painel = document.getElementById("painel-admin");

    if (painel) {
        painel.remove();
    }

    if (!usuarioGoogle) {
        return;
    }

    if (usuarioGoogle.email.toLowerCase() !== EMAIL_ADMIN.toLowerCase()) {
        return;
    }

    painel = document.createElement("div");
    painel.id = "painel-admin";

    painel.innerHTML =
        '<h2>⚙️ Administração</h2>' +
        '<div class="admin-form">' +
        '<input id="admin-mensagem" type="text" maxlength="200" placeholder="Mensagem para aparecer no topo">' +
        '<button onclick="enviarMensagemAdmin()">Enviar mensagem</button>' +
        '</div>' +
        '<div class="admin-form">' +
        '<input id="admin-bloqueio" type="text" maxlength="50" placeholder="Nome para bloquear">' +
        '<button onclick="bloquearNome()">Bloquear nome</button>' +
        '</div>' +
        '<div class="admin-form">' +
        '<input id="admin-excluir" type="number" min="0" max="100" placeholder="Número para excluir">' +
        '<button onclick="excluirNumero()">Excluir número</button>' +
        '</div>';

    document.querySelector(".container").appendChild(painel);
}


// ============================================================
// LISTA
// ============================================================

async function carregarLista() {
    const lista = document.getElementById("lista");

    if (!lista) {
        return;
    }

    try {
        const resposta = await fetch(
            API + "/api/lista"
        );

        if (!resposta.ok) {
            throw new Error("Erro HTTP");
        }

        const dados = await resposta.json();

        lista.innerHTML = "";

        const numeros = Object.keys(dados)
            .map(Number)
            .sort(function(a, b) {
                return a - b;
            });

        if (numeros.length === 0) {
            lista.innerHTML =
                "<p>Ninguém escolheu um número ainda.</p>";

            return;
        }

        for (const numero of numeros) {
            const item = document.createElement("div");

            item.className = "item";

            const numeroElemento =
                document.createElement("span");

            numeroElemento.className = "numero";
            numeroElemento.textContent = numero;

            const nomeElemento =
                document.createElement("span");

            nomeElemento.className = "nome";
            nomeElemento.textContent =
                dados[String(numero)];

            item.appendChild(numeroElemento);
            item.appendChild(nomeElemento);

            lista.appendChild(item);
        }

    } catch (erro) {
        console.error(erro);

        lista.innerHTML =
            "<p>Não foi possível carregar a lista.</p>";
    }
}


// ============================================================
// MENSAGEM DO TOPO
// ============================================================

async function carregarMensagem() {
    let topo = document.getElementById("mensagem-topo");

    if (!topo) {
        topo = document.createElement("div");
        topo.id = "mensagem-topo";

        document.body.prepend(topo);
    }

    try {
        const resposta = await fetch(
            API + "/api/mensagem"
        );

        if (!resposta.ok) {
            topo.style.display = "none";
            return;
        }

        const dados = await resposta.json();

        if (dados.mensagem) {
            topo.textContent = dados.mensagem;
            topo.style.display = "block";
        } else {
            topo.style.display = "none";
        }

    } catch (erro) {
        topo.style.display = "none";
    }
}


// ============================================================
// ESCOLHER NÚMERO
// ============================================================

async function escolherNumero() {
    const numeroInput =
        document.getElementById("numero");

    const mensagem =
        document.getElementById("mensagem");

    if (!usuarioGoogle) {
        mensagem.textContent =
            "Faça login com o Google primeiro.";

        return;
    }

    const numero = Number(numeroInput.value);

    if (
        !Number.isInteger(numero) ||
        numero < 0 ||
        numero > 100
    ) {
        mensagem.textContent =
            "Escolha um número entre 0 e 100.";

        return;
    }

    mensagem.textContent = "Escolhendo...";

    try {
        const resposta = await fetch(
            API + "/api/escolher",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    numero: numero,
                    credential: usuarioGoogle.credential
                })
            }
        );

        const dados = await resposta.json();

        if (!resposta.ok) {
            mensagem.textContent =
                dados.erro || "Não foi possível escolher.";

            return;
        }

        mensagem.textContent =
            "Número " +
            numero +
            " escolhido com sucesso!";

        numeroInput.value = "";

        carregarLista();

    } catch (erro) {
        console.error(erro);

        mensagem.textContent =
            "Erro ao conectar ao servidor.";
    }
}


// ============================================================
// ADMIN — MENSAGEM
// ============================================================

async function enviarMensagemAdmin() {
    const input =
        document.getElementById("admin-mensagem");

    const mensagem = input.value.trim();

    if (!mensagem) {
        return;
    }

    try {
        const resposta = await fetch(
            API + "/api/admin/mensagem",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    mensagem: mensagem,
                    credential: usuarioGoogle.credential
                })
            }
        );

        const dados = await resposta.json();

        if (!resposta.ok) {
            alert(dados.erro || "Erro.");
            return;
        }

        input.value = "";

        carregarMensagem();

    } catch (erro) {
        alert("Erro ao conectar ao servidor.");
    }
}


// ============================================================
// ADMIN — BLOQUEAR NOME
// ============================================================

async function bloquearNome() {
    const input =
        document.getElementById("admin-bloqueio");

    const nome = input.value.trim();

    if (!nome) {
        return;
    }

    try {
        const resposta = await fetch(
            API + "/api/admin/bloquear",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    nome: nome,
                    credential: usuarioGoogle.credential
                })
            }
        );

        const dados = await resposta.json();

        if (!resposta.ok) {
            alert(dados.erro || "Erro.");
            return;
        }

        input.value = "";

        alert("Nome bloqueado!");

    } catch (erro) {
        alert("Erro ao conectar ao servidor.");
    }
}


// ============================================================
// ADMIN — EXCLUIR
// ============================================================

async function excluirNumero() {
    const input =
        document.getElementById("admin-excluir");

    const numero = Number(input.value);

    if (
        !Number.isInteger(numero) ||
        numero < 0 ||
        numero > 100
    ) {
        return;
    }

    try {
        const resposta = await fetch(
            API + "/api/admin/excluir",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    numero: numero,
                    credential: usuarioGoogle.credential
                })
            }
        );

        const dados = await resposta.json();

        if (!resposta.ok) {
            alert(dados.erro || "Erro.");
            return;
        }

        input.value = "";

        carregarLista();

        alert("Número excluído!");

    } catch (erro) {
        alert("Erro ao conectar ao servidor.");
    }
}


// ============================================================
// INICIALIZAÇÃO
// ============================================================

carregarGoogle();
carregarLista();
carregarMensagem();

setInterval(
    carregarLista,
    5000
);

setInterval(
    carregarMensagem,
    5000
);
