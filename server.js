// server.js
const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const multer = require("multer");
const path = require("path");

const app = express();
const PORT = 3000;

// Tu Secret Key V3 de Hive
const HIVE_SECRET_KEY = "naFG1qcnkPDdyaaexAGvjA==";

// Configuración de multer para subir imágenes
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Ruta para analizar texto o extraer texto de imagen
app.post("/api/analyze", upload.single("imageFile"), async (req, res) => {
  const { mode, text, imageUrl } = req.body;

  // Preparar contenido según el modo
  let content = [];

  try {
    if (mode === "text") {
      if (!text || text.trim() === "") {
        return res.status(400).json({ error: "Debe enviar texto válido" });
      }
      content.push({
        type: "text",
        text: `Analiza este texto y responde solo con la probabilidad de que haya sido generado por IA (0 a 100): "${text}"`
      });
    } else if (mode === "image") {
      let imageDataUrl = null;

      // Imagen subida
      if (req.file) {
        const mime = req.file.mimetype;
        const base64 = req.file.buffer.toString("base64");
        imageDataUrl = `data:${mime};base64,${base64}`;
      } else if (imageUrl && imageUrl.trim() !== "") {
        imageDataUrl = imageUrl.trim();
      } else {
        return res.status(400).json({ error: "Debe enviar una URL de imagen o subir un archivo" });
      }

      content.push({
        type: "image_url",
        image_url: { url: imageDataUrl }
      });
    } else {
      return res.status(400).json({ error: "Modo inválido" });
    }

    const messages = [{ role: "user", content }];

    const response = await fetch("https://api.thehive.ai/api/v3/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${HIVE_SECRET_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "hive/vision-language-model",
        max_tokens: 200,
        messages
      })
    });

    const data = await response.json();
    console.log("Respuesta Hive:", JSON.stringify(data, null, 2));

    if (data.choices && data.choices[0] && data.choices[0].message) {
      // Devolver solo el contenido
      res.json({ result: data.choices[0].message.content });
    } else {
      res.status(500).json({ error: "No se pudo obtener un resultado válido" });
    }

  } catch (error) {
    console.error("Error fetch Hive:", error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => console.log(`Servidor escuchando en http://localhost:${PORT}`));
