const MODEL_URL = "https://teachablemachine.withgoogle.com/models/m8K8sX1_j/";

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

function mensagemDeErro(erro) {
    switch (erro?.name) {
        case "NotAllowedError":
        case "PermissionDeniedError":
            return "Permissão da câmera negada. Autorize a câmera nas configurações do navegador e tente novamente.";
        case "NotFoundError":
        case "DevicesNotFoundError":
            return "Nenhuma câmera foi encontrada neste dispositivo.";
        case "NotReadableError":
        case "TrackStartError":
            return "A câmera está em uso por outro aplicativo ou não pôde ser acessada.";
        case "SecurityError":
            return "A câmera só funciona em HTTPS ou em localhost. Abra o site em uma conexão segura.";
        default:
            return "Não foi possível abrir a câmera. Verifique a permissão e se ela não está sendo usada por outro programa.";
    }
}

async function iniciar() {
    if (loopAtivo) return;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        atualizarStatus("Câmera indisponível");
        alert("Este navegador não oferece suporte à câmera ou a página não está em HTTPS/localhost.");
        return;
    }

    botao.disabled = true;
    atualizarStatus("Carregando IA...");

    try {
        if (!model) {
            model = await tmImage.load(
                `${MODEL_URL}model.json`,
                `${MODEL_URL}metadata.json`
            );
            maxPredictions = model.getTotalClasses();
        }

        atualizarStatus("Solicitando acesso à câmera...");
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

        loopAtivo = true;
        atualizarStatus("Aguardando sinal...");
        botao.innerText = "✅ Câmera ligada";
        detectarSinal(videoElement);
    } catch (erro) {
        console.error("Erro ao iniciar câmera:", erro);
        if (streamAtual) {
            streamAtual.getTracks().forEach((track) => track.stop());
            streamAtual = null;
        }
        loopAtivo = false;
        botao.disabled = false;
        atualizarStatus("Erro na câmera");
        alert(mensagemDeErro(erro));
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
