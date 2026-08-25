
const URL = "https://teachablemachine.withgoogle.com/models/librasExpresss/";

let model, webcam, maxPredictions;
let ultimoSinal = "";

const textoElemento = document.getElementById('texto-traduzido');

function falarTexto(texto) {
  const mensagem = texto || (textoElemento ? textoElemento.innerText : "");
  if (mensagem && mensagem !== "Carregando IA..." && mensagem !== "Aguardando sinal...") {
    window.speechSynthesis.cancel();
    const fala = new SpeechSynthesisUtterance(mensagem);
    fala.lang = 'pt-BR';
    window.speechSynthesis.speak(fala);
  }
}

async function init() {
  try {
    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";

    // Carrega o modelo de IA
    model = await tmImage.load(modelURL, metadataURL);
    maxPredictions = model.getTotalClasses();

    // Configura a câmera
    const flip = true; 
    webcam = new tmImage.Webcam(480, 360, flip); 
    await webcam.setup(); 
    await webcam.play();
    window.requestAnimationFrame(loop);

    // Conecta a câmera na div do index.html
    const container = document.getElementById('webcam-container');
    container.innerHTML = "";
    container.appendChild(webcam.canvas);
    
    if (textoElemento) textoElemento.innerText = "Aguardando sinal...";
  } catch (erro) {
    console.error("Erro na câmera/modelo:", erro);
    if (textoElemento) textoElemento.innerText = "Erro ao carregar a câmera";
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

  // Se a IA tiver mais de 80% de certeza
  if (maiorProbabilidade > 0.80 && sinalDetectado !== ultimoSinal) {
    ultimoSinal = sinalDetectado;
    if (textoElemento) textoElemento.innerText = sinalDetectado;
    falarTexto(sinalDetectado);
  }
}

