const URL = "https://teachablemachine.withgoogle.com/models/m8K8sX1_j/";

let model, maxPredictions;
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
    if (textoElemento) textoElemento.innerText = "Carregando IA...";

    try {
        const modelURL = URL + "model.json";
        const metadataURL = URL + "metadata.json";

        // Carrega o modelo de IA
        model = await tmImage.load(modelURL, metadataURL);
        maxPredictions = model.getTotalClasses();

        // Solicita a câmera nativa do navegador (PC e Celular)
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { width: 300, height: 300 } 
        });

        // Cria o elemento de vídeo na tela
        const videoElement = document.createElement('video');
        videoElement.srcObject = stream;
        videoElement.setAttribute('playsinline', true);
        await videoElement.play();

        const container = document.getElementById('webcam-container');
        container.innerHTML = "";
        container.appendChild(videoElement);

        if (textoElemento) textoElemento.innerText = "Aguardando sinal...";
        
        // Inicia a detecção em loop no vídeo nativo
        detectarSinal(videoElement);

    } catch (erro) {
        console.error(erro);
        alert("Erro de acesso! Verifique se a câmera está autorizada ou se outro aplicativo está usando a webcam.");
        if (textoElemento) textoElemento.innerText = "Erro na Câmera";
    }
}

async function detectarSinal(video) {
    async function loop() {
        if (model && video) {
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
                if (textoElemento) textoElemento.innerText = sinalDetectado;
                falarTexto(sinalDetectado);
            }
        }
        requestAnimationFrame(loop);
    }
    loop();
}
