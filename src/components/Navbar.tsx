import { useState, useEffect, useRef } from 'react';
import { 
  ShoppingCart, Search, Menu, X, LogOut, 
  ClipboardList, MapPin, Sun, Moon, ChevronDown, LayoutDashboard 
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { supabase } from '../supabaseClient';

const Navbar = () => {
  const navigate = useNavigate();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { totalItems } = useCart();
  
  const [darkMode, setDarkMode] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });
  
  const menuRef = useRef<HTMLDivElement>(null);

  // 🚀 FUNCIÓN CORREGIDA: Consulta el rol real en la tabla 'profiles' de la BD
  const chequearRolAdmin = async (sessionUser: any) => {
    if (!sessionUser) {
      setIsAdmin(false);
      return;
    }

    try {
      // 1. Respaldo fijo para tu cuenta principal
      const esTuCorreo = sessionUser.email === 'juandavidbelrrocu@gmail.com'; 

      // 2. Consulta asíncrona a Supabase usando el ID del usuario autenticado
      const { data: perfil, error } = await supabase
        .from('profiles')
        .select('rol')
        .eq('id', sessionUser.id)
        .maybeSingle();

      if (error) {
        console.error("Error al validar rol en la base de datos:", error.message);
      }

      // 3. Verificamos si tiene el rol configurado en la tabla profiles
      const esAdminEnBD = perfil?.rol === 'admin' || perfil?.rol === 'ADMIN';

      // Se otorga el permiso si cumple cualquiera de las dos condiciones
      setIsAdmin(esTuCorreo || esAdminEnBD);

    } catch (err) {
      console.error("Error inesperado al chequear rol:", err);
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    // Carga de sesión al montar el componente
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentBarsUser = session?.user ?? null;
      setUser(currentBarsUser);
      if (currentBarsUser) {
        chequearRolAdmin(currentBarsUser);
      }
    });

    // Escucha de cambios de autenticación en tiempo real
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentBarsUser = session?.user ?? null;
      setUser(currentBarsUser);
      if (currentBarsUser) {
        chequearRolAdmin(currentBarsUser);
      } else {
        setIsAdmin(false);
      }
    });

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      subscription.unsubscribe();
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  const toggleTema = () => {
    if (darkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setDarkMode(true);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/productos/busqueda?q=${encodeURIComponent(searchTerm.trim())}`);
      setIsSearchOpen(false);
      setSearchTerm("");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setMenuOpen(false);
    setIsAdmin(false);
    navigate('/');
  };

  const getInitial = () => {
    if (user?.user_metadata?.full_name) return user.user_metadata.full_name[0].toUpperCase();
    if (user?.email) return user.email[0].toUpperCase();
    return 'U';
  };

  return (
    <nav className="flex items-center justify-between px-4 md:px-10 py-4 bg-white dark:bg-slate-950 border-b border-gray-100 dark:border-slate-900 shadow-sm sticky top-0 z-50 transition-colors duration-300">
      
      {/* LOGO */}
      <Link to="/" className="flex flex-col items-center border-r pr-4 md:pr-6 border-gray-300 dark:border-slate-800 cursor-pointer">
        <h1 className="text-xl md:text-2xl font-serif font-bold text-gray-800 dark:text-slate-100 tracking-widest">CAYENA</h1>
        <span className="text-[10px] md:text-xs italic text-gray-800 dark:text-slate-400 uppercase">panadería . café</span>
      </Link>

      {/* MENÚ CENTRAL */}
      <ul className="hidden lg:flex space-x-10 text-sm font-medium text-gray-700 dark:text-slate-300">
        <li><Link to="/productos/desayunos" className="hover:text-[#b49770] dark:hover:text-[#b49770] transition">Desayunos</Link></li>
        <li><Link to="/productos/panaderia" className="hover:text-[#b49770] dark:hover:text-[#b49770] transition">Panadería</Link></li>
        <li><Link to="/productos/pasteleria" className="hover:text-[#b49770] dark:hover:text-[#b49770] transition">Pastelería</Link></li>
        <li><Link to="/productos/linea-amarilla" className="hover:text-[#b49770] dark:hover:text-[#b49770] transition">Línea amarilla</Link></li>
        <li><Link to="/productos/bebidas" className="hover:text-[#b49770] dark:hover:text-[#b49770] transition">Bebidas</Link></li>
        <li><Link to="/horarios" className="hover:text-[#b49770] dark:hover:text-[#b49770] transition">Horarios</Link></li>
      </ul>

      {/* ACCIONES */}
      <div className="flex items-center space-x-3 md:space-x-6">
        
        {/* BUSCADOR */}
        <div className="relative flex items-center">
          {isSearchOpen ? (
            <form onSubmit={handleSearch} className="absolute right-0 flex items-center animate-in fade-in zoom-in duration-200">
              <input 
                autoFocus
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar en Cayena..."
                className="border dark:border-slate-800 rounded-full px-4 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#b49770] w-48 md:w-64 bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-200"
              />
              <X 
                className="ml-2 w-5 h-5 text-gray-400 dark:text-slate-500 cursor-pointer" 
                onClick={() => setIsSearchOpen(false)} 
              />
            </form>
          ) : (
            <Search 
              className="w-5 h-5 text-gray-500 dark:text-slate-400 cursor-pointer hover:text-[#b49770] dark:hover:text-[#b49770] transition" 
              onClick={() => setIsSearchOpen(true)}
            />
          )}
        </div>

        {/* CARRITO */}
        <Link to="/carrito" className="relative group">
          <ShoppingCart className="w-5 h-5 text-gray-500 dark:text-slate-400 group-hover:text-[#b49770] dark:group-hover:text-[#b49770] transition" />
          {totalItems > 0 && (
            <span className="absolute -top-2 -right-2 bg-[#b49770] text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
              {totalItems}
            </span>
          )}
        </Link>
        
        {/* MI CUENTA */}
        <div className="relative" ref={menuRef}>
          {user ? (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 bg-gray-50 dark:bg-slate-900 p-1 pr-2 rounded-full border border-gray-200 dark:border-slate-800 hover:shadow-md transition-all active:scale-95"
              >
                <div className="w-8 h-8 md:w-9 md:h-9 bg-[#b49770] rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm">
                  {getInitial()}
                </div>
                <ChevronDown size={14} className={`text-gray-500 dark:text-slate-400 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-900 rounded-[24px] shadow-xl border border-gray-100 dark:border-slate-800 py-3 animate-in fade-in slide-in-from-top-3 duration-200 z-[60] text-left">
                  
                  {/* Encabezado */}
                  <div className="px-4 py-2.5 border-b border-gray-50 dark:border-slate-800">
                    <p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase font-black tracking-widest">Sesión iniciada</p>
                    <p className="text-sm font-bold text-gray-700 dark:text-slate-200 truncate mt-0.5">
                      {user.user_metadata?.full_name || user.email}
                    </p>
                  </div>
                  
                  {/* Bloque: Gestión de Cuenta */}
                  <div className="p-1.5 space-y-0.5">
                    
                    {/* Botón condicional de administrador leyendo el estado dinámico */}
                    {isAdmin && (
                      <DropdownLink 
                        to="/admin" 
                        icon={<LayoutDashboard size={16} className="text-amber-600 dark:text-amber-500" />} 
                        label="Panel Administrativo" 
                        onClick={() => setMenuOpen(false)} 
                        className="font-bold text-amber-700 dark:text-amber-400 bg-amber-50/40 dark:bg-amber-950/20"
                      />
                    )}

                    <DropdownLink to="/pedidos" icon={<ClipboardList size={16} />} label="Mis Pedidos" onClick={() => setMenuOpen(false)} />
                    <DropdownLink to="/direcciones" icon={<MapPin size={16} />} label="Direcciones" onClick={() => setMenuOpen(false)} />
                  </div>

                  <div className="h-[1px] bg-gray-100 dark:bg-slate-800 my-1 mx-4"></div>

                  {/* Bloque: Preferencias (Tema) */}
                  <div className="px-1.5 py-1">
                    <button 
                      onClick={toggleTema}
                      className="w-full flex items-center justify-between px-3 py-2.5 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl transition-colors text-sm font-medium"
                    >
                      <div className="flex items-center gap-3">
                        {darkMode ? <Moon size={16} className="text-amber-500" /> : <Sun size={16} className="text-[#b49770]" />}
                        <span>Modo Oscuro</span>
                      </div>
                      
                      <div className={`w-8 h-4.5 rounded-full p-0.5 transition-colors duration-200 ${darkMode ? 'bg-[#b49770]' : 'bg-gray-200 dark:bg-slate-700'}`}>
                        <div className={`w-3.5 h-3.5 bg-white rounded-full shadow-md transform transition-transform duration-200 ${darkMode ? 'translate-x-3.5' : 'translate-x-0'}`} />
                      </div>
                    </button>
                  </div>

                  <div className="h-[1px] bg-gray-100 dark:bg-slate-800 my-1 mx-4"></div>

                  {/* Bloque: Salida */}
                  <div className="px-1.5 pt-0.5">
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-red-500 hover:bg-red-50/70 dark:hover:bg-red-950/30 rounded-xl transition-colors text-sm font-bold"
                    >
                      <LogOut size={16} />
                      Cerrar Sesión
                    </button>
                  </div>

                </div>
              )}
            </div>
          ) : (
            <button 
              onClick={() => navigate('/auth')} 
              className="flex items-center bg-[#b49770] text-white px-4 py-2 md:px-5 md:py-2.5 rounded-full text-sm font-semibold shadow-md hover:bg-[#a3865f] transition transform hover:scale-105 active:scale-95"
            >
              <span className="text-xs font-bold mr-2">🔑</span>
              <span>Mi cuenta</span>
            </button>
          )}
        </div>

        <Menu className="w-6 h-6 lg:hidden text-gray-800 dark:text-slate-200 cursor-pointer" />
      </div>
    </nav>
  );
};

const DropdownLink = ({ to, icon, label, onClick, className = "" }: { to: string, icon: React.ReactNode, label: string, onClick: () => void, className?: string }) => (
  <Link 
    to={to} 
    onClick={onClick}
    className={`flex items-center gap-3 px-3 py-2.5 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-[#b49770] dark:hover:text-[#b49770] rounded-xl transition-colors text-sm font-medium ${className}`}
  >
    {icon}
    {label}
  </Link>
);

export default Navbar;