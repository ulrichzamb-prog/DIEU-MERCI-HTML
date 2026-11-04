import React, { useState } from 'react';
import { X, ShieldCheck, Mail, Key, Check, AlertCircle, LogOut } from 'lucide-react';
import { DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD } from './AdminAuthModal';

interface AdminSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export const AdminSettingsModal: React.FC<AdminSettingsModalProps> = ({
  isOpen,
  onClose,
  onLogout,
}) => {
  const currentStoredEmail = localStorage.getItem('courrier_admin_email') || DEFAULT_ADMIN_EMAIL;
  
  const [email, setEmail] = useState<string>(currentStoredEmail);
  const [currentPasswordInput, setCurrentPasswordInput] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');

  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const storedPassword = localStorage.getItem('courrier_admin_password') || DEFAULT_ADMIN_PASSWORD;

    if (currentPasswordInput !== storedPassword) {
      setErrorMessage('Le mot de passe actuel saisi est incorrect.');
      return;
    }

    if (!email || !email.includes('@')) {
      setErrorMessage('Veuillez saisir une adresse email valide.');
      return;
    }

    if (newPassword) {
      if (newPassword.length < 6) {
        setErrorMessage('Le nouveau mot de passe doit comporter au moins 6 caractères.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMessage('La confirmation du mot de passe ne correspond pas.');
        return;
      }
      localStorage.setItem('courrier_admin_password', newPassword);
    }

    localStorage.setItem('courrier_admin_email', email.trim());
    setSuccessMessage('Paramètres de sécurité administrateur enregistrés avec succès !');
    setCurrentPasswordInput('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleResetToDefault = () => {
    localStorage.setItem('courrier_admin_email', DEFAULT_ADMIN_EMAIL);
    localStorage.setItem('courrier_admin_password', DEFAULT_ADMIN_PASSWORD);
    setEmail(DEFAULT_ADMIN_EMAIL);
    setCurrentPasswordInput('');
    setNewPassword('');
    setConfirmPassword('');
    setSuccessMessage('Identifiants réinitialisés aux valeurs par défaut.');
    setErrorMessage('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 select-none">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Sécurité & Profil Administrateur</h2>
              <p className="text-[11px] text-neutral-400">Modifier l'email ou le mot de passe d'accès</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-red-950/70 border border-red-800 rounded-lg text-xs text-red-200 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-950/70 border border-emerald-800 rounded-lg text-xs text-emerald-200 flex items-start gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

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
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-neutral-800/80">
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              Mot de Passe Actuel (requis pour confirmer)
            </label>
            <div className="relative">
              <Key className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={currentPasswordInput}
                onChange={(e) => setCurrentPasswordInput(e.target.value)}
                placeholder="Saisissez votre mot de passe actuel"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Nouveau mot de passe
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Facultatif"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Confirmer
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Facultatif"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleResetToDefault}
              className="text-[11px] text-neutral-400 hover:text-white underline transition-colors"
            >
              Réinitialiser par défaut
            </button>

            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg shadow-sm transition-all"
            >
              Enregistrer les modifications
            </button>
          </div>
        </form>

        {/* Footer with Logout */}
        <div className="px-6 py-3 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between text-xs">
          <span className="text-neutral-500 text-[11px]">Session administrateur active</span>
          <button
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="flex items-center gap-1.5 text-red-400 hover:text-red-300 font-semibold transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Déconnexion</span>
          </button>
        </div>
      </div>
    </div>
  );
};
