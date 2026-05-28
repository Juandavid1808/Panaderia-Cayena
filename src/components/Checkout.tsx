import emailjs from '@emailjs/browser';
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useCart } from '../context/CartContext';
import { 
  CreditCard, Loader2, MapPin, Phone, User, 
  Banknote, Smartphone, ChevronRight, Hash, Mail, Store 
} from 'lucide-react';
import Swal from 'sweetalert2';

// Interfaz para los datos de facturación
interface DatosFacturacion {
  nombre: string;
  apellidos: string;
  documento: string;
  direccion: string;
  telefono: string;
  email_factura: string;
}

export const Checkout = () => {
  const { cart, totalPrice, clearCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Capturamos el tipo de entrega que viene del Carrito (por defecto 'domicilio')
  const tipoEntrega = location.state?.tipoEntrega || 'domicilio';

  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null); // SUPABASE INTEGRATION: Estado para guardar el ID del usuario
  const [metodo, setMetodo] = useState<'efectivo' | 'nequi' | 'daviplata' | 'tarjeta' | null>(null);
  
  const [datos, setDatos] = useState<DatosFacturacion>({ 
    nombre: '', 
    apellidos: '', 
    documento: '', 
    direccion: '', 
    telefono: '', 
    email_factura: '' 
  });

  // Ajuste dinámico de tarifa y textos según la selección
  const TARIFA_DOMICILIO = tipoEntrega === 'domicilio' ? 4000 : 0;
  const granTotal = totalPrice + TARIFA_DOMICILIO;

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth', { state: { from: location }, replace: true });
      } else {
        setUserId(session.user.id); // SUPABASE INTEGRATION: Almacenamos el UUID del usuario
        setDatos(prev => ({ ...prev, email_factura: session.user.email || '' }));
        
        // Opcional: Auto-completar dirección si el usuario ya tiene una guardada en su perfil
        const { data: userAddresses } = await supabase
          .from('addresses')
          .select('*')
          .eq('user_id', session.user.id)
          .limit(1);
        
        if (userAddresses && userAddresses.length > 0) {
          setDatos(prev => ({ 
            ...prev, 
            direccion: userAddresses[0].neighborhood 
              ? `${userAddresses[0].address_line} (Barrio: ${userAddresses[0].neighborhood})` 
              : userAddresses[0].address_line 
          }));
        }

        setLoading(false);
      }
    };
    checkUser();
  }, [navigate, location]);

  const enviarFactura = async () => {
    try {
      const templateParams = {
        to_email: datos.email_factura,
        customer_name: `${datos.nombre} ${datos.apellidos}`,
        document: datos.documento,
        address: tipoEntrega === 'domicilio' ? datos.direccion : 'Recoge en Tienda (Sede Principal)',
        phone: datos.telefono,
        method: metodo?.toUpperCase(),
        subtotal: totalPrice.toLocaleString('es-CO'),
        domicilio: TARIFA_DOMICILIO.toLocaleString('es-CO'),
        total: granTotal.toLocaleString('es-CO'),
        items: cart.map(p => `${p.cantidad}x ${p.nombre}`).join(', ')
      };

      await emailjs.send(
        'service_lspwk3s',
        'template_6ua6kjo',
        templateParams,
        '-e6oYudVLvkhqNmZn'
      );
      return true;
    } catch (error) {
      console.error("Error EmailJS:", error);
      return false;
    }
  };

  const handleProcesoPago = async () => {
    if (!userId) return;

    Swal.fire({ 
      title: 'Validando Transacción', 
      text: 'Estamos procesando tu pedido y generando la factura...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading() 
    });

    try {
      // ==========================================
      // SUPABASE INTEGRATION: PASO 1 - Crear la Orden Principal
      // ==========================================
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([
          {
            user_id: userId,
            total_price: granTotal,
            status: 'Pendiente',
            delivery_address: tipoEntrega === 'domicilio' ? datos.direccion : 'Recoge en Tienda (Sede Principal)',
            delivery_neighborhood: tipoEntrega === 'domicilio' ? 'Ingresado en checkout' : null,
            payment_method: metodo // Mapeo del estado del botón seleccionado
          }
        ])
        .select()
        .single();

      if (orderError) throw orderError;

      // ==========================================
      // SUPABASE INTEGRATION: PASO 2 - Preparar e Insertar Productos (Items)
      // ==========================================
      const orderItemsToInsert = cart.map((item) => ({
        order_id: orderData.id,
        product_name: item.nombre,
        quantity: item.cantidad,
        price: item.precio
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItemsToInsert);

      if (itemsError) throw itemsError;

      // ==========================================
      // 🔥 PASO 2.5 - Descontar el Stock en la tabla 'productos'
      // ==========================================
      const promesasActualizacionStock = cart.map(async (item) => {
        // 1. Buscamos el stock que tiene el producto actualmente
        const { data: productoActual } = await supabase
          .from('productos')
          .select('stock')
          .eq('id', item.id)
          .single();

        if (productoActual) {
          // 2. Restamos previniendo que baje de cero
          const nuevoStock = Math.max(0, (productoActual.stock || 0) - item.cantidad);

          // 3. Modificamos la fila en la tabla de la base de datos
          await supabase
            .from('productos')
            .update({ stock: nuevoStock })
            .eq('id', item.id);
        }
      });

      // Resolvemos todas las consultas en paralelo
      await Promise.all(promesasActualizacionStock);

      // ==========================================
      // PASO 3 - Envío de Correo Electrónico
      // ==========================================
      const exitoFactura = await enviarFactura();

      // Mostrar mensaje de éxito adaptado
      Swal.fire({
        icon: exitoFactura ? 'success' : 'warning',
        title: exitoFactura ? '¡Pedido Exitoso!' : 'Pedido Registrado',
        text: exitoFactura 
          ? `Tu orden fue registrada. Factura enviada a ${datos.email_factura}.` 
          : 'Tu orden fue guardada en el sistema, pero no se pudo despachar el correo.',
        confirmButtonColor: '#b49770'
      });

      // Limpiar y Redirigir al historial para seguimiento
      clearCart();
      navigate('/pedidos');

    } catch (error: any) {
      console.error("Error procesando compra:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error en la compra',
        text: `No pudimos registrar tu pedido: ${error.message}`,
        confirmButtonColor: '#b49770'
      });
    }
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-50">
      <Loader2 className="animate-spin text-[#b49770]" size={40} />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-10 space-y-12 text-left">
      <section className="space-y-6">
        <h2 className="text-3xl font-serif font-bold text-gray-700">Detalles de facturación</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InputGroup label="Nombre" value={datos.nombre} onChange={(v) => setDatos({...datos, nombre: v})} icon={<User size={18}/>} />
          <InputGroup label="Apellidos" value={datos.apellidos} onChange={(v) => setDatos({...datos, apellidos: v})} icon={<User size={18}/>} />
          <InputGroup label="C.C o NIT" value={datos.documento} onChange={(v) => setDatos({...datos, documento: v})} icon={<Hash size={18}/>} />
          <InputGroup label="Teléfono" value={datos.telefono} onChange={(v) => setDatos({...datos, telefono: v})} icon={<Phone size={18}/>} />
          
          {/* RENDERIZADO CONDICIONAL DE DIRECCIÓN */}
          {tipoEntrega === 'domicilio' ? (
            <div className="md:col-span-2">
              <InputGroup label="Dirección de entrega" value={datos.direccion} onChange={(v) => setDatos({...datos, direccion: v})} icon={<MapPin size={18}/>} />
            </div>
          ) : (
            <div className="md:col-span-2 bg-[#b49770]/10 border border-[#b49770]/30 rounded-2xl p-5 flex items-start gap-4">
              <div className="p-3 bg-[#b49770] rounded-xl text-white mt-0.5">
                <Store size={22} />
              </div>
              <div>
                <h4 className="font-bold text-gray-800 text-base">Retiras tu pedido en la tienda</h4>
                <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                  No necesitas ingresar dirección de envío. Puedes pasar a recoger tus productos directamente en la sede principal de <strong>Cayena Panadería</strong> una vez confirmado el pago.
                </p>
              </div>
            </div>
          )}

          <div className="md:col-span-2">
            <InputGroup label="Correo electrónico" value={datos.email_factura} onChange={(v) => setDatos({...datos, email_factura: v})} icon={<Mail size={18}/>} />
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-3xl font-serif font-bold text-gray-700">Tu pedido</h2>
        <div className="border rounded-xl overflow-hidden shadow-sm bg-white">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-4 font-bold text-gray-600">Producto</th>
                <th className="p-4 font-bold text-gray-600 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {cart.map((item) => (
                <tr key={item.id} className="border-b last:border-0">
                  <td className="p-4 text-gray-500">
                    {item.nombre} <span className="ml-4 text-gray-400 font-bold italic">X{item.cantidad}</span>
                  </td>
                  <td className="p-4 text-right font-black text-gray-700">${(item.precio * item.cantidad).toLocaleString('es-CO')}</td>
                </tr>
              ))}
              
              {/* Desglose dinámico de la tarifa */}
              <tr className="border-b bg-gray-50/50 text-sm">
                <td className="p-4 text-gray-500 italic">
                  {tipoEntrega === 'domicilio' ? 'Costo de envío (Domicilio)' : 'Costo de entrega (Recoger en Tienda)'}
                </td>
                <td className="p-4 text-right font-bold text-gray-600">
                  {TARIFA_DOMICILIO > 0 ? `$${TARIFA_DOMICILIO.toLocaleString('es-CO')}` : 'Gratis'}
                </td>
              </tr>

              <tr className="bg-gray-100 border-t-2">
                <td className="p-4 text-lg font-bold">Total a pagar</td>
                <td className="p-4 text-right text-2xl font-black text-[#b49770]">${granTotal.toLocaleString('es-CO')}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <div className="flex flex-col md:flex-row items-end justify-between gap-8 pt-8">
        <div className="w-full md:w-1/2 space-y-4">
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Método de pago</p>
          <div className="grid grid-cols-2 gap-3">
            <PaymentBtn active={metodo === 'efectivo'} onClick={() => setMetodo('efectivo')} label="Efectivo" icon={<Banknote size={16}/>} />
            <PaymentBtn active={metodo === 'nequi'} onClick={() => setMetodo('nequi')} label="Nequi" icon={<Smartphone size={16}/>} />
            <PaymentBtn active={metodo === 'daviplata'} onClick={() => setMetodo('daviplata')} label="Daviplata" icon={<Smartphone size={16}/>} />
            <PaymentBtn active={metodo === 'tarjeta'} onClick={() => setMetodo('tarjeta')} label="Tarjeta" icon={<CreditCard size={16}/>} />
          </div>
        </div>

        <button 
          disabled={!metodo || !datos.nombre || !datos.telefono || (tipoEntrega === 'domicilio' && !datos.direccion)}
          onClick={handleProcesoPago}
          className="w-full md:w-auto bg-[#daff3e] text-gray-900 px-12 py-5 rounded-2xl font-black text-xl hover:bg-[#cbe635] disabled:bg-gray-200 transition-all flex items-center justify-center gap-2"
        >
          Proceso de pago <ChevronRight size={20}/>
        </button>
      </div>
    </div>
  );
};

const InputGroup = ({ label, value, onChange, icon }: { label: string, value: string, onChange: (v: string) => void, icon: React.ReactNode }) => (
  <div className="space-y-2">
    <label className="text-sm font-semibold text-gray-500 ml-1">{label}</label>
    <div className="relative">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300">{icon}</span>
      <input 
        type="text" 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-4 pl-12 bg-gray-50 rounded-xl border border-gray-100 outline-none focus:border-[#b49770] shadow-inner"
      />
    </div>
  </div>
);

const PaymentBtn = ({ active, onClick, label, icon }: { active: boolean, onClick: () => void, label: string, icon: React.ReactNode }) => (
  <button 
    type="button"
    onClick={onClick}
    className={`p-4 rounded-xl border-2 flex items-center justify-center gap-2 transition-all ${active ? 'border-[#b49770] bg-[#b49770]/10 text-[#b49770]' : 'border-gray-50 text-gray-400'}`}
  >
    {icon}
    <span className="text-xs font-black uppercase">{label}</span>
  </button>
);

export default Checkout;