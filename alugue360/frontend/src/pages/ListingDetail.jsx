import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { MessageCircle, MapPin, ArrowLeft, Check, Heart, Camera, X, Loader, Info } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { API, imgUrl } from "../config";

export default function ListingDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [item, setItem] = useState(null);
  const [favorited, setFavorited] = useState(false);
  const [showCnhModal, setShowCnhModal] = useState(false);
  const [cnhFile, setCnhFile] = useState(null);
  const [cnhPreview, setCnhPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [cnhError, setCnhError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    fetch(`${API}/listings/${id}`, { headers }).then(r => r.json()).then(setItem);
  }, [id]);

  useEffect(() => {
    if (!user) return;
    fetch(`${API}/favorites`, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } })
      .then(r => r.json())
      .then(list => setFavorited(list.some(l => l.id === id)))
      .catch(() => {});
  }, [user, id]);

  async function toggleFavorite() {
    if (!user) return;
    const token = localStorage.getItem("token");
    const res = await fetch(`${API}/favorites/${id}`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setFavorited(data.favorited);
  }

  if (!item) return <div className="text-center py-20 text-gray-500">Carregando...</div>;

  const isVehicle = item.category?.slug === "carros" || item.category?.slug === "motos";

  const msg = `Olá! Tenho interesse no anúncio:%0A%0A*${item.title}*%0A💰 R$ ${item.price.toFixed(2)}/${item.priceType === "daily" ? "dia" : "mês"}${item.city ? `%0A📍 ${item.city}${item.state ? ` - ${item.state}` : ""}` : ""}%0A%0A${window.location.href}%0A%0AContato: ${user?.name || "Visitante"}`;
  const whatsappLink = `https://wa.me/${item.whatsapp?.replace(/\D/g, "")}?text=${msg}`;

  function handleContact() {
    if (!user) { window.location.href = "/login"; return; }
    if (isVehicle && !user.cnh) {
      setShowCnhModal(true);
      return;
    }
    if (!isVehicle && (!user.rgDocument || !user.selfie)) {
      window.location.href = `/documentos?return=/anuncio/${id}`;
      return;
    }
    window.open(whatsappLink, "_blank");
  }

  function handleCnhFile(e) {
    const file = e.target.files?.[0];
    if (file) { setCnhFile(file); setCnhPreview(URL.createObjectURL(file)); }
  }

  async function handleCnhSubmit() {
    if (!cnhFile) return;
    setUploading(true);
    setCnhError("");
    try {
      const fd = new FormData();
      fd.append("files", cnhFile);
      const uploadRes = await fetch(`${API}/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: fd,
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error || "Erro ao enviar CNH");

      await fetch(`${API}/auth/documents`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ cnh: uploadData.urls[0], docStatus: "pending" }),
      });

      setShowCnhModal(false);
      setCnhFile(null);
      setCnhPreview(null);
      window.open(whatsappLink, "_blank");
    } catch (err) {
      setCnhError(err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link to="/" className="flex items-center gap-2 text-emerald-600 hover:underline mb-6"><ArrowLeft size={20} /> Voltar</Link>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <div className="h-80 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 text-6xl">
            {item.images?.[0] ? <img src={imgUrl(item.images[0])} onError={e => { e.target.style.display = "none"; e.target.parentElement.textContent = "📷"; }} className="w-full h-full object-cover rounded-xl" /> : "📷"}
          </div>
          {item.images?.length > 1 && (
            <div className="flex gap-2 mt-2 overflow-x-auto">
              {item.images.map((img, i) => (
                <img key={i} src={imgUrl(img)} onError={e => { e.target.style.display = "none"; }} className="w-20 h-20 object-cover rounded-lg cursor-pointer hover:opacity-80" />
              ))}
            </div>
          )}
          {item.videos?.length > 0 && (
            <div className="mt-4">
              <h3 className="font-semibold text-gray-800 mb-2">Vídeos</h3>
              <div className="flex gap-2 overflow-x-auto">
                {item.videos.map((url, i) => (
                  <video key={i} src={imgUrl(url)} className="w-40 h-28 object-cover rounded-lg border" controls />
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between">
            <span className="text-sm bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">{item.category?.name}</span>
            {user && (
              <button onClick={toggleFavorite} className="flex items-center gap-1 text-sm hover:text-red-500 transition">
                <Heart size={20} className={favorited ? "text-red-500 fill-red-500" : "text-gray-400"} />
                {favorited ? "Salvo" : "Favoritar"}
              </button>
            )}
          </div>
          <h1 className="text-2xl font-bold mt-4 text-gray-800">{item.title}</h1>
          <p className="text-3xl font-bold text-emerald-600 mt-4">R$ {item.price.toFixed(2)} <span className="text-base font-normal text-gray-500">/{item.priceType === "daily" ? "dia" : "mês"}</span></p>

          {(item.city || item.state) && (
            <p className="text-gray-500 mt-2 flex items-center gap-1"><MapPin size={18} /> {item.city}{item.state ? ` - ${item.state}` : ""}</p>
          )}

          {item.street && <p className="text-gray-500 mt-1 text-sm">{item.street}{item.number ? `, ${item.number}` : ""}{item.neighborhood ? ` - ${item.neighborhood}` : ""}</p>}

          <p className="text-gray-700 mt-4">{item.description}</p>

          {item.features?.length > 0 && (
            <div className="mt-4">
              <h3 className="font-semibold text-gray-800 mb-2">Itens inclusos</h3>
              <div className="flex flex-wrap gap-2">
                {item.features.map((f, i) => (
                  <span key={i} className="flex items-center gap-1 text-sm bg-gray-100 px-3 py-1 rounded-full"><Check size={14} className="text-emerald-600" /> {f}</span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 space-y-3">
            <p className="text-sm text-gray-500">Anunciado por <strong>{item.user?.name}</strong></p>
            <button onClick={handleContact} className="w-full flex items-center justify-center gap-2 bg-green-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-600 transition text-lg">
              <MessageCircle size={24} /> Falar com o dono
            </button>
          </div>
        </div>
      </div>

      {showCnhModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 relative">
            <button onClick={() => { setShowCnhModal(false); setCnhFile(null); setCnhPreview(null); setCnhError(""); }} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>
            <h2 className="text-xl font-bold text-gray-800 mb-2">CNH necessária</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex gap-2 mb-4">
              <Info size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800">Para alugar {item.category?.name?.toLowerCase()}, precisamos da foto da sua CNH. Ela fica armazenada no app e <strong>não é enviada</strong> ao anunciante.</p>
            </div>
            {cnhError && <p className="text-red-500 text-sm mb-3">{cnhError}</p>}
            <div className="flex items-center gap-4 mb-4">
              {cnhPreview ? (
                <img src={cnhPreview} className="w-28 h-28 object-cover rounded-lg border" />
              ) : (
                <div className="w-28 h-28 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-4xl">🪪</div>
              )}
              <label className="flex-1 cursor-pointer bg-gray-100 hover:bg-gray-200 rounded-lg px-4 py-8 text-center text-sm text-gray-600 transition">
                <Camera size={24} className="mx-auto mb-1" />
                Foto da CNH
                <input type="file" accept="image/*" capture="environment" onChange={handleCnhFile} className="hidden" />
              </label>
            </div>
            <button onClick={handleCnhSubmit} disabled={uploading || !cnhFile} className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
              {uploading ? <><Loader size={18} className="animate-spin" /> Enviando...</> : "Enviar e falar com o dono"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
