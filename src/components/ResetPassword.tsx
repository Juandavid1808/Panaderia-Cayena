import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

export const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      Swal.fire('Error', error.message, 'error');
    } else {
      await Swal.fire('¡Éxito!', 'Tu contraseña ha sido actualizada.', 'success');
      navigate('/auth'); // Lo mandamos a iniciar sesión con la nueva clave
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-10 rounded-[30px] border-4 border-[#b49770] shadow-xl max-w-md w-full">
        <h2 className="text-2xl font-bold mb-6">Nueva Contraseña</h2>
        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <input 
            type="password" 
            placeholder="Escribe tu nueva clave" 
            className="w-full p-3 border-b border-gray-400 outline-none"
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#b49770] text-white py-3 rounded-full font-bold"
          >
            {loading ? 'Actualizando...' : 'Cambiar Contraseña'}
          </button>
        </form>
      </div>
    </div>
  );
};