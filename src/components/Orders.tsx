import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Auth } from './Auth';
import { ShoppingBag, Clock, Loader2, CheckCircle2, Truck, Coffee } from 'lucide-react';

export const Orders = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    async function checkSessionAndFetch() {
      try {
        setLoading(true);
        // 1. Validar la sesión del usuario
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);

        if (session?.user) {
          // 2. Consulta relacional: Trae el pedido y junta todos sus productos correspondientes
          const { data, error } = await supabase
            .from('orders')
            .select(`
              *,
              order_items (*)
            `)
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false });

          if (!error && data) {
            setOrders(data);
          }
        }
      } catch (error) {
        console.error('Error cargando historial de pedidos:', error);
      } finally {
        setLoading(false);
      }
    }
    checkSessionAndFetch();
  }, []);

  // Estilos dinámicos para los badges según el estado del domicilio
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Pendiente': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'En preparación': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'En camino': return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      case 'Entregado': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      default: return 'bg-gray-50 text-gray-600 border-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'En preparación': return <Coffee size={14} className="animate-pulse" />;
      case 'En camino': return <Truck size={14} className="animate-bounce" />;
      case 'Entregado': return <CheckCircle2 size={14} />;
      default: return <Clock size={14} />;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 text-[#b49770] animate-spin" />
        <p className="text-sm font-medium text-gray-500">Cargando tu historial de compras...</p>
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  return (
    <div className="max-w-3xl mx-auto my-10 p-4 md:p-0 text-left">
      <div className="mb-8">
        <h2 className="text-2xl font-serif font-bold text-gray-800 tracking-wide">Mis Pedidos</h2>
        <p className="text-xs text-gray-500 mt-1">Revisa el historial de tus compras y haz seguimiento en tiempo real.</p>
      </div>

      {orders.length === 0 ? (
        /* Pantalla vacía estilizada cuando no hay registros */
        <div className="text-center py-14 bg-white rounded-[26px] border border-gray-100 p-6 shadow-sm">
          <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <ShoppingBag className="text-[#b49770]" size={22} />
          </div>
          <h3 className="text-sm font-bold text-gray-700">Aún no has hecho pedidos</h3>
          <p className="text-xs text-gray-400 mt-1">Cuando compres tus panes o desayunos favoritos, aparecerán en esta sección.</p>
        </div>
      ) : (
        /* Listado de pedidos */
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white border border-gray-100 rounded-[24px] p-5 md:p-6 shadow-sm hover:shadow-md transition">
              
              {/* Encabezado de la Tarjeta de Pedido */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-50 pb-4 mb-4">
                <div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">ID Pedido</span>
                  <p className="text-xs font-bold text-gray-700 truncate max-w-[180px] sm:max-w-xs">#{order.id.split('-')[0].toUpperCase()}</p>
                </div>
                <div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block text-right">Fecha</span>
                  <p className="text-xs font-medium text-gray-500">
                    {new Date(order.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                
                {/* Etiqueta de Estado */}
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${getStatusStyle(order.status)}`}>
                  {getStatusIcon(order.status)}
                  <span>{order.status}</span>
                </div>
              </div>

              {/* Detalle de los Productos Comprados */}
              <div className="space-y-2 mb-4">
                {order.order_items?.map((item: any) => (
                  <div key={item.id} className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#b49770] bg-amber-50 px-2 py-0.5 rounded-md">{item.quantity}x</span>
                      <span className="text-gray-700 font-medium">{item.product_name}</span>
                    </div>
                    <span className="text-gray-500 font-semibold">${(item.price * item.quantity).toLocaleString('es-CO')}</span>
                  </div>
                ))}
              </div>

              {/* Pie de la Tarjeta: Dirección y Total */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-gray-50 bg-gray-50/40 -mx-5 -mb-5 p-5 rounded-b-[24px]">
                <div className="text-xs text-gray-500">
                  <span className="font-bold text-gray-400 uppercase block text-[9px] tracking-wider">Entregar en:</span>
                  <span className="font-medium text-gray-700">{order.delivery_address}</span>
                  {order.delivery_neighborhood && <span className="font-bold text-gray-600"> (Barrio: {order.delivery_neighborhood})</span>}
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Total Pagado</span>
                  <span className="text-lg font-serif font-black text-gray-800">${Number(order.total_price).toLocaleString('es-CO')}</span>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
};