import { Router } from "express";
import { prisma } from "../server.js";
import { authMiddleware } from "../middleware/auth.js";
import jwt from "jsonwebtoken";

const router = Router();

router.get("/", async (req, res) => {
  const { category, search, city, state } = req.query;
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 12));
  const where = { active: true };

  if (category) where.categoryId = category;
  if (city) where.city = { contains: city, mode: "insensitive" };
  if (state) where.state = state;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  const [listings, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      include: { category: true, user: { select: { id: true, name: true, phone: true } } },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.listing.count({ where }),
  ]);

  res.json({ listings, total, page, limit, hasMore: page * limit < total });
});

router.get("/:id", async (req, res) => {
  const listing = await prisma.listing.findUnique({
    where: { id: req.params.id },
    include: { category: true, user: { select: { id: true, name: true, phone: true } } },
  });
  if (!listing) return res.status(404).json({ error: "Anúncio não encontrado" });

  let canContact = false;
  let requiredDoc = "rg";
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "locafy-secret-key-change-in-production");
      const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
      if (user?.docStatus && user.docStatus !== "none") {
        const isVehicle = listing.category?.slug === "carros" || listing.category?.slug === "motos";
        requiredDoc = isVehicle ? "cnh" : "rg";
        if (isVehicle) canContact = !!(user.cnh && user.selfie);
        else canContact = !!(user.rgDocument && user.selfie);
      }
    }
  } catch {}

  res.json({ ...listing, canContact, requiredDoc });
});

router.post("/", authMiddleware, async (req, res) => {
  try {
    const sub = await prisma.subscription.findFirst({
      where: { userId: req.userId, status: "active" },
      include: { plan: true },
    });
    if (!sub) return res.status(403).json({ error: "Assinatura necessária para anunciar" });

    const activeCount = await prisma.listing.count({
      where: { userId: req.userId, active: true },
    });

    if (activeCount >= sub.plan.maxListings + sub.extraListings) {
      return res.status(402).json({
        error: "Limite de anúncios atingido",
        extraPaymentRequired: true,
        extraPrice: 15,
        activeCount,
        limit: sub.plan.maxListings + sub.extraListings,
      });
    }

    const featured = sub.plan.price >= 49.99;
    const { title, description, price, priceType, images, videos, whatsapp, street, number, neighborhood, city, state, categoryId, features } = req.body;
    const listing = await prisma.listing.create({
      data: { title, description, price, priceType: priceType || "daily", images, videos: videos || [], whatsapp, street, number, neighborhood, city, state, categoryId, features: features || [], userId: req.userId, featured },
    });

    await prisma.subscription.update({
      where: { id: sub.id },
      data: { listingsUsed: { increment: 1 } },
    });

    res.json(listing);
  } catch {
    res.status(500).json({ error: "Erro ao criar anúncio" });
  }
});

router.post("/extra-payment", authMiddleware, async (req, res) => {
  try {
    const sub = await prisma.subscription.findFirst({
      where: { userId: req.userId, status: "active" },
      include: { plan: true },
    });
    if (!sub) return res.status(403).json({ error: "Assinatura necessária" });

    const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN || "";
    if (!MP_ACCESS_TOKEN) return res.status(400).json({ error: "Pagamento indisponível" });

    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    const baseUrl = req.headers.origin || process.env.FRONTEND_URL || "http://localhost:5173";
    const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

    const body = {
      items: [{
        title: "Anúncio extra",
        quantity: 1,
        currency_id: "BRL",
        unit_price: 15,
      }],
      payer: { email: user.email },
      back_urls: {
        success: `${baseUrl}/dashboard`,
        failure: `${baseUrl}/dashboard`,
        pending: `${baseUrl}/dashboard`,
      },
      auto_return: "approved",
      external_reference: `${user.id}:extra_listing`,
      notification_url: `${BACKEND_URL}/webhook/mercadopago`,
    };

    const mpRes = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
      body: JSON.stringify(body),
    });

    if (!mpRes.ok) {
      const errText = await mpRes.text();
      return res.status(502).json({ error: `MP error ${mpRes.status}: ${errText}` });
    }

    const pref = await mpRes.json();
    res.json({ url: pref.init_point || pref.sandbox_init_point, preferenceId: pref.id });
  } catch {
    res.status(500).json({ error: "Erro ao criar pagamento" });
  }
});

router.put("/:id", authMiddleware, async (req, res) => {
  const listing = await prisma.listing.findUnique({ where: { id: req.params.id } });
  if (!listing || listing.userId !== req.userId) return res.status(403).json({ error: "Sem permissão" });

  const { title, description, price, priceType, images, videos, whatsapp, street, number, neighborhood, city, state, categoryId, features } = req.body;
  const updated = await prisma.listing.update({
    where: { id: req.params.id },
    data: {
      title, description, price, priceType,
      images: images ?? listing.images,
      videos: videos ?? listing.videos,
      whatsapp, street, number, neighborhood, city, state,
      categoryId,
      features: features ?? listing.features,
    },
  });
  res.json(updated);
});

router.delete("/:id", authMiddleware, async (req, res) => {
  const listing = await prisma.listing.findUnique({ where: { id: req.params.id } });
  if (!listing || listing.userId !== req.userId) return res.status(403).json({ error: "Sem permissão" });

  await prisma.listing.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

router.get("/my/listings", authMiddleware, async (req, res) => {
  const listings = await prisma.listing.findMany({
    where: { userId: req.userId },
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(listings);
});

export default router;
