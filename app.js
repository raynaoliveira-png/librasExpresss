const URL = "https://teachablemachine.withgoogle.com/models/m8K8sX1_j/";

let model, webcam, maxPredictions;
let ultimoSinal = "";
const textoElemento = document.getElementById('texto-traduzido');

function falarTexto(texto) {
    if (texto && texto !== "Aguardando...") {
        window.speechSynthesis.cancel();
        const fala = new SpeechSynthesisUtterance(texto);
        fala.lang = 'pt-BR';
        window.speechSynthesis.speak(fala);
    }
}

async function iniciar() {
    if (textoElemento) textoElemento.innerText = "Carregando modelo de IA...";

    try {
        const modelURL = URL + "model.json";
        const metadataURL = URL + "metadata.json";

        // 1. Carrega o modelo de IA
        model = await tmImage.load(modelURL, metadataURL);
        maxPredictions = model.getTotalClasses();

        // 2. Configura a câmera pelo Teachable Machine (300x300 e espelhada)
        const flip = true; 
        webcam = new tmImage.Webcam(300, 300, flip); 
        await webcam.setup(); 
        await webcam.play();
        
        window.requestAnimationFrame(loop);

        // 3. Insere a câmera na tela
        const container = document.getElementById('webcam-container');
        container.innerHTML = "";
        container.appendChild(webcam.canvas);

        if (textoElemento) textoElemento.innerText = "Aguardando sinal...";

    } catch (erro) {
        console.error("Erro na leitura da câmera ou IA:", erro);
        alert("Não foi possível carregar a câmera ou o modelo. Verifique se a câmera não está aberta em outra aba.");
        if (textoElemento) textoElemento.innerText = "Erro ao iniciar";
    }
}

async function loop() {
    webcam.update();
    await predict();
    window.requestAnimationFrame(loop);
}

async function predict() {
    // Analisa a imagem atual da câmera
    const prediction = await model.predict(webcam.canvas);
    let maiorProbabilidade = 0;
    let sinalDetectado = "";

    // Procura o sinal com maior nota
    for (let i = 0; i < maxPredictions; i++) {
        if (prediction[i].probability > maiorProbabilidade) {
            maiorProbabilidade = prediction[i].probability;
            sinalDetectado = prediction[i].className;
        }
    }

    // Sensibilidade ajustada para 60% (0.60) para facilitar o reconhecimento
    if (maiorProbabilidade > 0.60 && sinalDetectado !== ultimoSinal) {
        ultimoSinal = sinalDetectado;
        if (textoElemento) textoElemento.innerText = sinalDetectado;
        falarTexto(sinalDetectado);
    }
}
// Substitua a primeira linha por esta:
const MODEL_URL = "./";

let model = null;
let maxPredictions = 0;
let ultimoSinal = "";
let streamAtual = null;
let loopAtivo = false;

const textoElemento = document.getElementById("texto-traduzido");
const container = document.getElementById("webcam-container");
const botao = document.getElementById("start-btn");

function atualizarStatus(texto) {
    if (textoElemento) textoElemento.innerText = texto;
}

function falarTexto(texto) {
    if (texto && texto !== "Aguardando...") {
        window.speechSynthesis.cancel();
        const fala = new SpeechSynthesisUtterance(texto);
        fala.lang = "pt-BR";
        window.speechSynthesis.speak(fala);
    }
}

function erroDaCamera(erro) {
    switch (erro?.name) {
        case "NotAllowedError":
        case "PermissionDeniedError":
            return "Permissão da câmera negada. Clique no cadeado ao lado do endereço, permita a câmera e recarregue a página.";
        case "NotFoundError":
        case "DevicesNotFoundError":
            return "Nenhuma câmera foi encontrada neste dispositivo.";
        case "NotReadableError":
        case "TrackStartError":
            return "A câmera está sendo usada por outro aplicativo. Feche outros programas que usam a câmera e tente novamente.";
        case "SecurityError":
            return "O navegador bloqueou a câmera. Use o site com HTTPS ou localhost.";
        default:
            return `Não foi possível abrir a câmera (${erro?.name || "erro desconhecido"}). Verifique a permissão do navegador.`;
    }
}

async function carregarModelo() {
    try {
        model = await tmImage.load(
            `${MODEL_URL}model.json`,
            `${MODEL_URL}metadata.json`
        );
        maxPredictions = model.getTotalClasses();
    } catch (erro) {
        console.error("Erro ao carregar o modelo:", erro);
        throw new Error("O modelo de tradução não foi encontrado ou está indisponível. Verifique o link MODEL_URL no app.js.");
    }
}

async function iniciar() {
    if (loopAtivo) return;

    if (!window.isSecureContext) {
        atualizarStatus("Página não segura");
        alert("A câmera só funciona em HTTPS ou em localhost. Abra o endereço com https://.");
        return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
        atualizarStatus("Câmera indisponível");
        alert("Este navegador não oferece suporte ao acesso à câmera.");
        return;
    }

    botao.disabled = true;
    atualizarStatus("Solicitando acesso à câmera...");

    try {
        // Primeiro abrimos a câmera. Assim, um erro do modelo não é confundido
        // com um erro de permissão da câmera.
        streamAtual = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: { ideal: "user" },
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: false
        });

        const videoElement = document.createElement("video");
        videoElement.id = "camera-video";
        videoElement.autoplay = true;
        videoElement.muted = true;
        videoElement.playsInline = true;
        videoElement.setAttribute("aria-label", "Imagem da câmera");
        videoElement.srcObject = streamAtual;
        container.replaceChildren(videoElement);
        await videoElement.play();

        atualizarStatus("Câmera ligada. Carregando IA...");
        await carregarModelo();

        loopAtivo = true;
        atualizarStatus("Aguardando sinal...");
        botao.innerText = "✅ Câmera ligada";
        detectarSinal(videoElement);
    } catch (erro) {
        console.error("Erro ao iniciar:", erro);

        if (streamAtual && !model) {
            // Se a câmera abriu mas o modelo falhou, mantemos o vídeo visível.
            botao.disabled = false;
            atualizarStatus("Câmera ligada; IA indisponível");
            alert(erro.message?.includes("modelo")
                ? erro.message
                : erroDaCamera(erro));
            return;
        }

        if (streamAtual) {
            streamAtual.getTracks().forEach((track) => track.stop());
            streamAtual = null;
        }
        loopAtivo = false;
        botao.disabled = false;
        atualizarStatus("Erro na câmera");
        alert(erroDaCamera(erro));
    }
}

async function detectarSinal(video) {
    if (!loopAtivo) return;

    if (model && video.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA) {
        try {
            const prediction = await model.predict(video);
            let maiorProbabilidade = 0;
            let sinalDetectado = "";

            for (let i = 0; i < maxPredictions; i++) {
                if (prediction[i].probability > maiorProbabilidade) {
                    maiorProbabilidade = prediction[i].probability;
                    sinalDetectado = prediction[i].className;
                }
            }

            if (maiorProbabilidade > 0.85 && sinalDetectado !== ultimoSinal) {
                ultimoSinal = sinalDetectado;
                atualizarStatus(sinalDetectado);
                falarTexto(sinalDetectado);
            }
        } catch (erro) {
            console.error("Erro na detecção:", erro);
        }
    }

    requestAnimationFrame(() => detectarSinal(video));
}

window.addEventListener("beforeunload", () => {
    if (streamAtual) streamAtual.getTracks().forEach((track) => track.stop());
});
