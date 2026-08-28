// ⚠️ ATENÇÃO: COLE SEU LINK DO TEACHABLE MACHINE AQUI!const URL = "https://teachablemachine.withgoogle.com/models/m8K8sX1_j/";
// Deve terminar com a barra "/", como no exemplo: "https://teachablemachine.withgoogle.com/models/k9X_a1b2c/"
const URL = "https://teachablemachine.withgoogle.com/models/m8K8sX1_j/";

let model, webcam, maxPredictions;
let ultimoSinal = "";
const textoElemento = document.getElementById('texto-traduzido');

// Função de voz (Opcional, mas legal)
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

    // 1. Verificação do link (para não dar erro de câmera)
    if (URL.includes("SEU_CODIGO_AQUI")) {
        alert("Ops! Você esqueceu de colar o seu link do Teachable Machine na linha 2 do arquivo app.js!");
        if (textoElemento) textoElemento.innerText = "Link não configurado";
        return;
    }

    try {
        const modelURL = URL + "model.json";
        const metadataURL = URL + "metadata.json";

        // 2. Carrega o modelo de IA
        model = await tmImage.load(modelURL, metadataURL);
        maxPredictions = model.getTotalClasses();

        // 3. Configuração da câmera (Crucial para mobile)
        const size = 300; // Tamanho ideal para o container CSS
        const flip = true; 
        webcam = new tmImage.Webcam(size, size, flip);
        
        // Solicita acesso à câmera FRONTAL ("user"). Para traseira use "environment".
        await webcam.setup({ facingMode: "user" }); 
        await webcam.play();
        window.requestAnimationFrame(loop);

        // 4. Mostra a câmera na tela
        const container = document.getElementById('webcam-container');
        container.innerHTML = "";
        container.appendChild(webcam.canvas);
        
        if (textoElemento) textoElemento.innerText = "Aguardando sinal...";
    } catch (erro) {
        console.error("Erro completo:", erro);
        alert("Erro ao acessar a câmera. Verifique:\n1. Se o link da IA está correto.\n2. Se você permitiu a câmera no navegador.\n3. Se nenhuma outra aba está usando a câmera.");
        if (textoElemento) textoElemento.innerText = "Erro na Câmera";
    }
}

async function loop() {
    webcam.update(); // Atualiza o frame da câmera
    await predict(); // Faz a previsão
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

  // Só atualiza se a certeza for maior que 85% e o sinal mudou
  if (maiorProbabilidade > 0.85 && sinalDetectado !== ultimoSinal) {
    ultimoSinal = sinalDetectado;
    if (textoElemento) textoElemento.innerText = sinalDetectado;
    falarTexto(sinalDetectado);
  }
}
