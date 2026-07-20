import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { MessageCircle, MapPin, ArrowLeft, Check, Heart } from "lucide-react";
import { useAuth } from "../context/AuthContext";

import { API, imgUrl } from "../config";

export default function ListingDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [item, setItem] = useState(null);
  const [favorited, setFavorited] = useState(false);

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

  const whatsappLink = `https://wa.me/${item.whatsapp?.replace(/\D/g, "")}?text=Olá! Tenho interesse no anúncio: ${item.title}`;

  const isVehicle = item.category?.slug === "carros" || item.category?.slug === "motos";

  function handleContact() {
    if (!user) { window.location.href = "/login"; return; }
    // Veículos: exige CNH
    if (isVehicle && !user.cnh) {
      window.location.href = `/documentos?return=/anuncio/${id}`;
      return;
    }
    // Demais categorias: exige RG + selfie (coletados no cadastro)
    if (!isVehicle && (!user.rgDocument || !user.selfie)) {
      window.location.href = `/documentos?return=/anuncio/${id}`;
      return;
    }
    window.open(whatsappLink, "_blank");
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
    </div>
  );
}
