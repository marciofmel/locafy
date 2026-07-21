import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Loader, Camera, Upload, User } from "lucide-react";
import { API } from "../config";

export default function Profile() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", phone: "", cpf: "", city: "", state: "", street: "", number: "", neighborhood: "" });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    if (!user) return;
    setForm({ name: user.name || "", phone: user.phone || "", cpf: user.cpf || "", city: user.city || "", state: user.state || "", street: user.street || "", number: user.number || "", neighborhood: user.neighborhood || "" });
    if (user.avatar) setAvatarPreview(user.avatar);
  }, [user, token]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    try {
      let avatarUrl = user.avatar;
      if (avatarFile) {
        const fd = new FormData();
        fd.append("files", avatarFile);
        const r = await fetch(`${API}/upload`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd });
        const d = await r.json();
        if (r.ok && d.urls?.[0]) avatarUrl = d.urls[0];
      }

      const r = await fetch(`${API}/auth/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, avatar: avatarUrl }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      setMsg("Perfil atualizado!");
      if (avatarUrl) setAvatarPreview(avatarUrl);
    } catch (err) {
      setMsg("Erro: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  if (!user) return <div className="min-h-[70vh] flex items-center justify-center"><Loader className="animate-spin text-emerald-600" size={32} /></div>;

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Editar perfil</h1>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow space-y-4">
        {msg && <p className={`text-sm text-center ${msg.startsWith("Erro") ? "text-red-500" : "text-emerald-600"}`}>{msg}</p>}

        <div className="flex items-center gap-4 mb-4">
          {avatarPreview ? (
            <img src={avatarPreview} className="w-20 h-20 rounded-full object-cover border" />
          ) : (
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-gray-400"><User size={32} /></div>
          )}
          <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 rounded-lg px-4 py-2 text-sm text-gray-600 transition">
            <Upload size={16} className="inline mr-1" /> Trocar foto
            <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { setAvatarFile(f); setAvatarPreview(URL.createObjectURL(f)); } }} />
          </label>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
            <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
            <input value={form.cpf} onChange={e => setForm({ ...form, cpf: e.target.value })} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Rua</label>
            <input value={form.street} onChange={e => setForm({ ...form, street: e.target.value })} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
            <input value={form.number} onChange={e => setForm({ ...form, number: e.target.value })} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bairro</label>
            <input value={form.neighborhood} onChange={e => setForm({ ...form, neighborhood: e.target.value })} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
            <input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <input maxLength={2} value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
        </div>

        <button type="submit" disabled={saving} className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
          {saving ? <><Loader size={18} className="animate-spin" /> Salvando...</> : "Salvar alterações"}
        </button>
      </form>
    </div>
  );
}
