import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { API } from "../config";
import { Loader, CheckCircle, Upload, Camera, FileText } from "lucide-react";

export default function RegisterAfterPayment() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const planId = searchParams.get("plan");
  const [plan, setPlan] = useState(null);
  const [step, setStep] = useState(1);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: "", email: "", password: "", confirmPassword: "",
    phone: "", cpf: "", city: "", state: "", street: "", number: "", neighborhood: "",
  });

  const [rgFile, setRgFile] = useState(null);
  const [selfieFile, setSelfieFile] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [rgPreview, setRgPreview] = useState("");
  const [selfiePreview, setSelfiePreview] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");

  useEffect(() => {
    if (!planId) { setLoading(false); return; }
    fetch(`${API}/plans`).then(r => r.json()).then(plans => {
      const p = plans.find(pl => pl.id === planId);
      if (p) setPlan(p);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [planId]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleFile = (setter, setPreview) => (e) => {
    const f = e.target.files?.[0];
    if (f) { setter(f); setPreview(URL.createObjectURL(f)); }
  };

  const uploadFile = async (file) => {
    const fd = new FormData();
    fd.append("files", file);
    const r = await fetch(`${API}/upload/public`, { method: "POST", body: fd });
    const data = await r.json();
    if (!r.ok || !data.urls?.[0]) throw new Error(data.error || "Upload falhou");
    return data.urls[0];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    if (form.password !== form.confirmPassword) { setErr("Senhas não conferem"); return; }
    if (form.password.length < 6) { setErr("Senha deve ter pelo menos 6 caracteres"); return; }
    setSubmitting(true);
    try {
      let rgUrl = "", selfieUrl = "", avatarUrl = "";
      if (rgFile) rgUrl = await uploadFile(rgFile);
      if (selfieFile) selfieUrl = await uploadFile(selfieFile);
      if (avatarFile) avatarUrl = await uploadFile(avatarFile);

      const r = await fetch(`${API}/auth/complete-registration`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form, rgDocument: rgUrl, selfie: selfieUrl, avatar: avatarUrl,
          planId: planId || undefined,
        }),
      });
      const data = await r.json();
      if (data.error) { setErr(data.error); setSubmitting(false); return; }
      localStorage.setItem("token", data.token);
      navigate("/dashboard");
    } catch {
      setErr("Erro ao finalizar cadastro. Tente novamente.");
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-[70vh] flex items-center justify-center"><Loader className="animate-spin text-emerald-600" size={32} /></div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center px-4 py-8">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <CheckCircle size={40} className="text-emerald-600 mx-auto mb-2" />
          <h1 className="text-2xl font-bold text-gray-800">Finalizar cadastro</h1>
          {plan && <p className="text-gray-500 mt-1">Plano {plan.name} — R$ {plan.price.toFixed(2)}/mês</p>}
          <p className="text-gray-400 text-sm mt-1">Preencha seus dados para ativar sua conta</p>
        </div>

        {err && <p className="text-red-600 text-sm mb-4 text-center">{err}</p>}

        <div className="flex gap-2 mb-6">
          <button onClick={() => setStep(1)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${step === 1 ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-500"}`}>Dados</button>
          <button onClick={() => setStep(2)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${step === 2 ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-500"}`}>Endereço</button>
          <button onClick={() => setStep(3)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${step === 3 ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-500"}`}>Documentos</button>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow space-y-4">
          {step === 1 && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo</label>
                <input name="name" value={form.name} onChange={handleChange} required className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" name="email" value={form.email} onChange={handleChange} required className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                <input type="password" name="password" value={form.password} onChange={handleChange} required className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar senha</label>
                <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} required className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                <input name="phone" value={form.phone} onChange={handleChange} placeholder="(11) 99999-9999" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
                <input name="cpf" value={form.cpf} onChange={handleChange} placeholder="000.000.000-00" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CEP</label>
                <input name="zipCode" placeholder="00000-000" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rua</label>
                <input name="street" value={form.street} onChange={handleChange} required className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
                  <input name="number" value={form.number} onChange={handleChange} required className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bairro</label>
                  <input name="neighborhood" value={form.neighborhood} onChange={handleChange} required className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
                  <input name="city" value={form.city} onChange={handleChange} required className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                  <input name="state" value={form.state} onChange={handleChange} required maxLength={2} placeholder="SP" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Documento (RG ou CNH)</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-emerald-500 transition" onClick={() => document.getElementById("rgFile").click()}>
                  {rgPreview ? <img src={rgPreview} className="max-h-32 mx-auto rounded" /> : <><FileText size={32} className="text-gray-400 mx-auto mb-1" /><p className="text-sm text-gray-500">Clique para enviar foto do documento</p></>}
                </div>
                <input id="rgFile" type="file" accept="image/*" className="hidden" onChange={handleFile(setRgFile, setRgPreview)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Selfie (foto do rosto)</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-emerald-500 transition" onClick={() => document.getElementById("selfieFile").click()}>
                  {selfiePreview ? <img src={selfiePreview} className="max-h-32 mx-auto rounded" /> : <><Camera size={32} className="text-gray-400 mx-auto mb-1" /><p className="text-sm text-gray-500">Clique para tirar/ enviar selfie</p></>}
                </div>
                <input id="selfieFile" type="file" accept="image/*" className="hidden" onChange={handleFile(setSelfieFile, setSelfiePreview)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Foto de perfil</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-emerald-500 transition" onClick={() => document.getElementById("avatarFile").click()}>
                  {avatarPreview ? <img src={avatarPreview} className="max-h-32 mx-auto rounded-full w-32 h-32 object-cover" /> : <><Upload size={32} className="text-gray-400 mx-auto mb-1" /><p className="text-sm text-gray-500">Clique para escolher foto de perfil</p></>}
                </div>
                <input id="avatarFile" type="file" accept="image/*" className="hidden" onChange={handleFile(setAvatarFile, setAvatarPreview)} />
              </div>
            </>
          )}

          <div className="flex gap-3 pt-2">
            {step > 1 && (
              <button type="button" onClick={() => setStep(step - 1)} className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-200 transition">
                Voltar
              </button>
            )}
            {step < 3 ? (
              <button type="button" onClick={() => setStep(step + 1)} className="flex-1 bg-emerald-600 text-white py-2.5 rounded-lg font-medium hover:bg-emerald-700 transition">
                Próximo
              </button>
            ) : (
              <button type="submit" disabled={submitting} className="flex-1 bg-emerald-600 text-white py-2.5 rounded-lg font-medium hover:bg-emerald-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
                {submitting ? <><Loader className="animate-spin" size={18} /> Criando conta...</> : "Criar conta e ativar plano"}
              </button>
            )}
          </div>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          Já tem conta? <Link to="/login" className="text-emerald-600 hover:underline">Fazer login</Link>
        </p>
      </div>
    </div>
  );
}
