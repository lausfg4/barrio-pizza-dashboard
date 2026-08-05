'use client';

import React, { useState, useEffect } from 'react';
import { loadAllDashboardData } from '../lib/csvParser';
import { processAlerts, recalculateAlerts } from '../lib/logic';
import { AlertaConsolidada, Consumo, Ingrediente, Inventario, OrdenCompra } from '../types';
import Layout from '../components/Layout';
import Login from '../components/Login';
import TabAlerts from '../components/TabAlerts';
import TabAnalytics from '../components/TabAnalytics';
import TabSuppliers from '../components/TabSuppliers';
import TabChat from '../components/TabChat';
import { RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<string>('alerts');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Estados de autenticación
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);

  // Estado de Toast personalizado
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Estados originales cargados de los CSV
  const [ingredientes, setIngredientes] = useState<Ingrediente[]>([]);
  const [consumo, setConsumo] = useState<Consumo[]>([]);
  const [inventario, setInventario] = useState<Inventario[]>([]);
  const [ordenes, setOrdenes] = useState<OrdenCompra[]>([]);

  // Estado consolidado de alertas (editable)
  const [alerts, setAlerts] = useState<AlertaConsolidada[]>([]);

  // Carga inicial de datos
  const loadInitialData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await loadAllDashboardData();
      setIngredientes(data.ingredientes);
      setConsumo(data.consumo);
      setInventario(data.inventario);
      setOrdenes(data.ordenes);

      // Procesar consolidado inicial de alertas
      const processed = processAlerts(
        data.ingredientes,
        data.consumo,
        data.inventario,
        data.ordenes
      );
      setAlerts(processed);
    } catch (err: any) {
      console.error(err);
      setError('No se pudieron cargar los archivos CSV de datos. Asegúrate de colocar la carpeta /datos dentro de la carpeta /public de Next.js.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Validar estado de inicio de sesión persistente en la pestaña actual
    const logged = sessionStorage.getItem('isLoggedIn') === 'true';
    setIsLoggedIn(logged);
    setIsCheckingAuth(false);
    loadInitialData();
  }, []);

  // Limpiar Toast automáticamente después de 4 segundos
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
  };

  const handleLoginSuccess = () => {
    sessionStorage.setItem('isLoggedIn', 'true');
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('isLoggedIn');
    setIsLoggedIn(false);
  };

  // Función para volver a procesar alertas con los datos originales del servidor/disco
  const handleRecalculate = () => {
    setIsLoading(true);
    setTimeout(() => {
      // Re-procesar las alertas a sus valores originales
      const processed = processAlerts(ingredientes, consumo, inventario, ordenes);
      setAlerts(processed);
      setIsLoading(false);
      showToast('Alertas recalculadas con éxito a partir de los archivos de inventario.', 'success');
    }, 500);
  };

  // Aprobar uno o más borradores de pedido sugeridos por el chat IA
  const handleApproveOrders = (orders: Array<{ sucursal: string; ingredienteId: string; cantidad: number }>) => {
    setAlerts(prevAlerts => {
      const updated = prevAlerts.map(item => {
        const match = orders.find(o => o.sucursal === item.sucursal && o.ingredienteId === item.ingrediente_id);
        if (match) {
          return {
            ...item,
            cantidad_formatos: match.cantidad
          };
        }
        return item;
      });
      return recalculateAlerts(updated);
    });

    if (orders.length === 1) {
      showToast(`Pedido aprobado correctamente para ${orders[0].sucursal}.`, 'success');
    } else if (orders.length > 1) {
      showToast(`Se aprobaron ${orders.length} pedidos sugeridos correctamente.`, 'success');
    }
  };

  // Renderizar la vista activa
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <RefreshCw className="w-8 h-8 text-[#b7131a] animate-spin" />
          <span className="text-xs text-[#5f5e5e] font-semibold">Cargando base de datos de Barrio Pizza...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-[#fff0ee] border border-[#e4beb9] rounded-2xl p-6 text-center max-w-lg mx-auto mt-10">
          <AlertCircle className="w-12 h-12 text-[#b7131a] mx-auto mb-3" />
          <h3 className="text-sm font-bold text-[#b7131a] mb-1">Error de Carga</h3>
          <p className="text-xs text-[#5f5e5e] font-semibold leading-relaxed mb-4">{error}</p>
          <button 
            onClick={loadInitialData}
            className="bg-[#b7131a] hover:bg-[#93000d] text-white text-xs font-bold py-2 px-4 rounded-lg transition-all"
          >
            Reintentar Carga
          </button>
        </div>
      );
    }

    switch (activeTab) {
      case 'alerts':
        return <TabAlerts alerts={alerts} setAlerts={setAlerts} />;
      case 'analytics':
        return <TabAnalytics alerts={alerts} consumo={consumo} />;
      case 'suppliers':
        return <TabSuppliers alerts={alerts} />;
      case 'chat':
        return <TabChat alerts={alerts} onApproveOrder={handleApproveOrders} onShowToast={showToast} />;
      default:
        return <TabAlerts alerts={alerts} setAlerts={setAlerts} />;
    }
  };

  // Spinner de validación inicial
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[#FBF9F6] flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-8 h-8 text-[#b7131a] animate-spin" />
        <span className="text-xs text-[#5f5e5e] font-bold uppercase tracking-wider">Verificando Credenciales...</span>
      </div>
    );
  }

  // Si no ha iniciado sesión, mostrar pantalla de Login
  if (!isLoggedIn) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <>
      {/* Dynamic Toast Styles */}
      <style>{`
        @keyframes slideInRight {
          from { transform: translate(120%, 0); opacity: 0; }
          to { transform: translate(0, 0); opacity: 1; }
        }
        .animate-toast-slide {
          animation: slideInRight 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      {/* Floating toast notification */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 animate-toast-slide bg-white border border-[#e4beb9]/80 rounded-2xl p-4 shadow-[0px_10px_28px_rgba(183,28,28,0.06)] flex items-center gap-3 max-w-sm">
          <div className="w-8 h-8 rounded-full bg-[#fff0ee] flex items-center justify-center flex-shrink-0 text-[#b7131a]">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="flex-1 pr-2">
            <p className="text-xs font-bold text-[#271716] leading-snug">{toast.message}</p>
          </div>
          <button 
            onClick={() => setToast(null)}
            className="text-[#5f5e5e] hover:text-[#b7131a] text-xs font-bold w-5 h-5 rounded-full hover:bg-[#fff0ee]/60 transition-colors flex items-center justify-center"
          >
            ✕
          </button>
        </div>
      )}

      <Layout 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onRecalculate={handleRecalculate}
        onLogout={handleLogout}
      >
        {renderContent()}
      </Layout>
    </>
  );
}
