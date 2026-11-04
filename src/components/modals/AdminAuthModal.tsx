import React, { useState } from 'react';
import { Lock, Mail, Key, ShieldCheck, ArrowRight, Eye, EyeOff, Info } from 'lucide-react';

interface AdminAuthModalProps {
  isAuthenticated: boolean;
  onLoginSuccess: (email: string) => void;
}

export const DEFAULT_ADMIN_EMAIL = 'admin@courrier.studio';
export const DEFAULT_ADMIN_PASSWORD = 'AdminCourrier2026!';

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
  isAuthenticated,
  onLoginSuccess,
}) => {
  const [email, setEmail] = useState<string>(() => {
    return localStorage.getItem('courrier_admin_email') || DEFAULT_ADMIN_EMAIL;
  });
  const [password, setPassword] = useState<string>(() => {
    return localStorage.getItem('courrier_admin_password') || DEFAULT_ADMIN_PASSWORD;
  });
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  if (isAuthenticated) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const storedEmail = localStorage.getItem('courrier_admin_email') || DEFAULT_ADMIN_EMAIL;
    const storedPassword = localStorage.getItem('courrier_admin_password') || DEFAULT_ADMIN_PASSWORD;

    if (email.trim().toLowerCase() === storedEmail.trim().toLowerCase() && password === storedPassword) {
      localStorage.setItem('courrier_admin_auth', 'true');
      localStorage.setItem('courrier_admin_session_time', String(Date.now()));
      onLoginSuccess(storedEmail);
    } else {
      setError('Identifiants incorrects. Veuillez utiliser les identifiants administrateur.');
    }
  };

  const handleUseDefaultCredentials = () => {
    setEmail(DEFAULT_ADMIN_EMAIL);
    setPassword(DEFAULT_ADMIN_PASSWORD);
    setError('');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 select-none">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header Banner */}
        <div className="px-6 pt-6 pb-4 text-center bg-gradient-to-b from-indigo-950/60 to-neutral-900 border-b border-neutral-800/80">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white mx-auto shadow-lg shadow-indigo-500/30 mb-3">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight">
            Accès Administrateur Courrier Studio
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Veuillez vous authentifier pour accéder à l'éditeur visuel d'emails
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleLogin} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-950/70 border border-red-800 rounded-lg text-xs text-red-200">
              {error}
            </div>
          )}

          {/* Pre-generated credentials info banner */}
          <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800/90 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-neutral-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Identifiants pré-générés (défaut) :
              </span>
              <button
                type="button"
                onClick={handleUseDefaultCredentials}
                className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold underline"
              >
                Remplir
              </button>
            </div>
            <div className="grid grid-cols-1 gap-1 text-[11px] font-mono bg-neutral-900/90 p-2 rounded border border-neutral-800 text-neutral-400">
              <div><span className="text-neutral-500">Email:</span> <span className="text-emerald-400">{DEFAULT_ADMIN_EMAIL}</span></div>
              <div><span className="text-neutral-500">Pass:</span> <span className="text-emerald-400">{DEFAULT_ADMIN_PASSWORD}</span></div>
            </div>
            <div className="text-[10px] text-neutral-500 flex items-center gap-1">
              <Info className="w-3 h-3 text-neutral-400 shrink-0" />
              <span>Vous pourrez modifier cet email et mot de passe dans les paramètres après connexion.</span>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Adresse Email Administrateur
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder="admin@courrier.studio"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Mot de Passe
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-9 pr-10 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder="••••••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all active:scale-[0.99] mt-2"
          >
            <span>Se connecter à Courrier Studio</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
