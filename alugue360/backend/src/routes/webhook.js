import pkg from "mercadopago";
import { Router } from "express";
import { prisma } from "../server.js";

const { MercadoPagoConfig, Payment, PreApproval } = pkg;
const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN || "" });
const payment = new Payment(client);
const preapproval = new PreApproval(client);

const router = Router();

router.post("/mercadopago", async (req, res) => {
  try {
    const { type, data, action } = req.body;
    const id = data?.id?.toString();

    if (!id) return res.sendStatus(200);

    if (type === "payment") {
      const info = await payment.get({ id });
      const external = info?.external_reference;
      if (external && info?.status === "approved") {
        if (external.endsWith(":extra_listing")) {
          const [userId] = external.split(":");
          if (userId) {
            await prisma.subscription.updateMany({
              where: { userId },
              data: { extraListings: { increment: 1 } },
            });
          }
        } else {
          const [userId, planId] = external.split(":");
          if (userId && planId) {
            await prisma.subscription.upsert({
              where: { userId },
              update: { status: "active", planId },
              create: { userId, planId, status: "active", mpSubscriptionId: id },
            });
          }
        }
      }
    }

    if (type === "preapproval") {
      let sub = await prisma.subscription.findFirst({ where: { mpSubscriptionId: id } });

      if (!sub) {
        try {
          const info = await preapproval.get({ id });
          const ext = info?.external_reference;
          if (ext) {
            const [userId, planId] = ext.split(":");
            if (userId && planId) {
              sub = await prisma.subscription.upsert({
                where: { userId },
                update: { mpSubscriptionId: id },
                create: { userId, planId, status: "pending", mpSubscriptionId: id },
              });
            }
          }
        } catch { }
      }

      if (sub && action !== "preapproval.cancelled") {
        await prisma.subscription.update({
          where: { id: sub.id },
          data: { status: "active" },
        });
      }

      if (sub && action === "preapproval.cancelled") {
        await prisma.subscription.update({
          where: { id: sub.id },
          data: { status: "cancelled" },
        });
      }
    }

    if (type === "subscription_preapproval" || type === "subscription_authorized_payment") {
      const sub = await prisma.subscription.findFirst({
        where: { mpSubscriptionId: id },
      });
      if (sub) {
        await prisma.subscription.update({
          where: { id: sub.id },
          data: { status: "active" },
        });
      }
    }

    res.sendStatus(200);
  } catch {
    res.sendStatus(200);
  }
});

export default router;
