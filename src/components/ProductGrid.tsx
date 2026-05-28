import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { ShoppingCart, Loader2, Plus, Minus, X, AlertCircle, Search } from 'lucide-react';
import { useCart } from '../context/CartContext';
import Swal from 'sweetalert2';

// 1. INTERFAZ MODIFICADA
interface Producto {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  imagen_url: string;
  categoria: string;
  stock: number; // <-- AGREGADO: Stock real controlado por TypeScript
}

// 2. COMPONENTE MODAL DE DETALLE
const ProductDetailModal = ({ producto, onClose }: { producto: Producto, onClose: () => void }) => {
  const [cantidad, setCantidad] = useState(1);
  const precioTotal = producto.precio * cantidad;
  const { addToCart } = useCart();
  
  const estaAgotado = (producto.stock ?? 0) <= 0;

  const handleAddToCart = () => {
    if (estaAgotado) return;

    Swal.fire({
      title: '¿Añadir al carrito?',
      text: `¿Deseas agregar ${cantidad} unidad(es) de ${producto.nombre}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#b49770',
      cancelButtonColor: '#374151',
      confirmButtonText: 'Sí, añadir',
      cancelButtonText: 'Cancelar',
      customClass: { popup: 'rounded-[25px]' }
    }).then((result) => {
      if (result.isConfirmed) {
        addToCart({
          id: producto.id,
          nombre: producto.nombre,
          precio: producto.precio,
          cantidad: cantidad,
          imagen_url: producto.imagen_url,
          stock: producto.stock // <-- PASAMOS EL STOCK AL CARRITO
        });

        Swal.fire({
          title: '¡Hecho!',
          text: 'Producto añadido correctamente',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
          customClass: { popup: 'rounded-[25px]' }
        });
        onClose();
      }
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-[40px] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300 relative">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 z-10 bg-white/80 p-2 rounded-full hover:bg-white transition-colors shadow-sm"
        >
          <X size={20} className="text-gray-800" />
        </button>

        <div className="flex flex-col">
          <div className="h-64 w-full relative">
            <img 
              src={producto.imagen_url || '/placeholder-bread.png'} 
              className={`w-full h-full object-cover ${estaAgotado ? 'grayscale contrast-75' : ''}`}
              alt={producto.nombre}
            />
            {estaAgotado && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <span className="bg-red-600 text-white font-black px-6 py-2 rounded-full uppercase tracking-wider text-sm shadow-md">
                  Agotado Temporalmente
                </span>
              </div>
            )}
          </div>

          <div className="p-8 text-left space-y-6">
            <div>
              <span className="text-[10px] font-bold text-[#b49770] uppercase tracking-[0.2em]">{producto.categoria}</span>
              <h2 className="text-3xl font-black text-gray-800 mt-1">{producto.nombre}</h2>
              
              {/* INDICADOR DE DISPONIBILIDAD */}
              {!estaAgotado && (
                <p className="text-xs font-bold mt-2 text-gray-400">
                  Disponibles: <span className="text-gray-600 font-black">{producto.stock} unidades</span>
                </p>
              )}
            </div>

            <p className="text-gray-500 leading-relaxed text-sm">{producto.descripcion}</p>

            {/* CONTROLADORES DE CANTIDAD BLINDADOS */}
            <div className="flex items-center justify-between bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <div className="flex items-center gap-6">
                <button 
                  onClick={() => setCantidad(prev => prev > 1 ? prev - 1 : 1)}
                  disabled={estaAgotado}
                  className="w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-sm text-gray-400 hover:text-[#b49770] disabled:cursor-not-allowed"
                >
                  <Minus size={18} />
                </button>
                <span className="font-black text-xl text-gray-800">
                  {estaAgotado ? 0 : cantidad}
                </span>
                <button 
                  onClick={() => setCantidad(prev => prev < producto.stock ? prev + 1 : prev)}
                  disabled={estaAgotado || cantidad >= producto.stock}
                  className="w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-sm text-gray-400 hover:text-[#b49770] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Plus size={18} />
                </button>
              </div>
              <span className="text-gray-400 font-bold text-sm">
                ${producto.precio.toLocaleString('es-CO')} c/u
              </span>
            </div>

            <div className="flex items-center justify-between pt-4">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Total General</p>
                <p className="text-3xl font-black text-gray-800">
                  ${(estaAgotado ? 0 : precioTotal).toLocaleString('es-CO')}
                </p>
              </div>
              <button 
                onClick={handleAddToCart}
                disabled={estaAgotado}
                className={`px-8 py-4 rounded-2xl font-bold flex items-center gap-3 transition-all shadow-xl active:scale-95 ${
                  estaAgotado
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                    : 'bg-gray-900 text-white hover:bg-[#b49770]'
                }`}
              >
                <ShoppingCart size={20} />
                {estaAgotado ? 'Agotado ❌' : 'Añadir al Carrito'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 3. TARJETA MODIFICADA CON COMPORTAMIENTO DE STOCK
const ProductCard = ({ producto }: { producto: Producto }) => {
  const [showModal, setShowModal] = useState(false);
  const estaAgotado = (producto.stock ?? 0) <= 0;

  return (
    <>
      <div 
        onClick={() => setShowModal(true)}
        className={`bg-white rounded-[35px] shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group relative ${
          estaAgotado ? 'opacity-75' : ''
        }`}
      >
        <div className="h-56 overflow-hidden relative">
          <img 
            src={producto.imagen_url || '/placeholder-bread.png'} 
            className={`w-full h-full object-cover group-hover:scale-105 transition duration-500 ${
              estaAgotado ? 'grayscale contrast-75' : ''
            }`}
            alt={producto.nombre}
          />
          <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
            <span className="bg-white/90 backdrop-blur-sm text-[10px] font-bold px-3 py-1 rounded-full uppercase text-gray-500 shadow-sm">
              {producto.categoria}
            </span>
            {estaAgotado && (
              <span className="bg-red-600 text-white text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm animate-pulse">
                Agotado
              </span>
            )}
          </div>
        </div>
        <div className="p-6 text-left">
          <h3 className="text-xl font-black text-gray-800 capitalize">{producto.nombre}</h3>
          <p className="text-gray-400 text-sm mt-1 mb-4 line-clamp-1 italic text-ellipsis overflow-hidden">
            {estaAgotado ? 'Sin existencias por hoy' : 'Ver detalles y seleccionar cantidad'}
          </p>
          <div className="flex items-center justify-between">
            <p className="text-[#b49770] font-black text-xl">${producto.precio.toLocaleString('es-CO')}</p>
            <div className={`p-2 rounded-xl transition-colors ${
              estaAgotado ? 'bg-gray-100 text-gray-300' : 'bg-gray-50 text-gray-400 group-hover:bg-[#b49770] group-hover:text-white'
            }`}>
              {estaAgotado ? <X size={20} /> : <Plus size={20} />}
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <ProductDetailModal 
          producto={producto} 
          onClose={() => setShowModal(false)} 
        />
      )}
    </>
  );
};

// 4. GRID PRINCIPAL (NORMALIZADO PARA TRADUCIR CATEGORÍAS)
const ProductGrid = () => {
  const { categoria } = useParams<{ categoria: string }>();
  const navigate = useNavigate();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const params = new URLSearchParams(window.location.search);
  const queryTerm = params.get('q');

  useEffect(() => {
    const fetchProductos = async () => {
      setLoading(true);
      setError(null);
      try {
        let query = supabase.from('productos').select('*');

        if (categoria === 'busqueda' && queryTerm) {
          query = query.or(`nombre.ilike.%${queryTerm}%,descripcion.ilike.%${queryTerm}%`);
        } else if (categoria && categoria !== 'busqueda') {
          // 🚀 AQUÍ SE HACE LA MAGIA:
          // Transforma "linea-amarilla" -> "linea amarilla", "Panadería" -> "panaderia"
          const categoriaNormalizada = categoria
            .toLowerCase()
            .replace(/-/g, ' ')
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");

          query = query.eq('categoria', categoriaNormalizada);
        }

        const { data, error: supabaseError } = await query;
        if (supabaseError) throw supabaseError;
        setProductos(data || []);
      } catch (err: any) {
        setError(err.message);
      } finally { 
        setLoading(false);
      }
    };
    fetchProductos();
  }, [categoria, queryTerm]);

  return (
    <div className="space-y-10 px-4 md:px-0">
      <header className="text-left border-b border-gray-100 pb-6">
        <h1 className="text-4xl font-black text-gray-800 capitalize tracking-tight">
          {categoria === 'busqueda' ? `Resultados: ${queryTerm || ''}` : categoria?.replace('-', ' ')}
        </h1>
        <p className="text-gray-400 mt-2">Explora los mejores productos de Neiva.</p>
      </header>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100">
          <AlertCircle size={20} />
          <p className="font-medium">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="py-20 flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-[#b49770]" size={40} />
          <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest text-center">Cargando Cayena...</p>
        </div>
      ) : productos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {productos.map((p) => <ProductCard key={p.id} producto={p} />)}
        </div>
      ) : (
        <div className="py-24 flex flex-col items-center justify-center text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-gray-50 p-10 rounded-[40px] mb-6 shadow-inner">
            <Search size={60} className="text-gray-200" />
          </div>
          <h2 className="text-3xl font-black text-gray-800">No hay coincidencias</h2>
          <p className="text-gray-400 mt-3 max-w-sm px-6">
            No encontramos productos para "<span className="text-[#b49770] font-bold italic">{queryTerm || categoria?.replace('-', ' ')}</span>". 
            ¡Intenta con otra delicia!
          </p>
          <button 
            onClick={() => navigate('/')} 
            className="mt-10 bg-gray-900 text-white px-10 py-4 rounded-2xl font-bold hover:bg-[#b49770] transition-all active:scale-95 shadow-lg"
          >
            Ver catálogo completo
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductGrid;