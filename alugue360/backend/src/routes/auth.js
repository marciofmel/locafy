import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../server.js";
import { generateToken, authMiddleware } from "../middleware/auth.js";

const router = Router();

router.post("/register", async (req, res) => {
  try {
    const { name, email, phone, password, cpf, rgDocument, selfie, avatar, city, state, street, number, neighborhood } = req.body;
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return res.status(400).json({ error: "Email já cadastrado" });

    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name, email, phone: phone || "", password: hash,
        cpf, rgDocument, selfie, avatar,
        city, state, street, number, neighborhood,
        docStatus: rgDocument || selfie ? "pending" : "none",
      },
    });

    const token = generateToken(user.id);
    res.json({ token, user: { id: user.id, name, email, phone: phone || "", avatar } });
  } catch (err) {
    console.error("❌ Register error:", err);
    res.status(500).json({ error: "Erro ao cadastrar" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ error: "Usuário não encontrado" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: "Senha incorreta" });

    const token = generateToken(user.id);
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, phone: user.phone } });
  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).json({ error: "Erro ao logar" });
  }
});

router.get("/me", authMiddleware, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    include: { subscription: { include: { plan: true } } },
  });
  if (!user) return res.status(404).json({ error: "Usuário não encontrado" });
  const { password, ...safe } = user;
  res.json(safe);
});

router.post("/documents", authMiddleware, async (req, res) => {
  try {
    const { cpf, rgDocument, selfie, cnh } = req.body;
    const data = {};
    if (cpf !== undefined) data.cpf = cpf;
    if (rgDocument !== undefined) data.rgDocument = rgDocument;
    if (selfie !== undefined) data.selfie = selfie;
    if (cnh !== undefined) data.cnh = cnh;
    data.docStatus = "pending";

    await prisma.user.update({ where: { id: req.userId }, data });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Erro ao salvar documentos" });
  }
});

export default router;
