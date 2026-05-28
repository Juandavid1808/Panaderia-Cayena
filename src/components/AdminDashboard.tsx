import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Package, ShoppingBag, DollarSign, Clock, Users, Calendar, CreditCard, Download, Filter, RefreshCw } from 'lucide-react';
// 🚀 SECCIÓN BLINDADA
import { SeccionGestionAdmins } from '../components/SeccionGestionAdmins';


// Tipados para robustecer el proyecto
interface Pedido {
  id: string;
  created_at: string;
  status: string;
  total_price: number;
  payment_method?: string;
  metodo_pago?: string;
  payment_type?: string;
}

interface Producto {
  id: string;
  nombre: string;
  precio: number;
  stock: number;
  categoria: string;
}

export const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState<'pedidos' | 'inventario' | 'usuarios'>('pedidos');
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  
  // ESTADOS DE FILTRADO POR FECHA
  const [fechaDesde, setFechaDesde] = useState<string>('');
  const [fechaHasta, setFechaHasta] = useState<string>('');

  // ESTADOS DE SEGURIDAD INTERNOS
  const [usuarioLogueado, setUsuarioLogueado] = useState<any>(null);
  const [cargando, setCargando] = useState<boolean>(true);
  const [esAdmin, setEsAdmin] = useState<boolean>(false);

  const categoriesCayena = ['Desayunos', 'Panadería', 'Pastelería', 'Línea amarilla', 'Bebidas'];

  // 1. CARGAR DATOS, VALIDAR ROL Y ESCUCHAR EN TIEMPO REAL
  useEffect(() => {
    let channel: any;

    const verificarAccesoYDatos = async () => {
      try {
        const { data: authData } = await supabase.auth.getUser();
        const user = authData?.user;
        
        if (!user) {
          setEsAdmin(false);
          return;
        }

        setUsuarioLogueado(user);

        const { data: perfil, error: perfilError } = await supabase
          .from('profiles')
          .select('rol')
          .eq('id', user.id)
          .maybeSingle(); 

        if (perfilError) {
          console.error("Error consultando el perfil:", perfilError);
          setEsAdmin(false);
          return;
        }

        if (perfil && perfil.rol === 'admin') {
          setEsAdmin(true);
          await Promise.all([fetchPedidos(), fetchProductos()]);
        } else {
          setEsAdmin(false);
        }
      } catch (err) {
        console.error("Error validando permisos:", err);
        setEsAdmin(false);
      } finally {
        setCargando(false);
      }
    };

    verificarAccesoYDatos();

    channel = supabase
      .channel('cambios-pedidos')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchPedidos();
      })
      .subscribe();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  const fetchPedidos = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (data) {
      setPedidos(data as Pedido[]);
    }
    if (error) console.error("Error al traer pedidos:", error);
  };

  const fetchProductos = async () => {
    const { data } = await supabase.from('productos').select('*').order('id', { ascending: true });
    if (data) setProductos(data as Producto[]);
  };

  const actualizarEstadoPedido = async (id: string, nuevoEstado: string) => {
    await supabase.from('orders').update({ status: nuevoEstado }).eq('id', id);
    fetchPedidos();
  };

  const actualizarStock = async (id: string, nuevoStock: number) => {
    await supabase.from('productos').update({ stock: nuevoStock }).eq('id', id);
    fetchProductos();
  };

  // 📄 FUNCIÓN MEJORADA: Anti-bloqueo de popups y carga asíncrona segura
  const descargarFactura = async (pedido: Pedido) => {
    // 1. Abrimos la pestaña inmediatamente en el hilo del click para engañar al bloqueador del navegador
    const ventanaImpresion = window.open('', '_blank');
    if (!ventanaImpresion) {
      alert("Por favor, permite los pop-ups para poder imprimir las facturas de Cayena.");
      return;
    }

    // Ponemos un loader temporal en la pestaña nueva mientras carga de Supabase
    ventanaImpresion.document.write(`<html><head><title>Cargando Factura...</title></head><body style="font-family:sans-serif; text-align:center; padding-top:50px; color:#666;"><p>Generando comprobante Cayena...</p></body></html>`);

    try {
      const { data: itemsDelPedido, error: errorItems } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', pedido.id);

      if (errorItems || !itemsDelPedido || itemsDelPedido.length === 0) {
        ventanaImpresion.document.body.innerHTML = `<p style="color:red; font-weight:bold; text-align:center; margin-top:50px;">Error al cargar los ítems del pedido: ${errorItems?.message || 'No hay registros asociados.'}</p>`;
        return;
      }

      const fechaPedido = new Date(pedido.created_at).toLocaleString('es-CO');
      const metodoPagoFactura = pedido.payment_method || pedido.metodo_pago || pedido.payment_type || 'Efectivo';

      const filasTablaHtml = itemsDelPedido.map((item: any) => {
        const cantidad = item.quantity || 1;
        const nombre = item.product_name || 'Producto de Cayena';
        const precioUnitario = item.price || 0;
        const subtotal = cantidad * precioUnitario;

        return `
          <tr>
            <td style="text-align: center;">${cantidad}</td>
            <td style="text-transform: capitalize;">${nombre}</td>
            <td style="text-align: right;">$${precioUnitario.toLocaleString('es-CO')}</td>
            <td style="text-align: right; font-weight: bold;">$${subtotal.toLocaleString('es-CO')}</td>
          </tr>
        `;
      }).join('');

      // Limpiamos e inyectamos el HTML real
      ventanaImpresion.document.open();
      ventanaImpresion.document.write(`
        <html>
          <head>
            <title>Factura Cayena - #${pedido.id.slice(0, 8)}</title>
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; background-color: #fff; }
              .header { text-align: center; border-bottom: 2px solid #b49770; padding-bottom: 20px; }
              .title { color: #b49770; font-size: 32px; font-weight: 900; margin: 0; letter-spacing: 1px; }
              .subtitle { margin: 5px 0 0 0; font-size: 14px; color: #666; text-transform: uppercase; font-weight: 600; }
              .info { margin: 25px 0; font-size: 14px; line-height: 1.7; }
              .info p { margin: 4px 0; }
              .table { width: 100%; border-collapse: collapse; margin-top: 25px; }
              .table th { background-color: #f9f6f0; color: #b49770; padding: 12px; text-align: left; font-weight: bold; border-bottom: 2px solid #b49770; font-size: 13px; text-transform: uppercase; }
              .table td { padding: 12px; border-bottom: 1px solid #eee; font-size: 14px; }
              .total-container { width: 100%; margin-top: 30px; border-top: 2px dashed #b49770; padding-top: 15px; text-align: right; }
              .total { font-size: 22px; font-weight: 900; color: #222; }
              .footer { text-align: center; margin-top: 60px; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 15px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1 class="title">CAYENA</h1>
              <p class="subtitle">Comprobante de Venta Electrónico</p>
            </div>
            
            <div class="info">
              <p><strong>ID del Pedido:</strong> #${pedido.id}</p>
              <p><strong>Fecha y Hora:</strong> ${fechaPedido}</p>
              <p><strong>Método de Pago:</strong> <span style="text-transform: capitalize;">${metodoPagoFactura}</span></p>
              <p><strong>Estado del Envío:</strong> ${pedido.status || 'Entregado'}</p>
            </div>

            <table class="table">
              <thead>
                <tr>
                  <th style="width: 10%; text-align: center;">Cant.</th>
                  <th style="width: 50%;">Descripción del Producto</th>
                  <th style="width: 20%; text-align: right;">Precio Unit.</th>
                  <th style="width: 20%; text-align: right;">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${filasTablaHtml}
              </tbody>
            </table>

            <div class="total-container">
              <span class="total">TOTAL PAGADO: $${(pedido.total_price || 0).toLocaleString('es-CO')}</span>
            </div>

            <div class="footer">
              <p>¡Gracias por apoyar lo local! Tu compra en Cayena alegra nuestro día.</p>
              <p>Neiva, Huila, Colombia</p>
            </div>

            <script>
              window.onload = function() { window.print(); window.close(); }
            </script>
          </body>
        </html>
      `);
      ventanaImpresion.document.close();
    } catch (err) {
      console.error("Error crítico en frontend:", err);
      if (ventanaImpresion) ventanaImpresion.close();
    }
  };

  // 🛠️ FILTRADO DINÁMICO DE PEDIDOS ANTES DE AGRUPARLOS
  const pedidosFiltrados = pedidos.filter((pedido) => {
    if (!pedido.created_at) return false;
    const fechaPedidoStr = pedido.created_at.split('T')[0];
    if (fechaDesde && fechaPedidoStr < fechaDesde) return false;
    if (fechaHasta && fechaPedidoStr > fechaHasta) return false;
    return true;
  });

  // 🛠️ AGRUPAR PEDIDOS POR FECHA
  const agruparPedidosPorFecha = (listaPedidos: Pedido[]) => {
    return listaPedidos.reduce((grupos: { [key: string]: Pedido[] }, pedido) => {
      if (!pedido.created_at) return grupos;
      
      const fecha = new Date(pedido.created_at);
      const opciones: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
      const fechaFormateada = fecha.toLocaleDateString('es-CO', opciones);

      if (!grupos[fechaFormateada]) {
        grupos[fechaFormateada] = [];
      }
      grupos[fechaFormateada].push(pedido);
      return grupos;
    }, {});
  };

  const totalVentas = pedidosFiltrados.filter(p => p?.status === 'Entregado').reduce((acc, p) => acc + (p?.total_price || 0), 0);
  const pedidosPendientes = pedidosFiltrados.filter(p => p?.status !== 'Entregado').length;
  const pedidosAgrupados = agruparPedidosPorFecha(pedidosFiltrados);

  const limpiarFiltrosFechas = () => {
    setFechaDesde('');
    setFechaHasta('');
  };

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#b49770] mx-auto"></div>
          <p className="text-gray-500 font-medium text-sm">Verificando credenciales de seguridad...</p>
        </div>
      </div>
    );
  }

  if (!esAdmin) {
    window.location.href = '/';
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-10 text-left transition-colors duration-300">
      <div>
        <h1 className="text-4xl font-black text-gray-800 dark:text-slate-100">Panel Administrativo</h1>
        <p className="text-gray-500 dark:text-slate-400">Control de pedidos, inventario y seguridad de Cayena.</p>
      </div>

      {/* TARJETAS DE MÉTRICAS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button onClick={() => setActiveTab('pedidos')} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-lg flex items-center gap-5 text-left transition-all duration-200 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] w-full group">
          <div className="bg-green-100 dark:bg-green-950/50 p-4 rounded-2xl text-green-600 transition-transform group-hover:scale-110"><DollarSign size={28} /></div>
          <div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wide">Ventas {fechaDesde || fechaHasta ? 'Filtradas' : 'Totales'}</p>
            <p className="text-2xl font-black text-gray-800 dark:text-slate-100">${totalVentas.toLocaleString('es-CO')}</p>
          </div>
        </button>

        <button onClick={() => setActiveTab('pedidos')} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-lg flex items-center gap-5 text-left transition-all duration-200 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] w-full group">
          <div className="bg-amber-100 dark:bg-amber-950/50 p-4 rounded-2xl text-amber-600 transition-transform group-hover:scale-110"><Clock size={28} /></div>
          <div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wide">Pedidos Activos</p>
            <p className="text-2xl font-black text-gray-800 dark:text-slate-100">{pedidosPendientes} por atender</p>
          </div>
        </button>

        <button onClick={() => setActiveTab('inventario')} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-lg flex items-center gap-5 text-left transition-all duration-200 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] w-full group">
          <div className="bg-blue-100 dark:bg-blue-950/50 p-4 rounded-2xl text-blue-600 transition-transform group-hover:scale-110"><Package size={28} /></div>
          <div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wide">Productos en Carta</p>
            <p className="text-2xl font-black text-gray-800 dark:text-slate-100">{(productos || []).length} ítems</p>
          </div>
        </button>
      </div>

      {/* BOTONES DE NAVEGACIÓN INTERNA */}
      <div className="flex gap-4 border-b border-gray-200 dark:border-slate-800 pb-2">
        <button onClick={() => setActiveTab('pedidos')} className={`flex items-center gap-2 pb-2 px-4 font-bold text-lg transition-all ${activeTab === 'pedidos' ? 'border-b-4 border-[#b49770] text-[#b49770]' : 'text-gray-400'}`}><ShoppingBag size={20} /> Pedidos Recientes</button>
        <button onClick={() => setActiveTab('inventario')} className={`flex items-center gap-2 pb-2 px-4 font-bold text-lg transition-all ${activeTab === 'inventario' ? 'border-b-4 border-[#b49770] text-[#b49770]' : 'text-gray-400'}`}><Package size={20} /> Inventario y Stock</button>
        <button onClick={() => setActiveTab('usuarios')} className={`flex items-center gap-2 pb-2 px-4 font-bold text-lg transition-all ${activeTab === 'usuarios' ? 'border-b-4 border-[#b49770] text-[#b49770]' : 'text-gray-400'}`}><Users size={20} /> Gestión de Personal</button>
      </div>

      {/* CONTENIDO INTERNO */}
      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-[32px] p-8 shadow-xl">
        
        {activeTab === 'pedidos' && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-slate-100">Monitoreo en Vivo 🛵</h2>
              
              <div className="flex flex-wrap items-center gap-3 bg-gray-50 dark:bg-slate-950 p-3 rounded-2xl border border-gray-100 dark:border-slate-800/80">
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400 uppercase tracking-wide px-1">
                  <Filter size={14} className="text-[#b49770]" /> Filtrar:
                </div>
                <input 
                  type="date" 
                  value={fechaDesde}
                  onChange={(e) => setFechaDesde(e.target.value)}
                  className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#b49770]"
                  title="Fecha Inicial"
                />
                <span className="text-xs text-gray-400 font-bold">al</span>
                <input 
                  type="date" 
                  value={fechaHasta}
                  onChange={(e) => setFechaHasta(e.target.value)}
                  className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#b49770]"
                  title="Fecha Final"
                />
                {(fechaDesde || fechaHasta) && (
                  <button 
                    onClick={limpiarFiltrosFechas}
                    className="p-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/30 dark:hover:bg-amber-950/60 text-[#b49770] rounded-lg transition"
                    title="Restablecer filtros"
                  >
                    <RefreshCw size={14} />
                  </button>
                )}
              </div>
            </div>
            
            {Object.keys(pedidosAgrupados).length === 0 ? (
              <p className="text-gray-400 dark:text-slate-500 font-medium py-4">No se encontraron pedidos para el rango de fechas seleccionado en Cayena.</p>
            ) : (
              <div className="space-y-10">
                {Object.keys(pedidosAgrupados).map((fechaStr) => (
                  <div key={fechaStr} className="space-y-4">
                    <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-950 px-4 py-2.5 rounded-2xl border border-gray-100 dark:border-slate-800/60 w-fit">
                      <Calendar size={18} className="text-[#b49770]" />
                      <span className="font-black text-[#b49770] text-sm uppercase tracking-wider">{fechaStr}</span>
                      <span className="text-xs text-gray-400 font-bold ml-1">({pedidosAgrupados[fechaStr].length} pedidos)</span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-gray-100 dark:border-slate-800 text-gray-400 text-sm">
                            <th className="pb-4">Hora</th>
                            <th className="pb-4">ID Pedido</th>
                            <th className="pb-4">Método Pago</th>
                            <th className="pb-4">Total</th>
                            <th className="pb-4">Estado</th>
                            <th className="pb-4 text-center">Factura</th>
                            <th className="pb-4 text-center">Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pedidosAgrupados[fechaStr].map((pedido) => {
                            const hora = new Date(pedido.created_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
                            const metodoPagoReal = pedido.payment_method || pedido.metodo_pago || pedido.payment_type || 'efectivo';
                            const normalizado = String(metodoPagoReal).toLowerCase();

                            let colorBadge = "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
                            if (normalizado.includes('nequi')) {
                              colorBadge = "bg-purple-100 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900/60 font-black";
                            } else if (normalizado.includes('daviplata')) {
                              colorBadge = "bg-red-100 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900/60 font-black";
                            } else if (normalizado.includes('tarjeta')) {
                              colorBadge = "bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/60 font-black";
                            } else if (normalizado.includes('efectivo')) {
                              colorBadge = "bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/60 font-black";
                            }

                            return (
                              <tr key={pedido?.id} className="border-b border-gray-50 dark:border-slate-800/50 text-gray-700 dark:text-slate-300 hover:bg-gray-50/50 dark:hover:bg-slate-950/30 transition-colors">
                                <td className="py-4 font-medium text-xs text-gray-400">{hora}</td>
                                <td className="py-4 font-mono text-sm">#{pedido?.id?.slice(0, 8)}</td>
                                <td className="py-4">
                                  <div className="flex items-center gap-1.5 text-sm">
                                    <CreditCard size={14} className="text-gray-400" />
                                    <span className={`capitalize px-2.5 py-1 rounded-xl text-xs shadow-sm tracking-wide transition-all duration-300 ${colorBadge}`}>
                                      {metodoPagoReal}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-4 font-bold text-gray-800 dark:text-slate-100">${(pedido?.total_price || 0).toLocaleString('es-CO')}</td>
                                <td className="py-4">
                                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${pedido?.status === 'Entregado' ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'}`}>
                                    {pedido?.status || 'Pendiente'}
                                  </span>
                                </td>
                                <td className="py-4 text-center">
                                  <button onClick={() => descargarFactura(pedido)} className="p-2 bg-gray-100 hover:bg-[#b49770] text-gray-600 hover:text-white rounded-xl transition-all duration-200" title="Imprimir Factura"><Download size={16} /></button>
                                </td>
                                <td className="py-4 flex justify-center gap-2">
                                  <button onClick={() => actualizarEstadoPedido(pedido?.id, 'En Camino')} className="bg-[#b49770] hover:bg-[#a3865f] text-white text-xs px-3 py-2 rounded-xl font-bold transition">Despachar 🛵</button>
                                  <button onClick={() => actualizarEstadoPedido(pedido?.id, 'Entregado')} className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-2 rounded-xl font-bold transition">Entregado ✅</button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PESTAÑA 2: INVENTARIO */}
        {activeTab === 'inventario' && (
          <div className="space-y-10">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-slate-100">Administrar Productos 🥖</h2>
              <p className="text-sm text-gray-400 mt-1">Inventario total clasificado por líneas de producción.</p>
            </div>

            {!productos || productos.length === 0 ? (
              <p className="text-gray-400 dark:text-slate-500 font-medium py-4">No se encontraron productos en la base de datos de Cayena.</p>
            ) : (
              <div className="space-y-12">
                {categoriesCayena.map((cat) => {
                  const productosFiltrados = productos.filter((prod) => prod?.categoria?.toLowerCase() === cat.toLowerCase());
                  if (productosFiltrados.length === 0) return null;
                  return (
                    <div key={cat} className="space-y-4 border-b border-gray-100 dark:border-slate-800/60 pb-8 last:border-none last:pb-0">
                      <h3 className="text-base font-black text-[#b49770] uppercase tracking-widest flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#b49770]"></span>{cat}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {productosFiltrados.map((prod) => (
                          <div key={prod?.id} className="p-5 border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 rounded-2xl flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
                            <div>
                              <h4 className="font-bold text-lg text-gray-800 dark:text-slate-100 capitalize">{prod?.nombre || 'Producto sin nombre'}</h4>
                              <p className="text-sm text-[#b49770] font-bold">${(prod?.precio || 0).toLocaleString('es-CO')}</p>
                            </div>
                            <div className="mt-4 flex items-center justify-between gap-4">
                              <span className="text-xs text-gray-400 font-bold uppercase">Stock Disponible:</span>
                              <input type="number" defaultValue={prod?.stock || 0} onBlur={(e) => actualizarStock(prod?.id, parseInt(e.target.value) || 0)} className="w-20 p-2 text-center bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-gray-800 dark:text-slate-100 font-bold focus:ring-2 focus:ring-[#b49770]" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* PESTAÑA 3: GESTIÓN DE PERSONAL */}
        {activeTab === 'usuarios' && (
          <SeccionGestionAdmins userSesionActual={usuarioLogueado} />
        )}

      </div>
    </div>
  );
};