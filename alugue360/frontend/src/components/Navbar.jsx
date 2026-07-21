import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Menu, X, Home, Car, TreePine, PartyPopper, LayoutDashboard, LogIn, UserPlus, Heart } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const categories = [
    { name: "Casas", slug: "casas", icon: Home },
    { name: "Carros", slug: "carros", icon: Car },
    { name: "Motos", slug: "motos", icon: Car },
    { name: "Ranchos", slug: "ranchos", icon: TreePine },
    { name: "Salões", slug: "saloes", icon: PartyPopper },
  ];

  return (
    <nav className="bg-emerald-700 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold">
            <img src="/logo.png" alt="Locafy" className="h-8 w-auto" />
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {categories.map((cat) => (
              <Link key={cat.slug} to={`/categoria/${cat.slug}`} className="flex items-center gap-1 hover:text-emerald-200 transition">
                <cat.icon size={18} /> {cat.name}
              </Link>
            ))}
            <Link to="/planos" className="hover:text-emerald-200 transition">Planos</Link>
            {user ? (
              <>
                <Link to="/favoritos" className="flex items-center gap-1 hover:text-emerald-200 transition">
                  <Heart size={18} /> Favoritos
                </Link>
                <Link to="/dashboard" className="flex items-center gap-1 hover:text-emerald-200 transition">
                  <LayoutDashboard size={18} /> Painel
                </Link>
                <button onClick={logout} className="bg-red-500 px-3 py-1 rounded hover:bg-red-600 transition text-sm">Sair</button>
              </>
            ) : (
              <>
                <Link to="/login" className="flex items-center gap-1 hover:text-emerald-200 transition"><LogIn size={18} /> Entrar</Link>
                <Link to="/cadastro" className="bg-emerald-500 px-3 py-1 rounded hover:bg-emerald-600 transition text-sm flex items-center gap-1"><UserPlus size={18} /> Cadastrar</Link>
              </>
            )}
          </div>

          <button className="md:hidden" onClick={() => setOpen(!open)}>
            {open ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden px-4 pb-4 space-y-2">
          {categories.map((cat) => (
            <Link key={cat.slug} to={`/categoria/${cat.slug}`} onClick={() => setOpen(false)} className="flex items-center gap-2 py-2 hover:bg-emerald-600 rounded px-2">
              <cat.icon size={20} /> {cat.name}
            </Link>
          ))}
          <Link to="/planos" onClick={() => setOpen(false)} className="block py-2 hover:bg-emerald-600 rounded px-2">Planos</Link>
          {user ? (
            <>
              <Link to="/favoritos" onClick={() => setOpen(false)} className="block py-2 hover:bg-emerald-600 rounded px-2">Favoritos</Link>
              <Link to="/dashboard" onClick={() => setOpen(false)} className="block py-2 hover:bg-emerald-600 rounded px-2">Painel</Link>
              <button onClick={() => { logout(); setOpen(false); }} className="w-full text-left py-2 text-red-300">Sair</button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setOpen(false)} className="block py-2 hover:bg-emerald-600 rounded px-2">Entrar</Link>
              <Link to="/cadastro" onClick={() => setOpen(false)} className="block py-2 hover:bg-emerald-600 rounded px-2">Cadastrar</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
