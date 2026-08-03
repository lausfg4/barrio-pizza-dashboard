'use client';

import React from 'react';
import { 
  LayoutDashboard, 
  LineChart, 
  Package, 
  Bot, 
  RefreshCw, 
  Settings, 
  HelpCircle, 
  Search, 
  Bell 
} from 'lucide-react';

interface LayoutProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onRecalculate: () => void;
  children: React.ReactNode;
}

export default function Layout({ 
  activeTab, 
  setActiveTab, 
  onRecalculate, 
  children 
}: LayoutProps) {
  const menuItems = [
    { id: 'alerts', name: 'Resumen & Alertas', icon: LayoutDashboard },
    { id: 'analytics', name: 'Análisis de Consumo', icon: LineChart },
    { id: 'suppliers', name: 'Pedidos por Proveedor', icon: Package },
    { id: 'chat', name: 'Asistente IA', icon: Bot },
  ];

  return (
    <div className="min-h-screen bg-[#FBF9F6] text-[#271716] flex font-sans antialiased">
      {/* Sidebar Navigation */}
      <aside className="w-[240px] bg-white border-r border-[#e4beb9]/30 fixed top-0 bottom-0 left-0 flex flex-col justify-between py-6 z-40">
        <div>
          {/* Brand Header */}
          <div className="px-6 pb-8 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#fadcd8] overflow-hidden flex-shrink-0">
              <img 
                alt="Barrio Pizza Logo" 
                className="w-full h-full object-cover" 
                src="/logo.png" 
                onError={(e) => {
                  // Fallback logo using styled circle if image is missing
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
            <div>
              <h1 className="font-bold text-[#b7131a] text-lg leading-tight">Barrio Pizza</h1>
              <p className="text-xs text-[#5f5e5e] font-medium">Control de Órdenes</p>
            </div>
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
                      onClick={() => setActiveTab(item.id)}
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
          <div className="px-4 mb-4">
            <button
              onClick={onRecalculate}
              className="w-full bg-[#b7131a] hover:bg-[#93000d] text-white py-2 px-4 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Re-Calcular Alertas</span>
            </button>
          </div>

          {/* Adjustments & Support Links */}
          <div className="border-t border-[#e4beb9]/30 pt-3">
            <ul className="flex flex-col text-xs font-semibold">
              <li>
                <a href="#settings" className="flex items-center gap-3 px-6 py-3 text-[#5f5e5e] hover:bg-[#e4e2e1]/30 hover:text-[#b7131a] transition-all">
                  <Settings className="w-4 h-4" />
                  <span>Ajustes</span>
                </a>
              </li>
              <li>
                <a href="#support" className="flex items-center gap-3 px-6 py-3 text-[#5f5e5e] hover:bg-[#e4e2e1]/30 hover:text-[#b7131a] transition-all">
                  <HelpCircle className="w-4 h-4" />
                  <span>Soporte</span>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 ml-[240px] flex flex-col min-h-screen">
        {/* TopAppBar */}
        <header className="bg-white border-b border-[#e4beb9]/30 h-16 px-8 flex justify-between items-center sticky top-0 z-30">
          <div className="flex-1 flex items-center gap-6">
            <h2 className="text-md font-bold text-[#271716] hidden md:block">
              Barrio Pizza — Control de Órdenes
            </h2>
            {/* Search Input */}
            <div className="relative w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#5f5e5e]" />
              <input
                type="text"
                placeholder="Buscar insumos..."
                className="w-full bg-[#fff0ee]/40 border border-[#e4beb9]/60 rounded-full py-1.5 pl-9 pr-4 text-xs font-medium focus:outline-none focus:border-[#b7131a] focus:ring-1 focus:ring-[#b7131a] transition-all text-[#271716]"
              />
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center gap-4">
            <button
              onClick={onRecalculate}
              className="bg-[#b7131a] hover:bg-[#93000d] text-white text-xs font-bold py-2 px-4 rounded-lg transition-all"
            >
              Re-Calcular Alertas
            </button>
            <div className="flex items-center gap-2 text-[#5f5e5e]">
              <button className="p-2 rounded-full hover:bg-[#e4e2e1]/30 hover:text-[#b7131a] transition-colors relative">
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#b7131a] rounded-full"></span>
              </button>
              <button className="p-1 rounded-full hover:bg-[#e4e2e1]/30 hover:text-[#b7131a] transition-colors flex items-center justify-center font-bold bg-[#e4e2e1] w-8 h-8 text-xs text-[#271716]">
                L
              </button>
            </div>
          </div>
        </header>

        {/* Page Canvas */}
        <main className="p-8 flex-1 flex flex-col gap-6">
          {children}
        </main>
      </div>
    </div>
  );
}
