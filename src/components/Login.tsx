'use client';

import React, { useState } from 'react';
import { Lock, User, AlertCircle, RefreshCw } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: () => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // Simular pequeño retraso para experiencia de carga premium
    setTimeout(() => {
      if (username.trim().toLowerCase() === 'admin' && password === 'admin') {
        onLoginSuccess();
      } else {
        setError('Usuario o contraseña incorrectos. Por favor, intente de nuevo.');
        setIsLoading(false);
      }
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#FBF9F6] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Decorative Brand Color Blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-[#b7131a]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-[#b7131a]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Login Card */}
      <div className="w-full max-w-md bg-white border border-[#e4beb9]/40 rounded-3xl p-8 md:p-10 shadow-[0px_8px_32px_rgba(183,28,28,0.05)] relative z-10">
        
        {/* Brand Logo and Title */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-[#fadcd8] border border-[#e4beb9]/50 overflow-hidden flex items-center justify-center mb-4 shadow-sm">
            <img 
              alt="Barrio Pizza Logo" 
              src="/logo.png" 
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
          <h1 className="text-2xl font-black text-[#271716] tracking-tight mb-1">Barrio Pizza</h1>
          <p className="text-xs text-[#5f5e5e] font-semibold uppercase tracking-wider">Control de Órdenes — Acceso Admin</p>
        </div>

        {/* Error Alert Box */}
        {error && (
          <div className="mb-6 bg-[#fff0ee] border border-[#e4beb9] text-[#b7131a] rounded-xl p-3.5 flex items-start gap-2.5 text-xs font-semibold animate-pulse">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#5f5e5e] pl-1">Usuario</label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5f5e5e]" />
              <input
                type="text"
                placeholder="Ingresa tu usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full bg-[#fff0ee]/20 border border-[#e4beb9]/60 rounded-xl py-3 pl-10 pr-4 text-xs font-semibold focus:outline-none focus:border-[#b7131a] focus:ring-1 focus:ring-[#b7131a] transition-all text-[#271716]"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#5f5e5e] pl-1">Contraseña</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5f5e5e]" />
              <input
                type="password"
                placeholder="Ingresa tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-[#fff0ee]/20 border border-[#e4beb9]/60 rounded-xl py-3 pl-10 pr-4 text-xs font-semibold focus:outline-none focus:border-[#b7131a] focus:ring-1 focus:ring-[#b7131a] transition-all text-[#271716]"
              />
            </div>
          </div>

          {/* Hint details */}
          <div className="text-[10px] text-center text-[#5f5e5e] font-medium mt-1">
            Credenciales de acceso rápido: <span className="font-bold text-[#b7131a] select-all">admin / admin</span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#b7131a] hover:bg-[#93000d] text-white py-3.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 mt-2"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Validando Acceso...</span>
              </>
            ) : (
              <span>Ingresar al Sistema</span>
            )}
          </button>
        </form>

      </div>
    </div>
  );
}
