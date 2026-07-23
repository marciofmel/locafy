import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { Plus, Edit, Trash2, LogIn, Loader, BarChart3 } from "lucide-react";

import { API } from "../config";

export default function Dashboard() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subInfo, setSubInfo] = useState(null);

  useEffect(() => {
    if (!token) return navigate("/login");
    Promise.all([fetchListings(), fetchUserInfo()]);
  }, [token]);

  async function fetchListings() {
    try {
      const res = await fetch(`${API}/listings/my/listings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setListings(await res.json());
    } finally {
      setLoading(false);
    }
  }

  async function fetchUserInfo() {
    try {
      const res = await fetch(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSubInfo(data.subscription);
      }
    } catch {}
  }

  const canFeature = subInfo?.plan?.price >= 49.99;

  async function deleteListing(id) {
    if (!confirm("Tem certeza?")) return;
    await fetch(`${API}/listings/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchListings();
    fetchUserInfo();
  }

  async function toggleFeature(id) {
    await fetch(`${API}/listings/${id}/destacar`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchListings();
  }

  const planLimit = subInfo ? subInfo.plan.maxListings + subInfo.extraListings : 0;
  const listingsCount = listings.filter(l => l.active).length;
  const usagePercent = planLimit > 0 ? Math.round((listingsCount / planLimit) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Meus Anúncios</h1>
          <p className="text-gray-500">Olá, {user?.name}</p>
        </div>
        <Link to="/anunciar" className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-emerald-700 transition">
          <Plus size={20} /> Novo Anúncio
        </Link>
      </div>

      {subInfo && (
        <div className="bg-white p-4 rounded-xl shadow mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <BarChart3 size={18} className="text-emerald-600" />
              <span className="font-semibold text-gray-800">{subInfo.plan.name}</span>
            </div>
            <span className="text-sm text-gray-500">{listingsCount}/{planLimit} anúncios</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-emerald-600 h-2 rounded-full transition-all" style={{ width: `${Math.min(usagePercent, 100)}%` }} />
          </div>
        </div>
      )}

      {!subInfo && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
          <p className="text-yellow-800">Você precisa de uma assinatura para anunciar.</p>
          <Link to="/planos" className="text-emerald-600 font-semibold hover:underline">Ver planos →</Link>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader className="animate-spin text-emerald-600" size={32} /></div>
      ) : listings.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">Nenhum anúncio ainda</p>
          <p className="text-sm mt-2">Assine um plano e comece a anunciar!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {listings.map(item => (
            <div key={item.id} className="bg-white p-4 rounded-xl shadow flex items-center gap-4">
              <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
                {item.images?.[0] ? <img src={item.images[0]} className="w-full h-full object-cover rounded-lg" /> : "📷"}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-800 truncate">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.category?.name} • R$ {item.price.toFixed(2)}/{item.priceType === "daily" ? "dia" : "mês"}</p>
              </div>
              <div className="flex gap-2 items-center">
                {canFeature && (
                  <button onClick={() => toggleFeature(item.id)} className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${item.featured ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                    {item.featured ? "Destacado" : "Destacar"}
                  </button>
                )}
                <Link to={`/editar/${item.id}`} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit size={20} /></Link>
                <button onClick={() => deleteListing(item.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={20} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
