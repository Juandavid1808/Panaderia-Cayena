import { useState, useMemo } from 'react'; // 🚀 Importamos useMemo para forzar reactividad móvil
import { useCart } from '../context/CartContext';
import { Trash2, ArrowLeft, ShoppingBag, Edit2, CreditCard, Truck, Store } from 'lucide-react'; 
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

const CartPage = () => {
  const { cart, removeFromCart, updateQuantity } = useCart();
  const navigate = useNavigate(); 

  // Estado para controlar el tipo de entrega (por defecto domicilio)
  const [tipoEntrega, setTipoEntrega] = useState<'domicilio' | 'recoger'>('domicilio');

  const TARIFA_DOMICILIO = 4000;

  // 🚀 FUERZA DE PRECIO PARA CELULARES: Calculamos el total de productos y precio localmente
  // Esto asegura que cada vez que cambie el arreglo 'cart' en el móvil, las sumas cambien sí o sí.
  const localTotalPrice = useMemo(() => {
    return cart.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
  }, [cart]);

  const localTotalItems = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.cantidad, 0);
  }, [cart]);

  // Si elige domicilio se suman los 4000, si es para recoger se mantiene el precio base
  const totalFinal = tipoEntrega === 'domicilio' ? localTotalPrice + TARIFA_DOMICILIO : localTotalPrice;

  const confirmarEliminacion = (id: string, nombre: string) => {
    Swal.fire({
      title: '¿Eliminar producto?',
      text: `¿Estás seguro de quitar "${nombre}" de tu pedido?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444', 
      cancelButtonColor: '#374151',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'No, mantener',
      customClass: { popup: 'rounded-[30px]' }
    }).then((result) => {
      if (result.isConfirmed) {
        removeFromCart(id);
      }
    });
  };

  const editarCantidad = (id: string, nombre: string, cantidadActual: number, imagen: string) => {
    Swal.fire({
      title: `<span class="text-2xl font-black text-gray-800">Actualizar pedido</span>`,
      html: `
        <div class="flex flex-col items-center gap-4 mt-4">
          <img src="${imagen || '/placeholder-bread.png'}" class="w-32 h-32 object-cover rounded-[20px] shadow-md" />
          <p class="text-lg font-bold text-gray-600">${nombre}</p>
        </div>
      `,
      input: 'number',
      inputValue: cantidadActual,
      inputAttributes: { min: '1', step: '1', class: 'swal2-input custom-input-cayena' },
      showCancelButton: true,
      confirmButtonText: 'Actualizar',
      confirmButtonColor: '#b49770',
      customClass: {
        popup: 'rounded-[40px] p-10',
        input: 'rounded-xl border-gray-200 text-center font-bold text-xl'
      },
      inputValidator: (value) => {
        if (!value || parseInt(value) < 1) return 'Mínimo 1 unidad';
        return null;
      }
    }).then((result) => {
      if (result.isConfirmed) {
        updateQuantity(id, parseInt(result.value), undefined as any);
      }
    });
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-10 py-32 text-center flex flex-col items-center">
        <div className="bg-gray-100 p-8 rounded-full mb-6">
          <ShoppingBag size={60} className="text-gray-400" />
        </div>
        <h2 className="text-4xl font-black text-gray-800">Tu bolsa está vacía</h2>
        <Link to="/" className="mt-8 bg-[#b49770] text-white px-10 py-4 rounded-2xl font-bold">
          Ver Productos
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-16 text-left animate-in fade-in duration-500">
      <div className="flex items-center gap-4 mb-10">
        <Link to="/" className="p-3 bg-white rounded-full shadow-sm hover:bg-gray-50">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-4xl font-black text-gray-800 tracking-tight">Tu Pedido</h1>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <div className="space-y-4">
          {cart.map((item) => (
            <div key={item.id} className="bg-white p-6 rounded-[30px] border border-gray-100 flex items-center gap-6 shadow-sm">
              <img src={item.imagen_url || '/placeholder-bread.png'} alt={item.nombre} className="w-24 h-24 object-cover rounded-2xl" />
              <div className="flex-grow">
                <h3 className="text-xl font-bold text-gray-800">
                  {item.nombre}
                </h3>
                <p className="text-gray-400 text-sm italic">Cantidad: {item.cantidad}</p>
                {/* Multiplicación directa vinculada al renderizado del array en el celular */}
                <p className="text-[#b49770] font-black mt-1">
                  ${(item.precio * item.cantidad).toLocaleString('es-CO')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => editarCantidad(item.id, item.nombre, item.cantidad, item.imagen_url)} className="p-4 text-blue-400 hover:bg-blue-50 rounded-2xl transition-colors">
                  <Edit2 size={20} />
                </button>
                <button onClick={() => confirmarEliminacion(item.id, item.nombre)} className="p-4 text-red-400 hover:bg-red-50 rounded-2xl transition-colors">
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* TARJETA OSCURA DEL RESUMEN */}
        <div className="bg-gray-900 rounded-[40px] p-10 text-white shadow-2xl space-y-6">
          
          {/* SECTOR DE SELECCIÓN DE ENTREGA */}
          <div className="space-y-3">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Método de entrega</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTipoEntrega('domicilio')}
                className={`flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 transition-all font-bold text-sm ${
                  tipoEntrega === 'domicilio' 
                    ? 'border-[#b49770] bg-[#b49770]/10 text-[#b49770]' 
                    : 'border-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                <Truck size={18} />
                Domicilio (+$4.000)
              </button>

              <button
                type="button"
                onClick={() => setTipoEntrega('recoger')}
                className={`flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 transition-all font-bold text-sm ${
                  tipoEntrega === 'recoger' 
                    ? 'border-[#b49770] bg-[#b49770]/10 text-[#b49770]' 
                    : 'border-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                <Store size={18} />
                Recoger en Tienda
              </button>
            </div>
          </div>

          <div className="h-[1px] bg-white/10 w-full"></div>

          {/* TOTALES */}
          <div className="flex justify-between items-center">
            <span className="opacity-60 font-bold uppercase text-xs tracking-widest">
              Resumen ({localTotalItems} productos)
            </span>
            <span className="text-2xl font-black">${totalFinal.toLocaleString('es-CO')}</span>
          </div>
          
          <div className="h-[1px] bg-white/10 w-full mb-2"></div>

          <div className="flex flex-col gap-4">
            <button 
              onClick={() => navigate('/checkout', { state: { tipoEntrega } })}
              className="w-full bg-[#b49770] hover:bg-[#c4a67d] text-white py-5 rounded-2xl font-black text-xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg"
            >
              <CreditCard size={24} />
              Finalizar Compra
            </button>
            <p className="text-center text-xs opacity-40 italic">
              {tipoEntrega === 'domicilio' 
                ? 'Podrás ingresar tu dirección en el siguiente paso.' 
                : 'Te daremos la información para recoger tu pedido en el siguiente paso.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;