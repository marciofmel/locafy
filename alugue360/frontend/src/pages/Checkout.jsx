import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { API } from "../config";
import { Loader, CreditCard, QrCode, Barcode, ArrowLeft } from "lucide-react";

const MP_PUBLIC_KEY = "APP_USR-a1e6f75d-132d-4f50-9268-623e7c021169";

export default function Checkout() {
  const { planId } = useParams();
  const navigate = useNavigate();
  const [plan, setPlan] = useState(null);
  const [method, setMethod] = useState("card");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [err, setErr] = useState("");
  const initialized = useRef(false);

  useEffect(() => {
    fetch(`${API}/plans`).then(r => r.json()).then(plans => {
      const p = plans.find(pl => pl.id === planId);
      if (p) setPlan(p);
      else setErr("Plano não encontrado");
    }).catch(() => setErr("Erro ao carregar plano")).finally(() => setLoading(false));
  }, [planId]);

  useEffect(() => {
    if (!plan || !window.MercadoPago || method !== "card" || initialized.current) return;
    initialized.current = true;
    const mp = new window.MercadoPago(MP_PUBLIC_KEY, { locale: "pt-BR" });
    const bricksBuilder = mp.bricks();
    bricksBuilder.create("cardPayment", "cardPaymentBrick", {
      initialization: { amount: plan.price },
      customization: {
        visual: { hideFormTitle: true },
        paymentMethods: { installments: { max: 1 } },
      },
      callbacks: {
        onReady: () => {},
        onSubmit: (cardFormData) => {
          return new Promise((resolve, reject) => {
            setProcessing(true);
            setErr("");
            const cardTokenId = cardFormData.token;
            const paymentMethodId = cardFormData.payment_method_id;
            if (!cardTokenId) {
              setErr("Erro ao gerar token do cartão");
              setProcessing(false);
              return reject();
            }
            fetch(`${API}/plans/guest-card-payment`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ planId, cardTokenId, paymentMethodId }),
            }).then(r => r.json()).then(res => {
              setProcessing(false);
              if (res.error) {
                setErr(res.error);
                reject();
              } else if (res.success) {
                navigate(`/register?plan=${planId}`);
                resolve();
              } else {
                setErr("Pagamento não aprovado. Tente novamente.");
                reject();
              }
            }).catch(() => {
              setProcessing(false);
              setErr("Erro de conexão. Tente novamente.");
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
  }, [plan, method]);

  const handlePixBoleto = async () => {
    setProcessing(true);
    setErr("");
    try {
      const r = await fetch(`${API}/plans/guest-checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const data = await r.json();
      if (data.error) { setErr(data.error); setProcessing(false); return; }
      window.location.href = data.url;
    } catch {
      setErr("Erro ao criar checkout");
      setProcessing(false);
    }
  };

  if (loading) return <div className="min-h-[70vh] flex items-center justify-center"><Loader className="animate-spin text-emerald-600" size={32} /></div>;

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">
        <Link to="/planos" className="text-emerald-600 hover:text-emerald-700 flex items-center gap-1 mb-4 text-sm">
          <ArrowLeft size={16} /> Voltar para planos
        </Link>
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Finalizar compra</h1>
          {plan && <p className="text-gray-500 mt-1">{plan.name} — R$ {plan.price.toFixed(2)}/mês</p>}
        </div>

        {err && <p className="text-red-600 text-sm mb-4 text-center">{err}</p>}

        <div className="flex gap-2 mb-6">
          <button onClick={() => { setMethod("card"); initialized.current = false; setErr(""); }}
            className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 font-medium transition ${method === "card" ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            <CreditCard size={18} /> Cartão
          </button>
          <button onClick={() => { setMethod("pix"); setErr(""); }}
            className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 font-medium transition ${method === "pix" ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            <QrCode size={18} /> Pix
          </button>
          <button onClick={() => { setMethod("boleto"); setErr(""); }}
            className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 font-medium transition ${method === "boleto" ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            <Barcode size={18} /> Boleto
          </button>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          {method === "card" && <div id="cardPaymentBrick" />}
          {(method === "pix" || method === "boleto") && (
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                Você será redirecionado para o Mercado Pago para pagar via {method === "pix" ? "Pix" : "Boleto"}.
              </p>
              {processing ? (
                <Loader className="animate-spin text-emerald-600 mx-auto" size={32} />
              ) : (
                <button onClick={handlePixBoleto} className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-emerald-700 transition">
                  Pagar com {method === "pix" ? "Pix" : "Boleto"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
