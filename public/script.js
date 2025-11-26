const form = document.getElementById("analyzeForm");
const resultDiv = document.getElementById("result");
const progressBar = document.getElementById("progressBar");
const clearBtn = document.getElementById("clearBtn");
const downloadBtn = document.getElementById("downloadBtn");
const modeSelect = document.getElementById("mode");
const textArea = document.getElementById("text");
const imageInputs = document.getElementById("imageInputs");
const imageUrlInput = document.getElementById("imageUrl");
const imageFileInput = document.getElementById("imageFile");

let lastText = "";

// Mostrar campos según modo
modeSelect.addEventListener("change", () => {
  if(modeSelect.value === "text"){
    textArea.style.display = "block";
    imageInputs.style.display = "none";
    downloadBtn.style.display = "none";
  } else {
    textArea.style.display = "none";
    imageInputs.style.display = "block";
    downloadBtn.style.display = "inline-block";
  }
});

// Limpiar
clearBtn.addEventListener("click", () => {
  textArea.value = "";
  imageUrlInput.value = "";
  imageFileInput.value = "";
  resultDiv.textContent = "";
  progressBar.style.width = "0%";
  progressBar.textContent = "0%";
  lastText = "";
});

// Descargar texto extraído
downloadBtn.addEventListener("click", () => {
  if(lastText){
    const blob = new Blob([lastText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "texto_extraido.txt";
    a.click();
    URL.revokeObjectURL(url);
  }
});

// Form submit
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const mode = modeSelect.value;
  const text = textArea.value;
  const imageUrl = imageUrlInput.value;
  const imageFile = imageFileInput.files[0];

  resultDiv.textContent = "Analizando...";
  progressBar.style.width = "0%";
  progressBar.textContent = "0%";

  const formData = new FormData();
  formData.append("mode", mode);
  if(mode === "text"){
    formData.append("text", text);
  } else {
    if(imageFile){
      formData.append("imageFile", imageFile);
    } else {
      formData.append("imageUrl", imageUrl);
    }
  }

  try {
    const res = await fetch("/api/analyze", {
      method: "POST",
      body: formData
    });

    const data = await res.json();

    if(data.result){
      lastText = data.result;
      if(mode === "text"){
        const match = data.result.match(/\d+/);
        const percent = match ? parseInt(match[0]) : 0;
        resultDiv.textContent = "Probabilidad de ser IA: " + percent + "%";
        progressBar.style.width = percent + "%";
        progressBar.textContent = percent + "%";
      } else {
        resultDiv.textContent = data.result;
        progressBar.style.width = "100%";
        progressBar.textContent = "100%";
      }
    } else {
      resultDiv.textContent = "No se pudo obtener un resultado válido.";
    }

  } catch(err){
    console.error(err);
    resultDiv.textContent = "Error al analizar el contenido.";
    progressBar.style.width = "0%";
    progressBar.textContent = "0%";
  }
});

// Inicializar visibilidad
modeSelect.dispatchEvent(new Event("change"));
