import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, MapPin, ExternalLink, Phone, Navigation } from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSede, setActiveSede] = useState<number | null>(null);

  const categorias = [
    { title: 'Panadería', img: '/panaderia.png', slug: 'panaderia' },
    { title: 'Pastelería', img: '/pasteleria.png', slug: 'pasteleria' },
    { title: 'Desayunos', img: '/desayunos.png', slug: 'desayunos' },
  ];

  const sedes = [
    { 
      name: 'Cayena Estación', 
      img: '/estacion.png', 
      direccion: 'Calle 10 # 5-12, Neiva',
      celular: '310 123 4567',
      mapUrl: 'https://maps.app.goo.gl/uX3L2mYVz'
    },
    { 
      name: 'Cayena Tatacoa', 
      img: '/tatacoa.png', 
      direccion: 'Carrera 5 # 2-40, Neiva',
      celular: '315 987 6543',
      mapUrl: 'https://maps.app.goo.gl/vT9K8pRLz'
    },
    { 
      name: 'Cayena Sevilla', 
      img: '/sevilla.png', 
      direccion: 'Avenida 26 # 10-05, Neiva',
      celular: '320 555 0000',
      mapUrl: 'https://maps.app.goo.gl/xP4M7qNQy'
    },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/productos/busqueda?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-10 py-16 space-y-28 transition-colors duration-300">
      
      {/* 1. SECCIÓN: PRODUCTOS Y DOMICILIO */}
      <section className="pt-4 text-left">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div>
            <h2 className="text-4xl font-bold text-gray-800 dark:text-slate-100 mb-2">Conoce nuestros productos</h2>
            <p className="text-gray-500 dark:text-slate-400">Escoge tus productos y disfruta donde quieras que estés</p>
          </div>
          
          <a 
            href="https://api.whatsapp.com/qr/DXS6AI52QSXIG1?autoload=1&app_absent=0" 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-[#b49770] text-white px-8 py-4 rounded-full flex items-center space-x-3 hover:bg-[#a3865f] transition shadow-lg transform hover:-translate-y-1"
          >
            <span className="font-semibold">Pide a Domicilio</span>
            <div className="bg-white/20 p-2 rounded-full">🛵</div>
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {categorias.map((cat, index) => (
            <Link 
              key={index} 
              to={`/productos/${cat.slug}`} 
              className="relative h-60 rounded-3xl overflow-hidden group cursor-pointer shadow-md block"
            >
              <img 
                src={cat.img} 
                alt={cat.title} 
                className="w-full h-full object-cover group-hover:scale-105 transition duration-500" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-6 text-white text-left">
                <h3 className="text-2xl font-bold">{cat.title}</h3>
                <span className="text-sm opacity-90 flex items-center gap-2">
                  Ver catálogo <ExternalLink size={14} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 2. SECCIÓN: BUSCADOR MEJORADO */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-8 bg-gray-50 dark:bg-slate-900 p-12 rounded-[40px] border border-gray-100 dark:border-slate-800 text-left transition-colors duration-300">
        <div className="max-w-md">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-slate-100 mb-2">Busca más productos</h2>
          <p className="text-gray-500 dark:text-slate-400">Encuentra panes, tortas o desayunos específicos por nombre.</p>
        </div>
        <form onSubmit={handleSearch} className="relative flex-grow max-w-xl">
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Busca lo que deseas..." 
            className="w-full p-6 pr-16 rounded-2xl border-none focus:ring-2 focus:ring-[#b49770] bg-white dark:bg-slate-950 text-lg shadow-xl text-gray-700 dark:text-slate-100 focus:outline-none placeholder-gray-400 dark:placeholder-slate-500 transition-colors"
          />
          <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 bg-[#b49770] text-white p-3 rounded-xl hover:bg-[#a3865f] transition-all">
            <Search size={22} />
          </button>
        </form>
      </section>

      {/* 3. SECCIÓN: SEDES */}
      <section id="sedes" className="pb-10">
        <h2 className="text-5xl font-bold mb-16 text-center text-gray-800 dark:text-slate-100">Nuestras Sedes</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {sedes.map((sede, index) => (
            <div 
              key={index}
              onClick={() => setActiveSede(activeSede === index ? null : index)}
              className="flex flex-col shadow-xl rounded-[32px] overflow-hidden border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all hover:shadow-2xl cursor-pointer group"
            >
              <div className="h-72 overflow-hidden relative">
                <img 
                  src={sede.img} 
                  alt={sede.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-700" 
                />
              </div>
              <div className="p-8 text-left">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="block font-bold text-[#b49770] uppercase text-[10px] tracking-[0.2em] mb-1">Neiva, Huila</span>
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-slate-100">{sede.name}</h3>
                  </div>
                  <div className={`p-4 rounded-2xl transition-all duration-300 ${activeSede === index ? 'bg-gray-800 dark:bg-slate-700 text-white rotate-12' : 'bg-gray-50 dark:bg-slate-950 text-[#b49770]'}`}>
                    <MapPin size={24} />
                  </div>
                </div>

                {/* CONTENIDO DESPLEGABLE CON ANIMACIÓN */}
                {activeSede === index && (
                  <div className="mt-6 pt-6 border-t border-gray-100 dark:border-slate-800 space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="flex items-start gap-4">
                      <div className="bg-[#b49770]/10 p-2 rounded-lg">
                        <Navigation size={18} className="text-[#b49770]" />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Dirección</p>
                        <p className="text-gray-600 dark:text-slate-300 font-medium">{sede.direccion}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="bg-[#b49770]/10 p-2 rounded-lg">
                        <Phone size={18} className="text-[#b49770]" />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Teléfono</p>
                        <p className="text-gray-600 dark:text-slate-300 font-medium">{sede.celular}</p>
                      </div>
                    </div>
                    <a 
                      href={sede.mapUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="block w-full text-center bg-[#b49770] text-white py-4 rounded-2xl font-bold hover:bg-[#a3865f] transition-all shadow-lg hover:shadow-[#b49770]/20"
                    >
                      Abrir en Google Maps
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
};

export default Home;