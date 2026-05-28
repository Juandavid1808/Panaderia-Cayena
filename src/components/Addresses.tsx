import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Auth } from './Auth';
import { MapPin, Trash2, Plus, X, Loader2, Home } from 'lucide-react';

export const Addresses = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);

  // Estados del formulario (Se añade el estado para neighborhood)
  const [title, setTitle] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    async function checkSessionAndFetch() {
      try {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);

        if (session?.user) {
          fetchAddresses(session.user.id);
        }
      } catch (error) {
        console.error('Error inicializando direcciones:', error);
      } finally {
        setLoading(false);
      }
    }
    checkSessionAndFetch();
  }, []);

  const fetchAddresses = async (userId: string) => {
    const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', userId) // <-- Volvemos a meter esta línea clave para usar el userId
      .order('created_at', { ascending: false });

    if (!error && data) {
      setAddresses(data);
    }
  };
  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id) return;

    try {
      setSubmitting(true);
      const newAddress = {
        user_id: session.user.id,
        title: title.trim(),
        address_line: addressLine.trim(),
        neighborhood: neighborhood.trim(), // Enviamos el barrio a Supabase
        description: description.trim() || null,
      };

      const { error } = await supabase.from('addresses').insert([newAddress]);
      if (error) throw error;

      // Limpiar el formulario
      setTitle('');
      setAddressLine('');
      setNeighborhood('');
      setDescription('');
      setShowForm(false);
      fetchAddresses(session.user.id);
    } catch (error: any) {
      alert(`Error al añadir dirección: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!confirm('¿Seguro que deseas eliminar esta dirección?')) return;

    const { error } = await supabase.from('addresses').delete().eq('id', id);
    if (!error && session?.user?.id) {
      fetchAddresses(session.user.id);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 text-[#b49770] animate-spin" />
        <p className="text-sm font-medium text-gray-500">Cargando tus direcciones...</p>
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  return (
    <div className="max-w-2xl mx-auto my-10 p-4 md:p-0 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-serif font-bold text-gray-800 tracking-wide">Mis Direcciones</h2>
          <p className="text-xs text-gray-500 mt-1">Administra los lugares de entrega para tus pedidos a domicilio.</p>
        </div>
        
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center justify-center gap-2 bg-[#b49770] hover:bg-[#a3865f] text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-sm transition active:scale-95"
          >
            <Plus size={16} />
            Nueva Dirección
          </button>
        )}
      </div>

      {/* Formulario con el input de Barrio */}
      {showForm && (
        <form onSubmit={handleAddAddress} className="mb-8 p-6 bg-gray-50/50 border border-gray-100 rounded-[22px] space-y-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Agregar Nueva Ubicación</h3>
            <button type="button" onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
              <X size={18} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Etiqueta o Nombre</label>
              <input
                type="text"
                required
                placeholder="Ej: Casa, Trabajo, Apartamento"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#b49770] text-gray-700 font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Dirección Exacta</label>
              <input
                type="text"
                required
                placeholder="Ej: Calle 12 # 4-55"
                value={addressLine}
                onChange={(e) => setAddressLine(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#b49770] text-gray-700 font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* NUEVO INPUT DE BARRIO */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Barrio</label>
              <input
                type="text"
                required
                placeholder="Ej: Quirinal, Centro, Buganviles"
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#b49770] text-gray-700 font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Indicaciones (Opcional)</label>
              <input
                type="text"
                placeholder="Ej: Torre 2 Apt 501, portón blanco"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#b49770] text-gray-700 font-medium"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 bg-[#b49770] hover:bg-[#a3865f] text-white px-5 py-2 rounded-xl font-bold text-sm shadow-sm transition disabled:opacity-75"
            >
              {submitting ? 'Guardando...' : 'Guardar Dirección'}
            </button>
          </div>
        </form>
      )}

      {/* Listado de Tarjetas */}
      {addresses.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-[26px] border border-gray-100 p-6 shadow-sm">
          <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <MapPin className="text-[#b49770]" size={22} />
          </div>
          <h3 className="text-sm font-bold text-gray-700">No tienes direcciones guardadas</h3>
          <p className="text-xs text-gray-400 mt-1">Agrega una ubicación para procesar tus despachos mucho más rápido.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((item) => (
            <div key={item.id} className="group flex items-start justify-between bg-white border border-gray-100 rounded-[22px] p-5 shadow-sm hover:shadow-md transition">
              <div className="flex gap-3.5">
                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100 group-hover:bg-amber-50 group-hover:border-amber-100 transition">
                  <Home size={18} className="text-gray-400 group-hover:text-[#b49770] transition" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-800">{item.title}</h4>
                  <p className="text-sm text-gray-600 mt-0.5">{item.address_line}</p>
                  
                  {/* Renderizado dinámico del Barrio */}
                  {item.neighborhood && (
                    <p className="text-xs font-semibold text-gray-500 mt-0.5">Barrio: {item.neighborhood}</p>
                  )}
                  
                  {item.description && (
                    <p className="text-xs text-gray-400 mt-1 italic">Nota: {item.description}</p>
                  )}
                </div>
              </div>

              <button
                onClick={() => handleDeleteAddress(item.id)}
                className="text-gray-300 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};