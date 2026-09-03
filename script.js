const API = "https://SEU-SERVIDOR.onrender.com";


async function carregarLista() {
    const lista = document.getElementById("lista");

    try {
        const resposta = await fetch(
            API + "/api/lista"
        );

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

            item.innerHTML =
                '<span class="numero">' +
                numero +
                '</span>' +
                '<span class="nome">' +
                escaparHTML(dados[String(numero)]) +
                '</span>';

            lista.appendChild(item);
        }

    } catch (erro) {
        lista.innerHTML =
            "<p>Não foi possível carregar a lista.</p>";
    }
}


async function escolherNumero() {
    const nomeInput =
        document.getElementById("nome");

    const numeroInput =
        document.getElementById("numero");

    const mensagem =
        document.getElementById("mensagem");

    const nome = nomeInput.value.trim();

    const numero = Number(
        numeroInput.value
    );

    if (!nome) {
        mensagem.textContent =
            "Digite seu nome.";

        return;
    }

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

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    nome: nome,
                    numero: numero
                })
            }
        );

        const dados = await resposta.json();

        if (!resposta.ok) {
            mensagem.textContent =
                dados.erro;

            return;
        }

        mensagem.textContent =
            "Número " +
            numero +
            " escolhido com sucesso!";

        nomeInput.value = "";
        numeroInput.value = "";

        carregarLista();

    } catch (erro) {
        mensagem.textContent =
            "Erro ao conectar ao servidor.";
    }
}


function escaparHTML(texto) {
    const div = document.createElement("div");

    div.textContent = texto;

    return div.innerHTML;
}


carregarLista();


setInterval(
    carregarLista,
    5000
);
