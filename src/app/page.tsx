'use client';

import React, { useState, useEffect } from 'react';
import { loadAllDashboardData } from '../lib/csvParser';
import { processAlerts, recalculateAlerts } from '../lib/logic';
import { AlertaConsolidada, Consumo, Ingrediente, Inventario, OrdenCompra } from '../types';
import Layout from '../components/Layout';
import TabAlerts from '../components/TabAlerts';
import TabAnalytics from '../components/TabAnalytics';
import TabSuppliers from '../components/TabSuppliers';
import TabChat from '../components/TabChat';
import { RefreshCw, AlertCircle } from 'lucide-react';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<string>('alerts');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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
    loadInitialData();
  }, []);

  // Función para volver a procesar alertas con los datos originales del servidor/disco
  const handleRecalculate = () => {
    setIsLoading(true);
    setTimeout(() => {
      // Re-procesar las alertas a sus valores originales
      const processed = processAlerts(ingredientes, consumo, inventario, ordenes);
      setAlerts(processed);
      setIsLoading(false);
      // Simular un toast
      alert('Alertas recalculadas con éxito a partir de los archivos de inventario.');
    }, 500);
  };

  // Aprobar un borrador de pedido sugerido por el chat IA
  const handleApproveOrder = (sucursal: string, ingredienteId: string, cantidad: number) => {
    // Buscar la fila correspondiente y mutar su cantidad de pedido
    const updated = alerts.map(item => {
      if (item.sucursal === sucursal && item.ingrediente_id === ingredienteId) {
        return {
          ...item,
          cantidad_formatos: cantidad
        };
      }
      return item;
    });

    // Recalcular alertas del consolidado
    setAlerts(recalculateAlerts(updated));
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
        return <TabChat alerts={alerts} onApproveOrder={handleApproveOrder} />;
      default:
        return <TabAlerts alerts={alerts} setAlerts={setAlerts} />;
    }
  };

  return (
    <Layout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab} 
      onRecalculate={handleRecalculate}
    >
      {renderContent()}
    </Layout>
  );
}
