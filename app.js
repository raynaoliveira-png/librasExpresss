const videoElement = document.getElementById('webcam');
const canvasElement = document.getElementById('canvas-saida');
const canvasCtx = canvasElement.getContext('2d');
const textoElemento = document.getElementById('texto-traduzido');

let ultimoSinal = "";

// 1. Função para fazer o computador falar o texto do sinal
function falarTexto(texto) {
  const mensagem = texto || textoElemento.innerText;
  if (mensagem && mensagem !== "Aguardando sinal...") {
    window.speechSynthesis.cancel(); // Para falas anteriores
    const fala = new SpeechSynthesisUtterance(mensagem);
    fala.lang = 'pt-BR';
    window.speechSynthesis.speak(fala);
  }
}

// 2. Lógica para reconhecer os gestos com base nos pontos da mão
function reconhecerGesto(pontos) {
  // Verificação de dedo levantado (no canvas, Y menor significa mais alto na tela)
  const indicadorAberto = pontos[8].y < pontos[6].y;
  const medioAberto = pontos[12].y < pontos[10].y;
  const anelarAberto = pontos[16].y < pontos[14].y;
  const minimoAberto = pontos[20].y < pontos[18].y;

  let sinalAtual = "";

  // Regras dos sinais em Libras / Gestos
  if (indicadorAberto && medioAberto && anelarAberto && minimoAberto) {
    sinalAtual = "Oi / Tchau 👋";
  } else if (indicadorAberto && !medioAberto && !anelarAberto && !minimoAberto) {
    sinalAtual = "Número 1 / Atenção ☝️";
  } else if (!indicadorAberto && !medioAberto && !anelarAberto && !minimoAberto) {
    sinalAtual = "Letra A / Fechado ✊";
  } else if (indicadorAberto && medioAberto && !anelarAberto && !minimoAberto) {
    sinalAtual = "Paz / Vitória ✌️";
  }

  // Se detectou um novo sinal, atualiza a tela e fala a palavra em voz alta
  if (sinalAtual !== "" && sinalAtual !== ultimoSinal) {
    ultimoSinal = sinalAtual;
    textoElemento.innerText = sinalAtual;
    falarTexto(sinalAtual);
  }
}

// 3. Processar a imagem da câmera com a IA do MediaPipe
function aoReceberResultados(resultados) {
  canvasElement.width = videoElement.videoWidth;
  canvasElement.height = videoElement.videoHeight;

  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

  // Se detectar uma mão na câmera
  if (resultados.multiHandLandmarks && resultados.multiHandLandmarks.length > 0) {
    for (const pontos of resultados.multiHandLandmarks) {
      // Desenha o esqueleto da mão (linhas verdes e pontos brancos)
      drawConnectors(canvasCtx, pontos, HAND_CONNECTIONS, {color: '#00E676', lineWidth: 4});
      drawLandmarks(canvasCtx, pontos, {color: '#FFFFFF', lineWidth: 2, radius: 4});

      // Identifica o sinal
      reconhecerGesto(pontos);
    }
  }
  canvasCtx.restore();
}

// 4. Inicializar a IA de rastreamento de mãos do MediaPipe
const hands = new Hands({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});

hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 1,
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.7
});

hands.onResults(aoReceberResultados);

// 5. Iniciar a câmera
const camera = new Camera(videoElement, {
  onFrame: async () => {
    await hands.send({image: videoElement});
  },
  width: 640,
  height: 480
});

camera.start();
