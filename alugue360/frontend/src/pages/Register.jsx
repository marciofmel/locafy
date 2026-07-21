import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Camera, IdCard, Loader, Upload, User, Info } from "lucide-react";
import { API } from "../config";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const planId = searchParams.get("plan");
  const [plan, setPlan] = useState(null);
  const [form, setForm] = useState({
    name: "", email: "", phone: "", password: "",
    cpf: "", city: "", state: "", street: "", number: "", neighborhood: "",
  });
  const [selfieFile, setSelfieFile] = useState(null);
  const [selfiePreview, setSelfiePreview] = useState(null);
  const [rgFile, setRgFile] = useState(null);
  const [rgPreview, setRgPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!planId) return;
    fetch(`${API}/plans`).then(r => r.json()).then(plans => {
      setPlan(plans.find(p => p.id === planId));
    }).catch(() => {});
  }, [planId]);

  function handleSelfie(e) {
    const file = e.target.files?.[0];
    if (file) { setSelfieFile(file); setSelfiePreview(URL.createObjectURL(file)); }
  }

  function handleRg(e) {
    const file = e.target.files?.[0];
    if (file) { setRgFile(file); setRgPreview(URL.createObjectURL(file)); }
  }

  function handleAvatar(e) {
    const file = e.target.files?.[0];
    if (file) { setAvatarFile(file); setAvatarPreview(URL.createObjectURL(file)); }
  }

  async function uploadFile(file) {
    const fd = new FormData();
    fd.append("files", file);
    const res = await fetch(`${API}/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      body: fd,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Erro ao enviar arquivo");
    return data.urls?.[0];
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setUploading(true);
    try {
      let selfieUrl = "", rgUrl = "", avatarUrl = "";

      const res = await fetch(`${API}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          selfie: selfieUrl || undefined,
          rgDocument: rgUrl || undefined,
          avatar: avatarUrl || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      localStorage.setItem("token", data.token);

      // Upload files after user is created (now has token)
      if (selfieFile) selfieUrl = await uploadFile(selfieFile);
      if (rgFile) rgUrl = await uploadFile(rgFile);
      if (avatarFile) avatarUrl = await uploadFile(avatarFile);

      if (selfieUrl || rgUrl || avatarUrl) {
        await fetch(`${API}/auth/documents`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ selfie: selfieUrl, rgDocument: rgUrl, avatar: avatarUrl, docStatus: "pending" }),
        });
      }

      if (planId) {
        window.location.href = `/checkout/${planId}`;
      } else {
        navigate("/");
      }
    } catch (err) {
      setError(err.message);
      setUploading(false);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-2 text-center">Criar sua conta</h1>
      {plan && <p className="text-center text-gray-500 mb-6">Plano {plan.name} — R$ {plan.price.toFixed(2)}/mês</p>}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow space-y-4">
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <h2 className="font-semibold text-gray-700 border-b pb-2">Dados pessoais</h2>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo</label>
            <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
            <input type="tel" required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="(11) 99999-8888" className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
            <input type="password" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
            <input value={form.cpf} onChange={e => setForm({ ...form, cpf: e.target.value })} placeholder="000.000.000-00" className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
        </div>

        <h2 className="font-semibold text-gray-700 border-b pb-2 pt-2">Endereço</h2>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Rua</label>
            <input required value={form.street} onChange={e => setForm({ ...form, street: e.target.value })} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
            <input required value={form.number} onChange={e => setForm({ ...form, number: e.target.value })} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bairro</label>
            <input required value={form.neighborhood} onChange={e => setForm({ ...form, neighborhood: e.target.value })} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
            <input required value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <input required maxLength={2} placeholder="SP" value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
        </div>

        <h2 className="font-semibold text-gray-700 border-b pb-2 pt-2">
          Documentos e fotos
        </h2>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
          <Info size={20} className="text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Por que pedimos seus documentos?</p>
            <p>Para anunciar imóveis, veículos ou espaços, precisamos verificar sua identidade. Isso garante mais segurança para todos os usuários da plataforma e evita anúncios falsos. Seus documentos são armazenados com segurança e apenas nossa equipe terá acesso.</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Foto de perfil</label>
            <div className="flex flex-col items-center gap-2">
              {avatarPreview ? (
                <img src={avatarPreview} className="w-24 h-24 object-cover rounded-full border" />
              ) : (
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center text-gray-400"><User size={32} /></div>
              )}
              <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 rounded-lg px-3 py-2 text-xs text-gray-600 transition w-full text-center">
                <Upload size={14} className="inline mr-1" /> Escolher foto
                <input type="file" accept="image/*" onChange={handleAvatar} className="hidden" />
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Selfie (rosto)</label>
            <div className="flex flex-col items-center gap-2">
              {selfiePreview ? (
                <img src={selfiePreview} className="w-24 h-24 object-cover rounded-lg border" />
              ) : (
                <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400"><Camera size={32} /></div>
              )}
              <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 rounded-lg px-3 py-2 text-xs text-gray-600 transition w-full text-center">
                <Camera size={14} className="inline mr-1" /> Selfie
                <input type="file" accept="image/*" capture="user" onChange={handleSelfie} className="hidden" />
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">RG ou CNH</label>
            <div className="flex flex-col items-center gap-2">
              {rgPreview ? (
                <img src={rgPreview} className="w-24 h-24 object-cover rounded-lg border" />
              ) : (
                <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400"><IdCard size={32} /></div>
              )}
              <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 rounded-lg px-3 py-2 text-xs text-gray-600 transition w-full text-center">
                <Camera size={14} className="inline mr-1" /> Documento
                <input type="file" accept="image/*" capture="environment" onChange={handleRg} className="hidden" />
              </label>
            </div>
          </div>
        </div>

        <button type="submit" disabled={uploading} className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition disabled:opacity-50 flex items-center justify-center gap-2 mt-4">
          {uploading ? <><Loader size={18} className="animate-spin" /> Criando conta...</> : planId ? "Cadastrar e continuar para pagamento" : "Cadastrar"}
        </button>

        <p className="text-center text-sm text-gray-500">Já tem conta? <Link to="/login" className="text-emerald-600 hover:underline">Entrar</Link></p>
      </form>
    </div>
  );
}
