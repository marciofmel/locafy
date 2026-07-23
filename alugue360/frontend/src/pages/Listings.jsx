import { useEffect, useRef, useState, useCallback } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { MapPin, Star } from "lucide-react";

import { API, imgUrl } from "../config";

const categories = [
  { slug: "casas", name: "Casas" },
  { slug: "carros", name: "Carros" },
  { slug: "motos", name: "Motos" },
  { slug: "ranchos", name: "Ranchos" },
  { slug: "saloes", name: "Salões" },
];

export default function Listings() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const [listings, setListings] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [filterCat, setFilterCat] = useState(slug || "");
  const sentinelRef = useRef(null);

  const searchTerm = searchParams.get("search")?.toLowerCase() || "";

  const fetchListings = useCallback(async (pageNum, append) => {
    setLoading(true);
    const params = new URLSearchParams({ page: pageNum, limit: "12" });
    if (filterCat) params.set("category", filterCat);
    if (searchTerm) params.set("search", searchTerm);
    const res = await fetch(`${API}/listings?${params}`);
    const data = await res.json();
    if (append) {
      setListings(prev => [...prev, ...data.listings]);
    } else {
      setListings(data.listings);
    }
    setHasMore(data.hasMore);
    setLoading(false);
  }, [filterCat, searchTerm]);

  useEffect(() => {
    setPage(1);
    setListings([]);
    setHasMore(true);
    fetchListings(1, false);
  }, [fetchListings]);

  useEffect(() => {
    if (!hasMore || loading) return;
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchListings(nextPage, true);
      }
    }, { rootMargin: "200px" });
    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, page, fetchListings]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Anúncios disponíveis</h1>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <button onClick={() => setFilterCat("")} className={`px-4 py-2 rounded-full text-sm ${!filterCat ? "bg-emerald-600 text-white" : "bg-gray-200 text-gray-700"}`}>Todos</button>
        {categories.map(cat => (
          <button key={cat.slug} onClick={() => setFilterCat(cat.slug)} className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${filterCat === cat.slug ? "bg-emerald-600 text-white" : "bg-gray-200 text-gray-700"}`}>{cat.name}</button>
        ))}
      </div>

      {listings.length === 0 && !loading ? (
        <p className="text-center text-gray-500 py-12">Nenhum anúncio encontrado</p>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3 md:gap-6">
            {listings.map(item => (
              <Link key={item.id} to={`/anuncio/${item.id}`} className={`bg-white rounded-xl shadow overflow-hidden hover:shadow-lg transition ${item.featured ? "ring-2 ring-yellow-400" : ""}`}>
                <div className="h-28 sm:h-36 md:h-44 bg-gray-100 flex items-center justify-center text-gray-400 text-4xl relative">
                  {item.images?.[0] ? <img src={imgUrl(item.images[0])} onError={e => { e.target.style.display = "none"; e.target.parentElement.textContent = "📷"; }} className="w-full h-full object-cover" /> : "📷"}
                  {item.featured && <span className="absolute top-1 left-1 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5"><Star size={10} /> Destaque</span>}
                </div>
                <div className="p-2 md:p-4">
                  <span className="text-[10px] md:text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 md:px-2 md:py-1 rounded">{item.category?.name}</span>
                  <h3 className="font-semibold mt-1 md:mt-2 text-xs md:text-base text-gray-800 truncate">{item.title}</h3>
                  <p className="text-emerald-600 font-bold text-xs md:text-base mt-0.5 md:mt-1">R$ {item.price.toFixed(2)} /{item.priceType === "daily" ? "dia" : "mês"}</p>
                  {(item.city || item.state) && (
                    <p className="text-[10px] md:text-sm text-gray-500 mt-0.5 md:mt-1 flex items-center gap-1 truncate"><MapPin size={12} />{item.city}{item.state ? ` - ${item.state}` : ""}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
          <div ref={sentinelRef} className="h-4" />
          {loading && <p className="text-center text-gray-400 py-4">Carregando...</p>}
        </>
      )}
    </div>
  );
}
