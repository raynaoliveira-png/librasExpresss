<div>Teachable Machine Image Model</div>
<button type="button" onclick="init()">Start</button>
<div id="webcam-container"></div>
<div id="label-container"></div>
<script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@latest/dist/tf.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@teachablemachine/image@latest/dist/teachablemachine-image.min.js"></script>
<script type="text/javascript">
    // More API functions here:
    // https://github.com/googlecreativelab/teachablemachine-community/tree/master/libraries/image

    // the link to your model provided by Teachable Machine export panel
    const URL = "./my_model/";

    let model, webcam, labelContainer, maxPredictions;

    // Load the image model and setup the webcam
    async function init() {
        const modelURL = URL + "model.json";
        const metadataURL = URL + "metadata.json";

        // load the model and metadata
        // Refer to tmImage.loadFromFiles() in the API to support files from a file picker
        // or files from your local hard drive
        // Note: the pose library adds "tmImage" object to your window (window.tmImage)
        model = await tmImage.load(modelURL, metadataURL);
        maxPredictions = model.getTotalClasses();

        // Convenience function to setup a webcam
        const flip = true; // whether to flip the webcam
        webcam = new tmImage.Webcam(200, 200, flip); // width, height, flip
        await webcam.setup(); // request access to the webcam
        await webcam.play();
        window.requestAnimationFrame(loop);

        // append elements to the DOM
        document.getElementById("webcam-container").appendChild(webcam.canvas);
        labelContainer = document.getElementById("label-container");
        for (let i = 0; i < maxPredictions; i++) { // and class labels
            labelContainer.appendChild(document.createElement("div"));
        }
    }

    async function loop() {
        webcam.update(); // update the webcam frame
        await predict();
        window.requestAnimationFrame(loop);
    }

    // run the webcam image through the image model
    async function predict() {
        // predict can take in an image, video or canvas html element
        const prediction = await model.predict(webcam.canvas);
        for (let i = 0; i < maxPredictions; i++) {
            const classPrediction =
                prediction[i].className + ": " + prediction[i].probability.toFixed(2);
            labelContainer.childNodes[i].innerHTML = classPrediction;
        }
    }
</script>
// 1. IMPORTANTE: Substitua o link abaixo pelo SEU link do Teachable Machine
const URL = "https://teachablemachine.withgoogle.com/models/SEU_MODELO_AQUI/";

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

// Inicia automaticamente
init();

