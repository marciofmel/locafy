import { Link } from "react-router-dom";
import { Home as HomeIcon, Car, TreePine, PartyPopper } from "lucide-react";

const categories = [
  {
    slug: "casas", name: "Casas", icon: HomeIcon,
    desc: "Encontre a casa perfeita para temporada",
    gradient: "from-emerald-500 to-emerald-700",
    image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&h=400&fit=crop",
    count: "Casas, apartamentos e chácaras",
  },
  {
    slug: "carros", name: "Carros", icon: Car,
    desc: "Carros para todas as ocasiões",
    gradient: "from-blue-500 to-blue-700",
    image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&h=400&fit=crop",
    count: "Sedans, SUVs, pickups e mais",
  },
  {
    slug: "motos", name: "Motos", icon: Car,
    desc: "Motos para todas as ocasiões",
    gradient: "from-red-500 to-red-700",
    image: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=600&h=400&fit=crop",
    count: "Esportivas, custom e scooters",
  },
  {
    slug: "ranchos", name: "Ranchos", icon: TreePine,
    desc: "Ranchos e sítios para eventos",
    gradient: "from-green-600 to-green-800",
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&h=400&fit=crop",
    count: "Sítios, chácaras e áreas de lazer",
  },
  {
    slug: "saloes", name: "Salões", icon: PartyPopper,
    desc: "Salões de festa completos",
    gradient: "from-purple-500 to-purple-700",
    image: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=600&h=400&fit=crop",
    count: "Festas, eventos e confraternizações",
  },
];

export default function Categories() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Categorias</h1>
      <p className="text-gray-500 mb-8">Escolha uma categoria para explorar os anúncios</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map(cat => (
          <Link
            key={cat.slug}
            to={`/categoria/${cat.slug}`}
            className={`group relative h-52 rounded-2xl overflow-hidden bg-gradient-to-br ${cat.gradient} shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]`}
          >
            <img
              src={cat.image}
              alt={cat.name}
              className="absolute inset-0 w-full h-full object-cover opacity-45 group-hover:opacity-60 transition-opacity"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            <div className="relative z-10 flex flex-col justify-end h-full p-6 text-white">
              <cat.icon size={36} className="mb-2 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-bold">{cat.name}</h3>
              <p className="text-sm opacity-90 mt-1">{cat.desc}</p>
              <p className="text-xs opacity-70 mt-1">{cat.count}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}