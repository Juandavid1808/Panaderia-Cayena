// src/components/SeccionGestionAdmins.tsx
import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { ShieldCheck, UserMinus, UserPlus, Loader2 } from 'lucide-react';
import Swal from 'sweetalert2';

// 👑 TU CORREO DE RAÍZ REAL CORREGIDO (Con la 'i' bien puesta)
const SUPER_ADMIN_EMAIL = 'juandavidbelrrocu@gmail.com'; 

export const SeccionGestionAdmins = ({ userSesionActual }: { userSesionActual: any }) => {
  const [nuevoAdminEmail, setNuevoAdminEmail] = useState('');
  const [listaAdmins, setListaAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingTabla, setLoadingTabla] = useState(true);

  // Normalizamos el correo de sesión para evitar fallos por espacios o mayúsculas
  const correoSesionFormateado = userSesionActual?.email?.trim().toLowerCase();
  const soyElSuperAdmin = correoSesionFormateado === SUPER_ADMIN_EMAIL;

  const obtenerAdministradores = async () => {
    setLoadingTabla(true);
    try {
      const { data, error } = await supabase
        .from('profiles') 
        .select('id, full_name, email, rol') 
        .or('rol.eq.admin,rol.eq.ADMIN'); // 💡 Aseguramos traer variaciones de escritura si las hay

      if (!error) setListaAdmins(data || []);
    } catch (err) {
      console.error("Error al cargar admins:", err);
    } finally {
      setLoadingTabla(false);
    }
  };

  useEffect(() => {
    obtenerAdministradores();
  }, []);

  const asignarRolAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailLimpiecito = nuevoAdminEmail.trim().toLowerCase();
    if (!emailLimpiecito) return;

    setLoading(true);
    try {
      // 1. Buscamos el usuario (ahora incluimos el campo 'rol' en el select)
      const { data: usuario, error: errorBusqueda } = await supabase
        .from('profiles')
        .select('id, email, full_name, rol') // 💡 Agregamos 'rol' aquí
        .ilike('email', emailLimpiecito) 
        .maybeSingle();

      if (errorBusqueda) throw errorBusqueda;

      if (!usuario) {
        throw new Error(`No se encontró ningún usuario con el correo "${emailLimpiecito}" en la base de datos de Cayena.`);
      }

      // 2. 🔥 NUEVA VALIDACIÓN: Si ya es admin, frenamos el flujo y avisamos
      if (usuario.rol === 'admin' || usuario.rol === 'ADMIN') {
        Swal.fire({
          title: 'Usuario ya es Admin',
          text: `${usuario.full_name || emailLimpiecito} ya cuenta con privilegios administrativos en el sistema.`,
          icon: 'info',
          confirmButtonColor: '#374151',
          customClass: { popup: 'rounded-[25px]' }
        });
        setNuevoAdminEmail('');
        return; // Corta la ejecución para que no haga el UPDATE innecesario
      }

      // 3. Si no es admin, procedemos con la actualización normal
      const { error: errorUpdate } = await supabase
        .from('profiles')
        .update({ rol: 'admin' })
        .eq('id', usuario.id);

      if (errorUpdate) throw errorUpdate;

      Swal.fire({
        title: '¡Permisos Otorgados!',
        text: `${usuario.full_name || emailLimpiecito} ahora es Administrador.`,
        icon: 'success',
        confirmButtonColor: '#b49770',
        customClass: { popup: 'rounded-[25px]' }
      });

      setNuevoAdminEmail('');
      obtenerAdministradores();
    } catch (error: any) {
      Swal.fire({
        title: 'Error de Asignación',
        text: error.message || 'Ocurrió un error inesperado.',
        icon: 'error',
        confirmButtonColor: '#374151',
        customClass: { popup: 'rounded-[25px]' }
      });
    } finally {
      setLoading(false);
    }
  };

  const revocarRolAdmin = async (idUsuario: string, emailUsuario: string) => {
    const emailAFormatear = emailUsuario?.trim().toLowerCase();

    if (emailAFormatear === SUPER_ADMIN_EMAIL) {
      Swal.fire({
        title: 'Acción Bloqueada',
        text: 'El Administrador de raíz no puede ser removido del sistema.',
        icon: 'error',
        confirmButtonColor: '#374151',
        customClass: { popup: 'rounded-[25px]' }
      });
      return;
    }

    if (!soyElSuperAdmin) {
      Swal.fire({
        title: 'Acceso Denegado',
        text: 'Solo el creador de la plataforma (Súper Admin) puede revocar permisos de administrador.',
        icon: 'warning',
        confirmButtonColor: '#374151',
        customClass: { popup: 'rounded-[25px]' }
      });
      return;
    }

    Swal.fire({
      title: '¿Revocar permisos?',
      text: `¿Estás seguro de quitar el rol de admin a ${emailUsuario}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#374151',
      confirmButtonText: 'Sí, remover',
      cancelButtonText: 'Cancelar',
      customClass: { popup: 'rounded-[25px]' }
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const { error } = await supabase
            .from('profiles')
            .update({ rol: 'cliente' }) 
            .eq('id', idUsuario);

          if (error) throw error;

          Swal.fire({
            title: 'Actualizado',
            text: 'El usuario ha vuelto a ser cliente.',
            icon: 'success',
            confirmButtonColor: '#b49770',
            customClass: { popup: 'rounded-[25px]' }
          });
          
          obtenerAdministradores();
        } catch (error: any) {
          Swal.fire('Error', 'No se pudo completar la acción', 'error');
        }
      }
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
      
      {/* SECCIÓN IZQUIERDA: ASIGNAR */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-[30px] border border-gray-100 dark:border-slate-800 shadow-sm h-fit text-left">
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck className="text-[#b49770]" size={22} />
          <h3 className="text-lg font-black text-gray-800 dark:text-slate-100">Otorgar Rol Administrativo</h3>
        </div>
        <p className="text-xs text-gray-400 mb-4">Cualquier administrador puede promover nuevos usuarios.</p>
        <form onSubmit={asignarRolAdmin} className="space-y-3">
          <input 
            type="email"
            required
            value={nuevoAdminEmail}
            onChange={(e) => setNuevoAdminEmail(e.target.value)}
            placeholder="correo-nuevo-admin@gmail.com"
            className="w-full border dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#b49770] bg-white dark:bg-slate-950 text-gray-700 dark:text-slate-200"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-950 text-white hover:bg-[#b49770] py-2.5 rounded-xl font-bold text-sm transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? 'Procesando...' : <><UserPlus size={16}/> Otorgar Permisos</>}
          </button>
        </form>
      </div>

      {/* SECCIÓN DERECHA: EQUIPO */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-[30px] border border-gray-100 dark:border-slate-800 shadow-sm text-left">
        <h3 className="text-lg font-black text-gray-800 dark:text-slate-100 mb-4">Equipo de Administradores</h3>
        {loadingTabla ? (
          <div className="flex justify-center py-6"><Loader2 className="animate-spin text-[#b49770]" /></div>
        ) : (
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
            {listaAdmins.map((admin) => {
              const adminEmailNormalizado = admin.email?.trim().toLowerCase();
              const esElRaiz = adminEmailNormalizado === SUPER_ADMIN_EMAIL;
              return (
                <div key={admin.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-950 rounded-2xl border border-gray-100 dark:border-slate-850">
                  <div className="text-left truncate max-w-[70%]">
                    <p className="text-sm font-bold text-gray-700 dark:text-slate-200 truncate">
                      {admin.full_name || 'Sin Nombre'} {esElRaiz && '👑'}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{admin.email}</p>
                  </div>
                  
                  {esElRaiz ? (
                    <span className="text-[10px] font-black bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 px-2.5 py-1 rounded-full uppercase tracking-wider">
                      Creador
                    </span>
                  ) : soyElSuperAdmin ? (
                    <button
                      onClick={() => revocarRolAdmin(admin.id, admin.email)}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition active:scale-90"
                    >
                      <UserMinus size={18} />
                    </button>
                  ) : (
                    <span className="text-[10px] font-bold bg-gray-100 text-gray-400 dark:bg-slate-800 dark:text-slate-500 px-2.5 py-1 rounded-full uppercase">
                      Admin
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};