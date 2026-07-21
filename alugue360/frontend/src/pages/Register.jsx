import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { Camera, IdCard, Loader } from "lucide-react";

import { API } from "../config";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [selfieFile, setSelfieFile] = useState(null);
  const [selfiePreview, setSelfiePreview] = useState(null);
  const [rgFile, setRgFile] = useState(null);
  const [rgPreview, setRgPreview] = useState(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  function handleSelfie(e) {
    const file = e.target.files?.[0];
    if (file) {
      setSelfieFile(file);
      setSelfiePreview(URL.createObjectURL(file));
    }
  }

  function handleRg(e) {
    const file = e.target.files?.[0];
    if (file) {
      setRgFile(file);
      setRgPreview(URL.createObjectURL(file));
    }
  }

  async function uploadFile(file) {
    const formData = new FormData();
    formData.append("files", file);
    const res = await fetch(`${API}/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      body: formData,
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
      // 1. Cadastrar usuário
      await register(form.name, form.email, form.phone, form.password);

      // 2. Upload selfie
      let selfieUrl = null;
      if (selfieFile) {
        try {
          selfieUrl = await uploadFile(selfieFile);
        } catch (err) {
          console.warn("Selfie upload falhou:", err.message);
        }
      }

      // 3. Upload RG
      let rgUrl = null;
      if (rgFile) {
        try {
          rgUrl = await uploadFile(rgFile);
        } catch (err) {
          console.warn("RG upload falhou:", err.message);
        }
      }

      // 4. Salvar documentos
      if (selfieUrl || rgUrl) {
        const body = { docStatus: "pending" };
        if (selfieUrl) body.selfie = selfieUrl;
        if (rgUrl) body.rgDocument = rgUrl;

        await fetch(`${API}/auth/documents`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(body),
        });
      }

      // 5. Ir pra home
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">Criar conta</h1>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow space-y-4">
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        {/* Dados básicos */}
        <div>
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

        {/* Selfie */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Selfie (foto do seu rosto)</label>
          <div className="flex items-center gap-4">
            {selfiePreview ? (
              <img src={selfiePreview} className="w-20 h-20 object-cover rounded-lg border" />
            ) : (
              <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400"><Camera size={24} /></div>
            )}
            <label className="flex-1 cursor-pointer bg-gray-100 hover:bg-gray-200 rounded-lg px-4 py-3 text-center text-sm text-gray-600 transition">
              <Camera size={18} className="inline mr-1" /> Tirar selfie
              <input type="file" accept="image/*" capture="user" onChange={handleSelfie} className="hidden" />
            </label>
          </div>
        </div>

        {/* RG */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Documento de identidade (RG)</label>
          <div className="flex items-center gap-4">
            {rgPreview ? (
              <img src={rgPreview} className="w-20 h-20 object-cover rounded-lg border" />
            ) : (
              <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400"><IdCard size={24} /></div>
            )}
            <label className="flex-1 cursor-pointer bg-gray-100 hover:bg-gray-200 rounded-lg px-4 py-3 text-center text-sm text-gray-600 transition">
              <Camera size={18} className="inline mr-1" /> Foto do RG
              <input type="file" accept="image/*" capture="environment" onChange={handleRg} className="hidden" />
            </label>
          </div>
        </div>

        <p className="text-xs text-gray-400">* A CNH será solicitada apenas se você quiser alugar carro ou moto.</p>

        <button type="submit" disabled={uploading} className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
          {uploading ? <><Loader size={18} className="animate-spin" /> Criando conta...</> : "Cadastrar"}
        </button>

        <p className="text-center text-sm text-gray-500">Já tem conta? <Link to="/login" className="text-emerald-600 hover:underline">Entrar</Link></p>
      </form>
    </div>
  );
}
