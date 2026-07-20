import { Router } from "express";
import { prisma } from "../server.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN || "";

router.get("/", async (req, res) => {
  try {
    let plans = await prisma.plan.findMany({ where: { active: true } });
    const PLAN_DATA = [
      { name: "Básico", price: 29.99, maxListings: 2, features: ["2 anúncios inclusos", "Fotos ilimitadas", "WhatsApp direto", "R$15 por anúncio extra"] },
      { name: "Profissional", price: 49.99, maxListings: 6, features: ["6 anúncios inclusos", "Fotos ilimitadas", "WhatsApp direto", "Destaque por 7 dias", "R$15 por anúncio extra"] },
      { name: "Premium", price: 89.99, maxListings: 12, features: ["12 anúncios inclusos", "Fotos ilimitadas", "WhatsApp direto", "Destaque permanente", "Suporte prioritário", "R$15 por anúncio extra"] },
      { name: "Teste", price: 1, maxListings: 1, features: ["1 anúncio", "Apenas para testes"] },
    ];
    if (plans.length === 0) {
      for (const p of PLAN_DATA) plans.push(await prisma.plan.create({ data: { ...p, interval: "months" } }));
    } else {
      for (const pdata of PLAN_DATA) {
        const existing = plans.find(p => p.name === pdata.name);
        if (!existing) {
          plans.push(await prisma.plan.create({ data: { ...pdata, interval: "months" } }));
        } else if (existing.price !== pdata.price || existing.maxListings !== pdata.maxListings) {
          await prisma.plan.update({ where: { id: existing.id }, data: { price: pdata.price, maxListings: pdata.maxListings, features: pdata.features } });
        }
      }
    }
    plans = await prisma.plan.findMany({ where: { active: true } });
    res.json(plans);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar planos" });
  }
});

router.post("/subscribe/:planId", authMiddleware, async (req, res) => {
  try {
    const plan = await prisma.plan.findUnique({ where: { id: req.params.planId } });
    if (!plan) return res.status(404).json({ error: "Plano não encontrado" });

    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    const baseUrl = req.headers.origin || process.env.FRONTEND_URL || "http://localhost:5173";

    if (!MP_ACCESS_TOKEN) {
      return res.status(400).json({ error: "Pagamento indisponível: Mercado Pago não configurado" });
    }

    const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

    const body = {
      reason: plan.name,
      payer_email: user.email,
      back_url: `${baseUrl}/payment/success`,
      auto_return: "approved",
      external_reference: `${user.id}:${plan.id}`,
      notification_url: `${BACKEND_URL}/webhook/mercadopago`,
      auto_recurring: {
        frequency: 1,
        frequency_type: plan.interval || "months",
        transaction_amount: plan.price,
        currency_id: "BRL",
      },
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    let mpRes;
    try {
      mpRes = await fetch("https://api.mercadopago.com/preapproval", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (fetchErr) {
      clearTimeout(timeoutId);
      console.error("MP fetch error:", fetchErr?.message || fetchErr);
      return res.status(502).json({ error: "Mercado Pago indisponível. Tente novamente." });
    }

    clearTimeout(timeoutId);

    if (!mpRes.ok) {
      const errText = await mpRes.text();
      console.error("MP API error:", mpRes.status, errText);
      return res.status(502).json({ error: `MP error ${mpRes.status}: ${errText}` });
    }

    const mpSub = await mpRes.json();

    await prisma.subscription.upsert({
      where: { userId: user.id },
      update: { status: "pending", planId: plan.id, mpSubscriptionId: mpSub.id },
      create: { userId: user.id, planId: plan.id, status: "pending", mpSubscriptionId: mpSub.id },
    });

    return res.json({ url: mpSub.init_point || mpSub.sandbox_init_point });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao criar assinatura" });
  }
});

router.post("/subscribe-with-card", authMiddleware, async (req, res) => {
  try {
    const { planId, cardTokenId } = req.body;
    if (!planId || !cardTokenId) return res.status(400).json({ error: "planId e cardTokenId são obrigatórios" });

    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) return res.status(404).json({ error: "Plano não encontrado" });

    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

    if (!MP_ACCESS_TOKEN) return res.status(400).json({ error: "Mercado Pago não configurado" });

    const baseUrl = req.headers.origin || process.env.FRONTEND_URL || "http://localhost:5173";
    const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

    const body = {
      reason: plan.name,
      external_reference: `${user.id}:${plan.id}`,
      payer_email: user.email,
      card_token_id: cardTokenId,
      status: "authorized",
      back_url: `${baseUrl}/payment/success`,
      notification_url: `${BACKEND_URL}/webhook/mercadopago`,
      auto_recurring: {
        frequency: 1,
        frequency_type: plan.interval || "months",
        transaction_amount: plan.price,
        currency_id: "BRL",
      },
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    let mpRes;
    try {
      mpRes = await fetch("https://api.mercadopago.com/preapproval", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (fetchErr) {
      clearTimeout(timeoutId);
      console.error("MP fetch error:", fetchErr?.message || fetchErr);
      return res.status(502).json({ error: "Tempo limite excedido ao processar pagamento. Tente novamente." });
    }

    clearTimeout(timeoutId);

    if (!mpRes.ok) {
      const errText = await mpRes.text();
      console.error("MP API error:", mpRes.status, errText);
      return res.status(502).json({ error: `MP error ${mpRes.status}: ${errText}` });
    }

    const mpSub = await mpRes.json();

    await prisma.subscription.upsert({
      where: { userId: user.id },
      update: { status: "active", planId: plan.id, mpSubscriptionId: mpSub.id },
      create: { userId: user.id, planId: plan.id, status: "active", mpSubscriptionId: mpSub.id },
    });

    return res.json({ success: true, subscriptionId: mpSub.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao criar assinatura" });
  }
});

export default router;
