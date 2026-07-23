import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Home as HomeIcon, Car, TreePine, PartyPopper, Search, ChevronRight } from "lucide-react";

import { API, imgUrl } from "../config";

const categoryConfig = [
  {
    slug: "casas", name: "Casas", icon: HomeIcon,
    desc: "Encontre a casa perfeita para temporada",
    gradient: "from-emerald-500 to-emerald-700",
    image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop",
  },
  {
    slug: "carros", name: "Carros", icon: Car,
    desc: "Carros e motos para alugar",
    gradient: "from-blue-500 to-blue-700",
    image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&h=300&fit=crop",
  },
  {
    slug: "motos", name: "Motos", icon: Car,
    desc: "Motos para todas as ocasiões",
    gradient: "from-red-500 to-red-700",
    image: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=400&h=300&fit=crop",
  },
  {
    slug: "ranchos", name: "Ranchos", icon: TreePine,
    desc: "Ranchos e sítios para eventos",
    gradient: "from-green-600 to-green-800",
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&h=300&fit=crop",
  },
  {
    slug: "saloes", name: "Salões", icon: PartyPopper,
    desc: "Salões de festa completos",
    gradient: "from-purple-500 to-purple-700",
    image: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=400&h=300&fit=crop",
  },
];

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch(`${API}/listings`).then(r => r.json()).then(data => {
      setFeatured((data.listings || data).slice(0, 6));
    }).catch(() => {});
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-emerald-700 to-emerald-900 text-white py-16 md:py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-4">Alugue o que precisar</h1>
          <p className="text-emerald-200 text-base md:text-lg mb-8">Casas, carros, ranchos e salões de festa perto de você</p>
          <div className="flex max-w-xl mx-auto bg-white rounded-lg overflow-hidden shadow-lg">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="O que você procura?"
              className="flex-1 px-4 py-3 text-gray-800 outline-none text-sm md:text-base"
            />
            <Link
              to={`/categoria/todos?search=${search}`}
              className="bg-emerald-500 px-5 md:px-6 py-3 flex items-center gap-2 hover:bg-emerald-600 transition shrink-0"
            >
              <Search size={18} />
              <span className="hidden sm:inline">Buscar</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Categorias — slider no celular, grid no desktop */}
      <section className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-gray-800">Categorias</h2>
          <Link to="/categoria/todos" className="text-sm text-emerald-600 hover:underline flex items-center gap-1">
            Ver todas <ChevronRight size={16} />
          </Link>
        </div>

        {/* Móvel: slider horizontal com snap. Desktop: grid */}
        <div className="flex md:grid md:grid-cols-5 gap-3 md:gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:overflow-visible">
          {categoryConfig.map(cat => (
            <Link
              key={cat.slug}
              to={`/categoria/${cat.slug}`}
              className="group flex-shrink-0 w-36 md:w-auto snap-start"
            >
              <div className={`relative h-32 md:h-44 rounded-xl overflow-hidden bg-gradient-to-br ${cat.gradient} shadow-md hover:shadow-lg transition-all hover:scale-[1.02] md:hover:scale-105`}>
                {/* Imagem de fundo */}
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-55 transition-opacity"
                  loading="lazy"
                />
                {/* Overlay escuro pra legibilidade */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                {/* Conteúdo */}
                <div className="relative z-10 flex flex-col items-center justify-center h-full p-3 text-white">
                  <cat.icon size={32} className="mb-2 group-hover:scale-110 transition-transform drop-shadow" />
                  <h3 className="font-bold text-sm md:text-base drop-shadow">{cat.name}</h3>
                  <p className="text-[10px] md:text-xs mt-1 opacity-80 text-center leading-tight hidden md:block">
                    {cat.desc}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Destaques */}
      {featured.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-8 md:py-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-gray-800">Destaques</h2>
            <Link to="/categoria/todos" className="text-sm text-emerald-600 hover:underline flex items-center gap-1">
              Ver todos <ChevronRight size={16} />
            </Link>
          </div>

          {/* Móvel: slider horizontal. Desktop: grid */}
          <div className="flex md:grid md:grid-cols-3 gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:overflow-visible">
            {featured.map(item => (
              <Link
                key={item.id}
                to={`/anuncio/${item.id}`}
                className="group flex-shrink-0 w-64 md:w-auto snap-start bg-white rounded-xl shadow overflow-hidden hover:shadow-lg transition"
              >
                <div className="h-40 md:h-48 bg-gray-200">
                  {item.images?.[0] ? (
                    <img src={imgUrl(item.images[0])} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">📷 Sem foto</div>
                  )}
                </div>
                <div className="p-3 md:p-4">
                  <span className="text-[10px] md:text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 md:py-1 rounded">{item.category?.name}</span>
                  <h3 className="font-semibold mt-1.5 text-sm md:text-base text-gray-800 truncate">{item.title}</h3>
                  <p className="text-emerald-600 font-bold text-sm md:text-base mt-1">
                    R$ {item.price.toFixed(2)} <span className="text-[10px] md:text-xs font-normal text-gray-500">/{item.priceType === "daily" ? "dia" : "mês"}</span>
                  </p>
                  {item.city && (
                    <p className="text-[11px] md:text-sm text-gray-500 mt-0.5 truncate">{item.city}{item.state ? ` - ${item.state}` : ""}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
