import { useState } from 'react';
import { supabase } from '../supabaseClient'; 
import { useNavigate, useLocation } from 'react-router-dom'; // 1. Agregamos useLocation
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import Swal from 'sweetalert2';

export const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation(); // 2. Inicializamos el hook

  // 3. Capturamos la ruta de origen (ej. /cart o /checkout)
  const from = location.state?.from?.pathname || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // 4. Redirigimos dinámicamente según 'from'
          redirectTo: `${window.location.origin}${from}` 
        }
      });
      if (error) throw error;
    } catch (error: any) {
      Swal.fire({
        title: 'Error',
        text: 'No se pudo conectar con Google: ' + error.message,
        icon: 'error',
        confirmButtonColor: '#b49770'
      });
    }
  };

  const getStrength = (pass: string) => {
    let score = 0;
    if (pass.length > 6) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const strength = getStrength(password);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        
        if (error) {
          if (error.message.includes("Email not confirmed")) {
            throw new Error("Por favor, confirma tu correo electrónico antes de iniciar sesión.");
          }
          throw new Error("Credenciales incorrectas. Verifica tu correo y contraseña.");
        }
        
        // 5. Redirigimos al usuario a donde quería ir originalmente
        navigate(from, { replace: true }); 
      } else {
        if (strength < 2) throw new Error("La contraseña es muy débil para tu seguridad.");

        const { data, error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: { 
            data: { full_name: nombre },
            emailRedirectTo: `${window.location.origin}/auth` 
          }
        });

        if (error) {
          if (error.status === 422 || error.message.includes("already registered")) {
            throw new Error("Este correo ya está registrado en Cayena. Intenta iniciar sesión.");
          }
          throw error;
        }

        if (data?.user && data?.user?.identities?.length === 0) {
          throw new Error("Este correo ya está registrado. Si no confirmaste tu cuenta, revisa tu spam.");
        }

        await Swal.fire({
          title: '¡Casi listo!',
          text: `Te enviamos un correo de configuración a ${email}. Por favor verifícalo para activar tu cuenta.`,
          icon: 'success',
          confirmButtonColor: '#b49770',
          customClass: { popup: 'rounded-[30px]' }
        });
        
        setIsLogin(true);
      }
    } catch (error: any) {
      Swal.fire({
        title: 'Atención',
        text: error.message,
        icon: 'warning',
        confirmButtonColor: '#b49770'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    const { value: emailInput } = await Swal.fire({
      title: 'Recuperar contraseña',
      input: 'email',
      inputLabel: 'Enviaremos un enlace a tu correo',
      inputPlaceholder: 'tu@email.com',
      confirmButtonText: 'Enviar enlace',
      showCancelButton: true,
      confirmButtonColor: '#b49770',
      cancelButtonText: 'Cancelar'
    });

    if (emailInput) {
      const { error } = await supabase.auth.resetPasswordForEmail(emailInput, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        Swal.fire('Error', error.message, 'error');
      } else {
        Swal.fire('¡Enviado!', 'Revisa tu bandeja de entrada para restablecer tu clave.', 'success');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 relative">
      <button 
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 flex items-center gap-2 text-gray-500 hover:text-[#b49770] transition-colors font-medium"
      >
        <ArrowLeft size={20} />
        Volver a la tienda
      </button>

      <style>{`
        input::-ms-reveal, input::-ms-clear { display: none !important; }
        input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 30px white inset !important;
          -webkit-text-fill-color: #374151 !important;
        }
      `}</style>

      <div className="bg-white rounded-[40px] md:rounded-[50px] border-[6px] border-[#b49770] flex flex-col md:flex-row max-w-4xl w-full overflow-hidden shadow-2xl transition-all duration-500">
        <div className="md:w-1/2 relative h-48 md:h-auto overflow-hidden rounded-[30px] md:rounded-[40px] m-3 md:m-4 bg-gray-100">
          <img 
            src={isLogin ? "/logoinicio.png" : "/logoregis.png"} 
            alt="Cayena Panadería" 
            className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-black/10"></div>
        </div>

        <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
          <div className="mb-8">
            <h2 className="text-3xl font-serif font-bold text-gray-800">
              {isLogin ? '¡Bienvenido!' : 'Crea tu cuenta'}
            </h2>
            <p className="text-gray-500 text-sm mt-2 font-medium">
              {isLogin ? 'Inicia sesión para disfrutar lo mejor de Cayena.' : 'Únete para gestionar tus pedidos más rápido.'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-5">
            {!isLogin && (
              <div className="group border-b border-gray-300 focus-within:border-[#b49770] transition-colors">
                <label className="text-[10px] uppercase font-bold text-gray-400 group-focus-within:text-[#b49770]">Nombre Completo</label>
                <input type="text" className="w-full pb-2 outline-none bg-transparent text-gray-700" onChange={(e) => setNombre(e.target.value)} required />
              </div>
            )}

            <div className="group border-b border-gray-300 focus-within:border-[#b49770] transition-colors">
              <label className="text-[10px] uppercase font-bold text-gray-400 group-focus-within:text-[#b49770]">Correo electrónico</label>
              <input type="email" className="w-full pb-2 outline-none bg-transparent text-gray-700" onChange={(e) => setEmail(e.target.value)} required />
            </div>

            <div className="group border-b border-gray-300 focus-within:border-[#b49770] transition-colors relative">
              <label className="text-[10px] uppercase font-bold text-gray-400 group-focus-within:text-[#b49770]">Contraseña</label>
              <input 
                type={showPassword ? "text" : "password"} 
                className="w-full pb-2 outline-none pr-10 bg-transparent text-gray-700"
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-0 bottom-2 text-gray-400 hover:text-[#b49770] transition-colors">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {!isLogin && password.length > 0 && (
              <div className="mt-1">
                <div className="flex gap-1.5 h-1.5">
                  {[1, 2, 3, 4].map((level) => (
                    <div key={level} className={`flex-1 rounded-full transition-all duration-500 ${strength >= level ? (strength <= 2 ? 'bg-orange-400' : 'bg-green-500') : 'bg-gray-200'}`} />
                  ))}
                </div>
              </div>
            )}

            {isLogin && (
              <div className="flex justify-end">
                <button type="button" onClick={handleResetPassword} className="text-xs text-gray-400 hover:text-[#b49770] transition-colors underline bg-transparent">
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            )}

            <div className="pt-6 flex flex-col items-center gap-5">
              <button 
                type="submit" 
                disabled={loading} 
                className="bg-[#b49770] text-white hover:bg-[#9a7e5a] transition-all py-3.5 rounded-full text-md font-bold shadow-lg hover:shadow-[#b49770]/20 active:scale-95 disabled:opacity-50 w-full"
              >
                {loading ? 'Cargando...' : (isLogin ? 'Entrar a mi cuenta' : 'Crear mi cuenta')}
              </button>

              <div className="w-full flex items-center gap-3 py-2">
                <div className="flex-1 h-[1px] bg-gray-200"></div>
                <span className="text-[10px] text-gray-400 font-bold uppercase">O</span>
                <div className="flex-1 h-[1px] bg-gray-200"></div>
              </div>

              <button 
                type="button"
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-3 py-3 border-2 border-gray-200 rounded-full hover:border-[#b49770] hover:bg-gray-50 transition-all active:scale-95"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5" />
                <span className="text-sm font-bold text-gray-700">Continuar con Google</span>
              </button>

              <button 
                type="button" 
                onClick={() => { setIsLogin(!isLogin); setPassword(''); }} 
                className="text-sm text-gray-600 hover:text-[#b49770] font-medium transition-colors"
              >
                {isLogin ? (
                  <span>¿No tienes cuenta? <strong className="underline text-[#b49770]">Regístrate aquí</strong></span>
                ) : (
                  <span>¿Ya eres cliente? <strong className="underline text-[#b49770]">Inicia sesión</strong></span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};