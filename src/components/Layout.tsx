'use client';

import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  LineChart, 
  Package, 
  Bot, 
  RefreshCw, 
  Menu,
  X
} from 'lucide-react';

interface LayoutProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onRecalculate: () => void;
  onLogout?: () => void;
  children: React.ReactNode;
}

export default function Layout({ 
  activeTab, 
  setActiveTab, 
  onRecalculate, 
  onLogout,
  children 
}: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const menuItems = [
    { id: 'alerts', name: 'Resumen & Alertas', icon: LayoutDashboard },
    { id: 'analytics', name: 'Análisis de Consumo', icon: LineChart },
    { id: 'suppliers', name: 'Pedidos por Proveedor', icon: Package },
    { id: 'chat', name: 'Asistente IA', icon: Bot },
  ];

  return (
    <div className="min-h-screen bg-[#FBF9F6] text-[#271716] flex font-sans antialiased overflow-x-hidden">
      
      {/* Mobile Sidebar Backdrop overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 md:hidden transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`w-[240px] bg-white border-r border-[#e4beb9]/30 fixed top-0 bottom-0 left-0 flex flex-col justify-between py-6 z-50 transition-transform duration-300 ease-in-out md:translate-x-0 
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div>
          {/* Brand Header with Close Button on Mobile */}
          <div className="px-6 pb-8 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#fadcd8] overflow-hidden flex-shrink-0">
                <img 
                  alt="Barrio Pizza Logo" 
                  className="w-full h-full object-cover" 
                  src="/logo.png" 
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
              <div>
                <h1 className="font-bold text-[#b7131a] text-lg leading-tight">Barrio Pizza</h1>
                <p className="text-xs text-[#5f5e5e] font-medium">Control de Órdenes</p>
              </div>
            </div>
            
            {/* Close sidebar button on mobile */}
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="p-1 rounded-lg hover:bg-[#e4e2e1]/30 text-[#5f5e5e] md:hidden transition-colors"
              aria-label="Cerrar menú"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1">
            <ul className="flex flex-col gap-1 px-3">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => {
                        setActiveTab(item.id);
                        setIsSidebarOpen(false); // Close sidebar on mobile select
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                        isActive
                          ? 'bg-[#FDE8E8] text-[#b7131a] border-r-4 border-[#b7131a] rounded-r-none'
                          : 'text-[#5f5e5e] hover:bg-[#e4e2e1]/30 hover:text-[#b7131a]'
                      }`}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span>{item.name}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div>
          {/* Re-Calculate Button */}
          <div className="px-4 mb-3">
            <button
              onClick={() => {
                onRecalculate();
                setIsSidebarOpen(false);
              }}
              className="w-full bg-[#b7131a] hover:bg-[#93000d] text-white py-2 px-4 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Re-Calcular Alertas</span>
            </button>
          </div>
          {/* Logout Button */}
          {onLogout && (
            <div className="px-4 mb-4">
              <button
                onClick={() => {
                  onLogout();
                  setIsSidebarOpen(false);
                }}
                className="w-full bg-white hover:bg-[#fff8f7] border border-[#e4beb9]/60 text-[#b7131a] py-2 px-4 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <span>Cerrar Sesión</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 md:ml-[240px] ml-0 flex flex-col min-h-screen max-w-full overflow-x-hidden">
        {/* TopAppBar */}
        <header className="bg-white border-b border-[#e4beb9]/30 h-16 px-4 md:px-8 flex justify-between items-center sticky top-0 z-30">
          <div className="flex items-center gap-3 flex-1">
            {/* Hamburger Button for mobile */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 rounded-lg md:hidden hover:bg-[#e4e2e1]/30 text-[#b7131a] transition-colors"
              aria-label="Abrir menú"
            >
              <Menu className="w-6 h-6" />
            </button>
            
            <h2 className="text-md font-bold text-[#271716] hidden md:block">
              Barrio Pizza — Control de Órdenes
            </h2>
            <h2 className="text-sm font-bold text-[#b7131a] md:hidden">
              Barrio Pizza
            </h2>
          </div>

          {/* Action Bar */}
          <div className="flex items-center gap-3 md:gap-4">
            <button
              onClick={onRecalculate}
              className="bg-[#b7131a] hover:bg-[#93000d] text-white text-[10px] md:text-xs font-bold py-1.5 px-3 md:py-2 md:px-4 rounded-lg transition-all"
            >
              Re-Calcular Alertas
            </button>
            <div className="flex items-center gap-2 text-[#5f5e5e]">
              <button className="p-1 rounded-full hover:bg-[#e4e2e1]/30 hover:text-[#b7131a] transition-colors flex items-center justify-center font-bold bg-[#e4e2e1] w-8 h-8 text-xs text-[#271716]" title="Administrador">
                A
              </button>
            </div>
          </div>
        </header>

        {/* Page Canvas */}
        <main className="p-4 md:p-8 flex-1 flex flex-col gap-6 w-full max-w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
