import { type ReactNode, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../supabaseClient'; // Ajusta el path a tu cliente de Supabase

export const AdminRoute = ({ children }: { children: ReactNode }) => {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminRole = async () => {
      try {
        const { data: authData } = await supabase.auth.getUser();
        const user = authData?.user;
        
        if (!user) {
          setIsAdmin(false);
          setLoading(false);
          return;
        }

        // Traemos el rol desde la columna correcta en español ('rol')
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('rol')
          .eq('id', user.id)
          .maybeSingle();

        if (error || !profile) {
          console.error("Error obteniendo rol en la ruta protegida:", error);
          setIsAdmin(false);
        } else {
          // Validamos estrictamente contra la columna 'rol'
          setIsAdmin(profile.rol === 'admin');
        }
      } catch (err) {
        console.error("Error crítico en el guardián de ruta:", err);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminRole();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <p className="text-xl font-bold animate-pulse text-[#b49770]">Verificando credenciales de Cayena...</p>
      </div>
    );
  }

  return isAdmin ? <>{children}</> : <Navigate to="/" replace />;
};