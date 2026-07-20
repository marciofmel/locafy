import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { API } from "../config";
import { Loader, CreditCard, CheckCircle } from "lucide-react";

const MP_PUBLIC_KEY = "APP_USR-a1e6f75d-132d-4f50-9268-623e7c021169";

export default function PaymentCardForm() {
  const { planId } = useParams();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    if (!token) return navigate("/login");
    if (!user) return;
    fetch(`${API}/plans`).then(r => r.json()).then(plans => {
      const p = plans.find(pl => pl.id === planId);
      if (p) setPlan(p);
      else setErr("Plano não encontrado");
    }).catch(() => setErr("Erro ao carregar plano")).finally(() => setLoading(false));
  }, [planId, token, user]);

  useEffect(() => {
    if (!plan || !window.MercadoPago || initialized.current) return;
    initialized.current = true;

    const mp = new window.MercadoPago(MP_PUBLIC_KEY, { locale: "pt-BR" });

    const bricksBuilder = mp.bricks();
    bricksBuilder.create("cardPayment", "cardPaymentBrick", {
      initialization: {
        amount: plan.price,
      },
      customization: {
        visual: { hideFormTitle: true },
        paymentMethods: { installments: { max: 1 } },
      },
      callbacks: {
        onReady: () => {},
        onSubmit: (cardFormData) => {
          return new Promise((resolve, reject) => {
            const cardTokenId = cardFormData.token;
            if (!cardTokenId) {
              setErr("Erro ao gerar token do cartão");
              setSubmitting(false);
              return reject();
            }
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 35000);
            fetch(`${API}/plans/subscribe-with-card`, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify({ planId, cardTokenId }),
              signal: controller.signal,
            }).then(r => r.json()).then(res => {
              clearTimeout(timeout);
              if (res.error) {
                setErr(res.error);
                setSubmitting(false);
                reject();
              } else {
                setSuccess(true);
                setTimeout(() => navigate("/payment/success"), 2000);
                resolve();
              }
            }).catch(() => {
              clearTimeout(timeout);
              setErr("Erro de conexão. Verifique se o cartão foi aprovado.");
              setSubmitting(false);
              reject();
            });
          });
        },
        onError: (error) => {
          console.error("CardPayment Brick error:", error);
          setErr("Erro no pagamento: " + (error?.message || JSON.stringify(error)));
        },
      },
    }).catch(err => {
      console.error("bricks init error:", err);
      setErr("Erro ao carregar formulário de pagamento");
    });
  }, [plan]);

  if (loading) return <div className="min-h-[70vh] flex items-center justify-center"><Loader className="animate-spin text-emerald-600" size={32} /></div>;
  if (success) return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="text-center"><CheckCircle size={64} className="text-emerald-600 mx-auto mb-4" /><h2 className="text-2xl font-bold">Pagamento confirmado!</h2><p className="text-gray-500 mt-2">Redirecionando...</p></div>
    </div>
  );

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <CreditCard size={40} className="text-emerald-600 mx-auto mb-2" />
          <h1 className="text-2xl font-bold text-gray-800">Finalizar assinatura</h1>
          {plan && <p className="text-gray-500 mt-1">{plan.name} — R$ {plan.price.toFixed(2)}/mês</p>}
        </div>
        <div className="bg-white p-6 rounded-xl shadow">
          <div id="cardPaymentBrick" />
          {err && <p className="text-red-600 text-sm mt-4 text-center">{err}</p>}
        </div>
      </div>
    </div>
  );
}
