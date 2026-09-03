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
    if (textoElemento) textoElemento.innerText = "Carregando modelo de IA...";

    try {
        const modelURL = URL + "model.json";
        const metadataURL = URL + "metadata.json";

        // 1. Carrega o modelo treinado
        model = await tmImage.load(modelURL, metadataURL);
        maxPredictions = model.getTotalClasses();

        // 2. Acesso nativo à câmera para evitar bloqueios de permissão
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { width: 300, height: 300 } 
        });

        // 3. Cria o vídeo na tela com espelhamento
        const videoElement = document.createElement('video');
        videoElement.srcObject = stream;
        videoElement.setAttribute('playsinline', true);
        videoElement.style.transform = "scaleX(-1)"; // Espelha a imagem para facilitar o sinal
        videoElement.style.width = "100%";
        videoElement.style.height = "100%";
        videoElement.style.objectFit = "cover";

        await videoElement.play();

        const container = document.getElementById('webcam-container');
        container.innerHTML = "";
        container.appendChild(videoElement);

        if (textoElemento) textoElemento.innerText = "Aguardando sinal...";
        
        // 4. Inicia a leitura do modelo de IA sobre o vídeo nativo
        detectarSinal(videoElement);

    } catch (erro) {
        console.error("Erro na leitura da câmera ou IA:", erro);
        alert("Não foi possível carregar a câmera. Certifique-se de fechar outros programas que usam a webcam e tente novamente.");
        if (textoElemento) textoElemento.innerText = "Erro ao iniciar";
    }
}

async function detectarSinal(video) {
    async function loop() {
        if (model && video && video.readyState === 4) {
            // IA analisa o elemento de vídeo nativo
            const prediction = await model.predict(video);
            let maiorProbabilidade = 0;
            let sinalDetectado = "";

            for (let i = 0; i < maxPredictions; i++) {
                if (prediction[i].probability > maiorProbabilidade) {
                    maiorProbabilidade = prediction[i].probability;
                    sinalDetectado = prediction[i].className;
                }
            }

            // Sensibilidade ajustada para 50% (0.50) para garantir a leitura rápida
            if (maiorProbabilidade > 0.50 && sinalDetectado !== ultimoSinal) {
                ultimoSinal = sinalDetectado;
                if (textoElemento) textoElemento.innerText = sinalDetectado;
                falarTexto(sinalDetectado);
            }
        }
        requestAnimationFrame(loop);
    }
    loop();
}
