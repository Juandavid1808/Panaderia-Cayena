import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Auth } from './Auth'; 
import { User, Phone, CreditCard, Save, Loader2, Mail, LogOut, ShieldCheck } from 'lucide-react';
import Swal from 'sweetalert2'; // Integrado para alertas premium

export const MiCuenta = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  
  // Estados para los campos de datos personales (Tus columnas de Supabase)
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [documentId, setDocumentId] = useState('');

  useEffect(() => {
    async function checkSessionAndLoadProfile() {
      try {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);

        if (session?.user) {
          // Consultar los datos en la tabla 'profiles' de Supabase
          const { data, error, status } = await supabase
            .from('profiles')
            .select('full_name, phone, document_id')
            .eq('id', session.user.id)
            .single();

          if (error && status !== 406) {
            throw error;
          }

          if (data) {
            setFullName(data.full_name || '');
            setPhone(data.phone || '');
            setDocumentId(data.document_id || '');
          } else {
            // Si el perfil no existe aún, precargamos el nombre de los metadatos de auth
            setFullName(session.user.user_metadata?.full_name || '');
          }
        }
      } catch (error: any) {
        console.error('Error cargando los datos del perfil:', error.message);
      } finally {
        setLoading(false);
      }
    }

    checkSessionAndLoadProfile();
  }, []);

  // Función para manejar la actualización o creación de los datos
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id) return;

    // Validación rápida antes de enviar
    if (!fullName.trim() || !phone.trim() || !documentId.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos vacíos',
        text: 'Por favor, completa todos los campos del formulario.',
        confirmButtonColor: '#b49770'
      });
      return;
    }

    try {
      setUpdating(true);

      const updates = {
        id: session.user.id,
        full_name: fullName.trim(),
        phone: phone.trim(),
        document_id: documentId.trim(),
        updated_at: new Date().toISOString(),
      };

      // Realiza el upsert en la tabla 'profiles'
      const { error } = await supabase.from('profiles').upsert(updates);

      if (error) throw error;

      // Alerta de éxito elegante
      Swal.fire({
        icon: 'success',
        title: '¡Datos Guardados!',
        text: 'Tu información de facturación se actualizó correctamente.',
        confirmButtonColor: '#b49770'
      });

    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error al guardar',
        text: `No se pudieron guardar los cambios: ${error.message}`,
        confirmButtonColor: '#b49770'
      });
    } finally {
      setUpdating(false);
    }
  };

  // Función opcional para cerrar sesión directamente desde el perfil
  const handleLogout = async () => {
    const result = await Swal.fire({
      title: '¿Cerrar Sesión?',
      text: '¿Estás seguro de que deseas salir de tu cuenta?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#b49770',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, salir',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      await supabase.auth.signOut();
      window.location.reload(); // Recarga limpia para limpiar estados globales
    }
  };

  // MIENTRAS COMPRUEBA LA SESIÓN INICIAL
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 bg-gray-50/30">
        <Loader2 className="w-9 h-9 text-[#b49770] animate-spin" />
        <p className="text-sm font-medium text-gray-500">Cargando tus datos personales...</p>
      </div>
    );
  }

  // SI NO HAY SESIÓN: Se muestra el formulario de Login/Registro original
  if (!session) {
    return <Auth />;
  }

  // SI HAY SESIÓN: Mostramos el formulario estilizado de Mis Datos
  return (
    <div className="max-w-2xl mx-auto my-10 p-4 md:p-0 text-left">
      
      {/* Encabezado con Icono */}
      <div className="flex items-center justify-between gap-3 mb-6 px-1">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#b49770]/10 text-[#b49770] rounded-xl">
            <ShieldCheck size={26} />
          </div>
          <div>
            <h2 className="text-2xl font-serif font-bold text-gray-800 tracking-wide">Mis Datos Personales</h2>
            <p className="text-xs text-gray-400 font-medium mt-0.5">Administra tu información para la facturación de tus compras</p>
          </div>
        </div>
        
        {/* Botón rápido de Logout */}
        <button 
          onClick={handleLogout}
          className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all tooltip"
          title="Cerrar Sesión"
        >
          <LogOut size={20} />
        </button>
      </div>

      <div className="bg-white rounded-[26px] border border-gray-100 shadow-sm p-6 md:p-8">
        <form onSubmit={handleUpdateProfile} className="space-y-5">
          
          {/* Campo: Nombre Completo */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Nombre Completo</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ej. Juan David"
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 rounded-xl text-sm border border-gray-100 outline-none focus:border-[#b49770] shadow-inner text-gray-700 font-medium transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Campo: Cédula de Ciudadanía */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Documento de Identidad</label>
              <div className="relative">
                <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                <input
                  type="text"
                  required
                  value={documentId}
                  onChange={(e) => setDocumentId(e.target.value)}
                  placeholder="Número de cédula"
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 rounded-xl text-sm border border-gray-100 outline-none focus:border-[#b49770] shadow-inner text-gray-700 font-medium transition-all"
                />
              </div>
            </div>

            {/* Campo: Teléfono Móvil */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Teléfono Móvil</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ej. 312 345 6789"
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 rounded-xl text-sm border border-gray-100 outline-none focus:border-[#b49770] shadow-inner text-gray-700 font-medium transition-all"
                />
              </div>
            </div>
          </div>

          {/* Campo informativo: Email fijo */}
          <div className="space-y-2 pt-2 border-t border-gray-50">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Correo Electrónico de la Cuenta</label>
            <div className="relative opacity-60">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                disabled
                value={session.user?.email || ''}
                className="w-full pl-12 pr-4 py-3.5 bg-gray-100 rounded-xl text-sm border border-gray-200 text-gray-500 font-medium cursor-not-allowed outline-none"
              />
            </div>
            <p className="text-[11px] text-gray-400 italic ml-1">El correo electrónico está vinculado de forma segura a tu cuenta y no se puede cambiar aquí.</p>
          </div>

          {/* Botón Guardar */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={updating}
              className="w-full md:w-auto bg-[#b49770] hover:bg-[#a3865f] text-white px-8 py-4 rounded-xl font-bold text-sm shadow-md transition transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {updating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Guardando cambios...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Guardar Información
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};