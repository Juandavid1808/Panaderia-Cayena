import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Share2, Globe, MessageCircle, Clock, MapPin, ExternalLink, Phone } from 'lucide-react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Home from './components/Home'; 
import ProductGrid from './components/ProductGrid';
import Footer from './components/Footer';
import { CartProvider } from './context/CartContext';
import CartPage from './pages/Cart.tsx';
import Checkout from './components/Checkout';
import { Auth } from './components/Auth';
import { ResetPassword } from './components/ResetPassword'; 
import { Addresses } from './components/Addresses'; 
import { Orders } from './components/Orders';
import { AdminRoute } from './components/AdminRoute';
import { AdminDashboard } from './components/AdminDashboard';

// Componente de Horarios y Contacto - ADAPTADO A MODO OSCURO
const HorariosSection = () => {
  const redes = [
    { 
      name: 'WhatsApp', 
      icon: <MessageCircle size={24} />, 
      url: 'https://wa.me/qr/UVUBVX7M5NQXA1',
      color: 'hover:text-green-500 dark:hover:text-green-400',
      bg: 'bg-green-50 dark:bg-green-950/30'
    },
    { 
      name: 'Instagram', 
      icon: <Share2 size={24} />, 
      url: 'https://instagram.com/panaderiacayena', 
      color: 'hover:text-pink-500 dark:hover:text-pink-400',
      bg: 'bg-pink-50 dark:bg-pink-950/30'
    },
    { 
      name: 'Facebook', 
      icon: <Globe size={24} />, 
      url: 'https://facebook.com/panaderiacayena', 
      color: 'hover:text-blue-600 dark:hover:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-950/30'
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-6 py-20">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
        {/* Tarjeta de Horarios */}
        <div className="bg-white dark:bg-slate-900 p-10 rounded-[40px] shadow-2xl border border-gray-50 dark:border-slate-800 text-left transition-colors duration-300">
          <div className="flex items-center gap-4 mb-10">
            <div className="bg-[#b49770] p-4 rounded-2xl text-white shadow-lg shadow-[#b49770]/20">
              <Clock size={30} />
            </div>
            <h2 className="text-3xl font-black text-gray-800 dark:text-slate-100 tracking-tight">Horarios de Atención</h2>
          </div>

          <div className="space-y-6">
            {[
              { dias: 'Lunes a Viernes', horas: '6:00 AM - 9:00 PM' },
              { dias: 'Sábados', horas: '6:30 AM - 9:30 PM' },
              { dias: 'Domingos', horas: '7:00 AM - 8:00 PM' },
              { dias: 'Festivos', horas: '8:00 AM - 7:00 PM' },
            ].map((item, idx) => (
              <div key={idx} className="flex justify-between items-center border-b border-gray-50 dark:border-slate-800 pb-5">
                <span className="font-bold text-gray-600 dark:text-slate-300 text-lg">{item.dias}</span>
                <span className="text-[#b49770] font-bold bg-[#b49770]/10 px-5 py-2 rounded-xl text-sm">
                  {item.horas}
                </span>
              </div>
            ))}
          </div>
          
          <div className="mt-10 flex items-center gap-2 text-gray-400 dark:text-slate-500 text-sm italic">
            <MapPin size={16} />
            <span>Horarios válidos para sedes Estación, Tatacoa y Sevilla.</span>
          </div>
        </div>

        {/* Tarjeta de Redes y Conexión */}
        <div className="text-left space-y-10">
          <div>
            <h2 className="text-5xl font-black text-gray-800 dark:text-slate-100 mb-6">¡Conéctate con nosotros!</h2>
            <p className="text-gray-500 dark:text-slate-400 text-xl leading-relaxed">
              ¿Tienes un evento especial en Neiva? Síguenos o escríbenos para pedidos al por mayor.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {redes.map((red, idx) => (
              <a
                key={idx}
                href={red.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center justify-between p-6 rounded-3xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all duration-300 hover:shadow-xl group ${red.color}`}
              >
                <div className="flex items-center gap-5">
                  <div className={`p-4 rounded-2xl transition-colors ${red.bg} text-gray-500 group-hover:text-inherit`}>
                    {red.icon}
                  </div>
                  <span className="text-2xl font-bold text-gray-700 dark:text-slate-200 group-hover:text-inherit">{red.name}</span>
                </div>
                <ExternalLink size={20} className="text-gray-300 dark:text-slate-600 group-hover:translate-x-1 transition-transform" />
              </a>
            ))}
          </div>

          <div className="p-8 bg-[#b49770] rounded-[35px] text-white shadow-xl shadow-[#b49770]/30 flex items-center justify-between">
            <div>
              <p className="font-bold opacity-80 uppercase text-xs tracking-widest mb-1">Central de Pedidos</p>
              <p className="text-3xl font-black">310 123 4567</p>
            </div>
            <div className="bg-white/20 p-4 rounded-full">
              <Phone size={32} fill="white" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        {/* 1. SE CAMBIARON LAS CLASES DE ESTE CONTENEDOR PARA HACERLO OSCURO GLOBALMENTE */}
        <div className="min-h-screen bg-[#f9f9f9] dark:bg-slate-950 text-gray-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-300">
          <Navbar />
          
          <main className="flex-grow">
            <Routes>
              <Route path="/login" element={<Auth />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/direcciones" element={<Addresses />} />
              <Route path="/pedidos" element={<Orders />} />
              <Route path="/admin" element={
              <AdminRoute>
              <AdminDashboard />
              </AdminRoute>
              } />
              
              <Route path="/reset-password" element={<ResetPassword />} />

              <Route path="/" element={
                <>
                  <Hero />
                  <Home />
                </>
              } />

              <Route path="/productos/:categoria" element={
                <div className="max-w-7xl mx-auto px-10 py-16">
                  <ProductGrid />
                </div>
              } />

              <Route path="/horarios" element={<HorariosSection />} />
              <Route path="/carrito" element={<CartPage />} />

              <Route path="/cuenta" element={
                <div className="max-w-7xl mx-auto px-10 py-20 text-center">
                  <h2 className="text-3xl font-bold text-gray-800 dark:text-slate-100">Mi Cuenta</h2>
                  <p className="text-gray-500 dark:text-slate-400 mt-4">Inicia sesión para ver tu historial de Cayena.</p>
                </div>
              } />
            </Routes>
          </main>

          <Footer />
        </div>
      </BrowserRouter>
    </CartProvider>
  );
}

export default App;