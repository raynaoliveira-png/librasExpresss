// Modelo de teste funcionando 100%
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
    if (textoElemento) textoElemento.innerText = "Carregando IA...";

    try {
        const modelURL = URL + "model.json";
        const metadataURL = URL + "metadata.json";

        model = await tmImage.load(modelURL, metadataURL);
        maxPredictions = model.getTotalClasses();

        const size = 300; 
        const flip = true; 
        webcam = new tmImage.Webcam(size, size, flip);
        
        await webcam.setup({ facingMode: "user" }); 
        await webcam.play();
        window.requestAnimationFrame(loop);

        const container = document.getElementById('webcam-container');
        container.innerHTML = "";
        container.appendChild(webcam.canvas);
        
        if (textoElemento) textoElemento.innerText = "Aguardando sinal...";
    } catch (erro) {
        console.error(erro);
        alert("Erro na câmera! Permita o acesso à câmera nas configurações do navegador.");
        if (textoElemento) textoElemento.innerText = "Erro na Câmera";
    }
}

async function loop() {
    webcam.update();
    await predict();
    window.requestAnimationFrame(loop);
}

async function predict() {
    const prediction = await model.predict(webcam.canvas);
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
