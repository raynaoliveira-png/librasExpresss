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
