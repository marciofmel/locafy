import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Menu, X, Home, Car, TreePine, PartyPopper, LogIn, UserPlus, Heart, Settings, CreditCard, LogOut } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

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
            {user ? (
              <>
                <Link to="/favoritos" className="flex items-center gap-1 hover:text-emerald-200 transition">
                  <Heart size={18} /> Favoritos
                </Link>
                <Link to="/dashboard" className="flex items-center gap-1 hover:text-emerald-200 transition">
                  <Home size={18} /> Painel
                </Link>
                <div className="relative" ref={profileRef}>
                  <button onClick={() => setProfileOpen(!profileOpen)} className="flex items-center gap-2 focus:outline-none">
                    {user.avatar ? (
                      <img src={user.avatar} className="w-9 h-9 rounded-full object-cover border-2 border-white hover:opacity-90 transition" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-emerald-400 flex items-center justify-center text-sm font-bold hover:opacity-90 transition">
                        {user.name?.[0]?.toUpperCase()}
                      </div>
                    )}
                  </button>
                  {profileOpen && (
                    <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg py-2 z-50">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-800 truncate">{user.name}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                      <button onClick={() => { setProfileOpen(false); navigate("/planos"); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition">
                        <CreditCard size={16} className="text-gray-400" /> Upgrad
                      </button>
                      <button onClick={() => { setProfileOpen(false); navigate("/perfil"); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition">
                        <Settings size={16} className="text-gray-400" /> Editar perfil
                      </button>
                      <div className="border-t border-gray-100 my-1" />
                      <button onClick={() => { setProfileOpen(false); logout(); navigate("/"); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition">
                        <LogOut size={16} /> Sair
                      </button>
                    </div>
                  )}
                </div>
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
          {user ? (
            <>
              <div className="flex items-center gap-3 py-2 px-2 border-b border-emerald-600">
                {user.avatar ? (
                  <img src={user.avatar} className="w-10 h-10 rounded-full object-cover border-2 border-white" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-emerald-400 flex items-center justify-center text-lg font-bold">{user.name?.[0]?.toUpperCase()}</div>
                )}
                <div>
                  <p className="font-medium text-sm">{user.name}</p>
                  <p className="text-xs text-emerald-200 truncate">{user.email}</p>
                </div>
              </div>
              <Link to="/favoritos" onClick={() => setOpen(false)} className="block py-2 hover:bg-emerald-600 rounded px-2">Favoritos</Link>
              <Link to="/dashboard" onClick={() => setOpen(false)} className="block py-2 hover:bg-emerald-600 rounded px-2">Painel</Link>
              <Link to="/planos" onClick={() => setOpen(false)} className="block py-2 hover:bg-emerald-600 rounded px-2">Upgrad</Link>
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
