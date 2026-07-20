import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { MapPin } from "lucide-react";

import { API, imgUrl } from "../config";

export default function Listings() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const [listings, setListings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filterCat, setFilterCat] = useState(slug || "");

  useEffect(() => {
    fetch(`${API}/listings`).then(r => r.json()).then(data => {
      setListings(data);
    });
    fetch(`${API}/listings?limit=0`).then(() => {
      setCategories([
        { slug: "casas", name: "Casas" },
        { slug: "carros", name: "Carros" },
        { slug: "motos", name: "Motos" },
        { slug: "ranchos", name: "Ranchos" },
        { slug: "saloes", name: "Salões" },
      ]);
    });
  }, []);

  const searchTerm = searchParams.get("search")?.toLowerCase() || "";
  const filtered = listings.filter(item => {
    const matchCat = !filterCat || filterCat === "todos" || item.category?.slug === filterCat;
    const matchSearch = !searchTerm || item.title.toLowerCase().includes(searchTerm) || item.description?.toLowerCase().includes(searchTerm);
    return matchCat && matchSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Anúncios disponíveis</h1>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <button onClick={() => setFilterCat("")} className={`px-4 py-2 rounded-full text-sm ${!filterCat ? "bg-emerald-600 text-white" : "bg-gray-200 text-gray-700"}`}>Todos</button>
        {categories.map(cat => (
          <button key={cat.slug} onClick={() => setFilterCat(cat.slug)} className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${filterCat === cat.slug ? "bg-emerald-600 text-white" : "bg-gray-200 text-gray-700"}`}>{cat.name}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-gray-500 py-12">Nenhum anúncio encontrado</p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(item => (
            <Link key={item.id} to={`/anuncio/${item.id}`} className="bg-white rounded-xl shadow overflow-hidden hover:shadow-lg transition">
              <div className="h-48 bg-gray-100 flex items-center justify-center text-gray-400 text-4xl">
                {item.images?.[0] ? <img src={imgUrl(item.images[0])} onError={e => { e.target.style.display = "none"; e.target.parentElement.textContent = "📷"; }} className="w-full h-full object-cover" /> : "📷"}
              </div>
              <div className="p-4">
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded">{item.category?.name}</span>
                <h3 className="font-semibold mt-2 text-gray-800">{item.title}</h3>
                <p className="text-emerald-600 font-bold mt-1">R$ {item.price.toFixed(2)} /{item.priceType === "daily" ? "dia" : "mês"}</p>
                {(item.city || item.state) && (
                  <p className="text-sm text-gray-500 mt-1 flex items-center gap-1"><MapPin size={14} />{item.city}{item.state ? ` - ${item.state}` : ""}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
