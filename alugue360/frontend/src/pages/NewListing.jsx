import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { Plus, X, Send, Upload, FileVideo, Loader, Sparkles, AlertTriangle } from "lucide-react";

import { API } from "../config";

export default function NewListing() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    title: "", categoryId: "", price: "", priceType: "daily",
    description: "", whatsapp: "", street: "", number: "", neighborhood: "", city: "", state: "",
  });
  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);
  const [features, setFeatures] = useState([]);
  const [featureInput, setFeatureInput] = useState("");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showExtraModal, setShowExtraModal] = useState(false);
  const [extraPaying, setExtraPaying] = useState(false);

  useEffect(() => {
    if (!token) return navigate("/login");
    fetch(`${API}/categories`).then(r => r.json()).then(data => {
      setCategories(data);
    }).catch(() => {});
  }, [token]);

  async function uploadFiles(files, type) {
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      for (const f of files) formData.append("files", f);
      const res = await fetch(`${API}/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao enviar");
      if (type === "image") setImages(prev => [...prev, ...data.urls]);
      else setVideos(prev => [...prev, ...data.urls]);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch(`${API}/listings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
          price: parseFloat(form.price),
          images,
          videos,
          features,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw data;
      navigate("/dashboard");
    } catch (err) {
      if (err.error === "Assinatura necessária para anunciar") {
        setShowPlanModal(true);
      } else if (err.extraPaymentRequired) {
        setShowExtraModal(true);
      } else {
        setError(err.error || "Erro ao criar anúncio");
      }
    }
  }

  async function handleExtraPayment() {
    setExtraPaying(true);
    try {
      const res = await fetch(`${API}/listings/extra-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else setError("Erro ao gerar pagamento");
    } catch {
      setError("Erro de conexão");
    } finally {
      setExtraPaying(false);
      setShowExtraModal(false);
    }
  }

  function addFeature() {
    const f = featureInput.trim();
    if (f && !features.includes(f)) setFeatures([...features, f]);
    setFeatureInput("");
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Novo Anúncio</h1>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow space-y-4">
        {error && <p className="text-red-500 text-sm">{error}</p>}
        {uploading && <p className="text-emerald-600 text-sm flex items-center gap-2"><Loader size={16} className="animate-spin" /> Enviando arquivos...</p>}

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
            <input type="text" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
            <select required value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 bg-white">
              <option value="">Selecione</option>
              {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Preço (R$)</label>
            <input type="number" step="0.01" required value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de preço</label>
            <select value={form.priceType} onChange={e => setForm({ ...form, priceType: e.target.value })} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 bg-white">
              <option value="daily">Por dia</option>
              <option value="monthly">Por mês</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
          <textarea rows={4} required value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fotos</label>
          <div className="flex flex-wrap gap-3 mb-3">
            {images.map((url, i) => (
              <div key={i} className="relative w-24 h-24">
                <img src={url} className="w-full h-full object-cover rounded-lg border" />
                <button type="button" onClick={() => setImages(images.filter((_, idx) => idx !== i))} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"><X size={14} /></button>
              </div>
            ))}
            <label className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500 text-gray-400 hover:text-emerald-600">
              <Upload size={20} />
              <span className="text-xs mt-1">Add foto</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={e => { if (e.target.files?.length) uploadFiles(e.target.files, "image"); e.target.value = ""; }} />
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Vídeos</label>
          <div className="flex flex-wrap gap-3 mb-3">
            {videos.map((url, i) => (
              <div key={i} className="relative w-32 h-24">
                <video src={url} className="w-full h-full object-cover rounded-lg border" controls />
                <button type="button" onClick={() => setVideos(videos.filter((_, idx) => idx !== i))} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"><X size={14} /></button>
              </div>
            ))}
            <label className="w-32 h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500 text-gray-400 hover:text-emerald-600">
              <FileVideo size={20} />
              <span className="text-xs mt-1">Add vídeo</span>
              <input type="file" accept="video/*" multiple className="hidden" onChange={e => { if (e.target.files?.length) uploadFiles(e.target.files, "video"); e.target.value = ""; }} />
            </label>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
            <input type="tel" required value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })} placeholder="(11) 99999-8888" className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
            <input type="text" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <input type="text" value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} maxLength={2} placeholder="SP" className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rua</label>
            <input type="text" value={form.street} onChange={e => setForm({ ...form, street: e.target.value })} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
            <input type="text" value={form.number} onChange={e => setForm({ ...form, number: e.target.value })} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bairro</label>
            <input type="text" value={form.neighborhood} onChange={e => setForm({ ...form, neighborhood: e.target.value })} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Itens inclusos</label>
          <div className="flex gap-2 mb-2 flex-wrap">
            {features.map((f, i) => (
              <span key={i} className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                {f} <button type="button" onClick={() => setFeatures(features.filter((_, idx) => idx !== i))} className="hover:text-red-600"><X size={14} /></button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={featureInput} onChange={e => setFeatureInput(e.target.value)} onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addFeature())} placeholder="Ex: Wi-Fi, Piscina, Ar condicionado" className="flex-1 px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500" />
            <button type="button" onClick={addFeature} className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition"><Plus size={20} /></button>
          </div>
        </div>

        <button type="submit" disabled={uploading} className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-emerald-700 transition text-lg disabled:opacity-50">
          <Send size={20} /> Publicar Anúncio
        </button>
      </form>

      {showPlanModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowPlanModal(false)}>
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <button type="button" onClick={() => setShowPlanModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={20} /></button>
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4"><Sparkles size={32} className="text-emerald-600" /></div>
              <h2 className="text-xl font-bold text-gray-800">Assine um plano</h2>
              <p className="text-gray-500 mt-2">Você precisa de uma assinatura para criar anúncios. Escolha o plano ideal para você!</p>
              <Link to="/planos" onClick={() => setShowPlanModal(false)} className="block w-full mt-6 bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition">Ver planos</Link>
              <button type="button" onClick={() => setShowPlanModal(false)} className="mt-3 text-sm text-gray-500 hover:text-gray-700">Agora não</button>
            </div>
          </div>
        </div>
      )}

      {showExtraModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowExtraModal(false)}>
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <button type="button" onClick={() => setShowExtraModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={20} /></button>
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4"><AlertTriangle size={32} className="text-amber-600" /></div>
              <h2 className="text-xl font-bold text-gray-800">Limite atingido</h2>
              <p className="text-gray-500 mt-2">Você já usou todos os anúncios do seu plano. Publique um anúncio extra por apenas <strong>R$ 15</strong>.</p>
              <button onClick={handleExtraPayment} disabled={extraPaying} className="block w-full mt-6 bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition disabled:opacity-50">
                {extraPaying ? "Redirecionando..." : "Pagar R$ 15 e publicar"}
              </button>
              <button type="button" onClick={() => setShowExtraModal(false)} className="mt-3 text-sm text-gray-500 hover:text-gray-700">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
