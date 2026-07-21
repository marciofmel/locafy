import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Check, Sparkles } from "lucide-react";

import { API } from "../config";

const plans = [
  { name: "Teste", price: "1,00", listings: 1, features: ["1 anúncio", "Apenas para testes"], color: "bg-yellow-50 border-yellow-300", btn: "bg-yellow-500" },
  { name: "Básico", price: "29,99", listings: 2, features: ["2 anúncios inclusos", "Fotos ilimitadas", "WhatsApp direto", "R$15 por anúncio extra"], color: "bg-gray-100", btn: "bg-gray-600" },
  { name: "Profissional", price: "49,99", listings: 6, features: ["6 anúncios inclusos", "Fotos ilimitadas", "WhatsApp direto", "Destaque por 7 dias", "R$15 por anúncio extra"], color: "bg-emerald-50 border-emerald-300", btn: "bg-emerald-600", popular: true },
  { name: "Premium", price: "89,99", listings: 12, features: ["12 anúncios inclusos", "Fotos ilimitadas", "WhatsApp direto", "Destaque permanente", "Suporte prioritário", "R$15 por anúncio extra"], color: "bg-purple-50 border-purple-300", btn: "bg-purple-600" },
];

export default function Plans() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dbPlans, setDbPlans] = useState([]);
  const [loading, setLoading] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    fetch(`${API}/plans`).then(r => r.json()).then(setDbPlans).catch(() => setErr("Erro ao carregar planos"));
  }, []);

  function subscribe(planId) {
    if (!planId) return setErr("Plano indisponível");
    if (user) return navigate(`/payment/card/${planId}`);
    navigate(`/checkout/${planId}`);
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-800">Escolha seu plano</h1>
        <p className="text-gray-500 mt-2">Anuncie imóveis, veículos e espaços para eventos</p>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        {plans.map((plan, i) => (
          <div key={i} className={`relative rounded-2xl border-2 p-6 ${plan.color} ${plan.popular ? "border-emerald-500 shadow-lg scale-105" : "border-gray-200"}`}>
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-4 py-1 rounded-full text-sm flex items-center gap-1">
                <Sparkles size={16} /> Mais escolhido
              </div>
            )}
            <h3 className="text-xl font-bold text-gray-800 mt-2">{plan.name}</h3>
            <div className="mt-4">
              <span className="text-4xl font-bold text-gray-800">R$ {plan.price}</span>
              <span className="text-gray-500">/mês</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">até {plan.listings} anúncios</p>
            <ul className="mt-6 space-y-3">
              {plan.features.map((f, j) => (
                <li key={j} className="flex items-center gap-2 text-gray-600"><Check size={18} className="text-emerald-600 flex-shrink-0" />{f}</li>
              ))}
            </ul>
            <button onClick={() => subscribe(dbPlans.find(p => p.name === plan.name)?.id)} disabled={loading !== null} className={`w-full mt-8 ${plan.btn} text-white py-3 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50`}>
              {loading === dbPlans.find(p => p.name === plan.name)?.id ? "Processando..." : "Assinar agora"}
            </button>
          </div>
        ))}
      </div>
      {err && <p className="text-red-600 text-center mt-6">{err}</p>}
    </div>
  );
}
