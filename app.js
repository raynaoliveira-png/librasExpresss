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
        // 1. Carrega os arquivos do Teachable Machine
        const modelURL = URL + "model.json";
        const metadataURL = URL + "metadata.json";

        model = await tmImage.load(modelURL, metadataURL);
        maxPredictions = model.getTotalClasses();

        // 2. Acesso à câmera simplificado para maior compatibilidade
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: true, 
            audio: false 
        });

        // 3. Monta o elemento de vídeo na tela
        const videoElement = document.createElement('video');
        videoElement.srcObject = stream;
        videoElement.setAttribute('playsinline', true);
        videoElement.autoplay = true;
        videoElement.muted = true;

        await videoElement.play();

        const container = document.getElementById('webcam-container');
        container.innerHTML = "";
        container.appendChild(videoElement);

        if (textoElemento) textoElemento.innerText = "Aguardando sinal...";
        
        // 4. Executa o loop de inteligência artificial
        detectarSinal(videoElement);

    } catch (erro) {
        console.error("Detalhes do Erro:", erro);
        alert("Não foi possível conectar à webcam. Verifique se a câmera física do notebook não está desligada por chave/botão ou em uso por outro programa.");
        if (textoElemento) textoElemento.innerText = "Erro na Câmera";
    }
}

async function detectarSinal(video) {
    async function loop() {
        if (model && video && video.readyState === 4) {
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
