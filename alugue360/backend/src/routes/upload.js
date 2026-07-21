import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { v2 as cloudinary } from "cloudinary";
import { authMiddleware } from "../middleware/auth.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, "..", "..", "uploads");

// Garante que o diretório de uploads existe
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Testa conectividade com Cloudinary na inicialização
if (process.env.CLOUDINARY_URL) {
  cloudinary.api.ping()
    .then(() => console.log("☁️ Cloudinary conectado com sucesso"))
    .catch(e => console.warn("⚠️ Cloudinary indisponível, uploads usarão armazenamento local:", e?.error?.message || e?.message || e));
} else {
  console.log("📁 CLOUDINARY_URL não configurada, uploads usarão armazenamento local");
}

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|mp4|webm|mov|avi/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype.split("/")[1]);
    cb(null, ext || mime);
  },
});

const router = Router();

router.post("/", authMiddleware, upload.array("files", 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "Nenhum arquivo enviado" });
    }
    const urls = await Promise.all(req.files.map(async (f) => {
      if (process.env.CLOUDINARY_URL) {
        const result = await cloudinary.uploader.upload(f.path, {
          folder: "locafy",
          resource_type: "auto",
        });
        return result.secure_url;
      }
      return `/uploads/${f.filename}`;
    }));
    res.json({ urls });
  } catch (err) {
    console.error("❌ Upload error:", err);
    res.status(500).json({ error: err.message || "Erro ao fazer upload" });
  }
});

// Upload público (sem auth) para fluxo checkout → registro
router.post("/public", upload.array("files", 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "Nenhum arquivo enviado" });
    }
    const urls = await Promise.all(req.files.map(async (f) => {
      if (process.env.CLOUDINARY_URL) {
        const result = await cloudinary.uploader.upload(f.path, {
          folder: "locafy",
          resource_type: "auto",
        });
        return result.secure_url;
      }
      return `/uploads/${f.filename}`;
    }));
    res.json({ urls });
  } catch (err) {
    console.error("❌ Upload error:", err);
    res.status(500).json({ error: err.message || "Erro ao fazer upload" });
  }
});

export default router;
