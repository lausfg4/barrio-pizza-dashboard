'use client';

import React, { useState, useMemo } from 'react';
import { AlertaConsolidada } from '../types';
import { recalculateAlerts } from '../lib/logic';
import { 
  Store, 
  AlertTriangle, 
  Archive, 
  ClipboardList, 
  TrendingUp, 
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface TabAlertsProps {
  alerts: AlertaConsolidada[];
  setAlerts: (updated: AlertaConsolidada[]) => void;
}

export default function TabAlerts({ alerts, setAlerts }: TabAlertsProps) {
  const [selectedSucursal, setSelectedSucursal] = useState<string>('all');
  const [selectedAlertaTipo, setSelectedAlertaTipo] = useState<string>('all');

  // Obtener sucursales únicas para el dropdown
  const sucursales = useMemo(() => {
    return Array.from(new Set(alerts.map(a => a.sucursal)));
  }, [alerts]);

  // Contadores para las KPI Cards (dinámicos según la sucursal seleccionada)
  const kpis = useMemo(() => {
    const sucursalesCount = selectedSucursal === 'all' ? sucursales.length : 1;
    let critico = 0;
    let sobrepedido = 0;
    let olvidado = 0;

    alerts.forEach(a => {
      if (selectedSucursal === 'all' || a.sucursal === selectedSucursal) {
        if (a.alerta_tipo === 'Riesgo de Quiebre') critico++;
        else if (a.alerta_tipo === 'Sobre-pedido') sobrepedido++;
        else if (a.alerta_tipo === 'Insumo Olvidado') olvidado++;
      }
    });

    return {
      sucursales: sucursalesCount,
      critico,
      sobrepedido,
      olvidado
    };
  }, [alerts, sucursales, selectedSucursal]);

  // Manejar el cambio inline de cantidad de pedido
  const handleCantidadChange = (ingredienteId: string, sucursal: string, val: number) => {
    const nextAlerts = alerts.map(item => {
      if (item.ingrediente_id === ingredienteId && item.sucursal === sucursal) {
        return {
          ...item,
          cantidad_formatos: Math.max(0, val)
        };
      }
      return item;
    });

    // Recalcular alertas reactivamente
    setAlerts(recalculateAlerts(nextAlerts));
  };

  // Auto-corregir cantidad al valor recomendado sugerido
  const handleCorregir = (ingredienteId: string, sucursal: string, necReal: number, formatoVal: number) => {
    const sugerido = Math.ceil(necReal / formatoVal);
    handleCantidadChange(ingredienteId, sucursal, sugerido);
  };

  // Filtrar los datos mostrados en la tabla
  const filteredAlerts = useMemo(() => {
    return alerts.filter(a => {
      const matchSucursal = selectedSucursal === 'all' || a.sucursal === selectedSucursal;
      let matchTipo = true;
      if (selectedAlertaTipo === 'critico') matchTipo = a.alerta_tipo === 'Riesgo de Quiebre';
      else if (selectedAlertaTipo === 'sobrepedido') matchTipo = a.alerta_tipo === 'Sobre-pedido';
      else if (selectedAlertaTipo === 'olvido') matchTipo = a.alerta_tipo === 'Insumo Olvidado';
      return matchSucursal && matchTipo;
    });
  }, [alerts, selectedSucursal, selectedAlertaTipo]);

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col gap-1 mb-2">
        <h2 className="text-3xl font-bold text-[#271716] tracking-tight">Resumen &amp; Alertas</h2>
        <p className="text-sm text-[#5f5e5e] font-medium">Revisión Automática de Insumos</p>
      </div>

      {/* KPI Cards Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* KPI 1: Sucursales */}
        <div className="bg-white border border-[#e4beb9]/30 rounded-2xl p-6 flex flex-col justify-between hover:shadow-[0px_4px_16px_rgba(183,28,28,0.03)] transition-all duration-300">
          <div className="flex justify-between items-start mb-6">
            <span className="text-[11px] font-bold text-[#5f5e5e] uppercase tracking-wider">Total Sucursales</span>
            <Store className="w-5 h-5 text-[#5f5e5e]" />
          </div>
          <div className="flex items-end justify-between">
            <div className="text-2xl font-bold text-[#271716]">{kpis.sucursales} Active</div>
            <div className="flex items-center text-[#b7131a] bg-[#fff0ee] px-2 py-0.5 rounded text-xs font-bold">
              <TrendingUp className="w-3.5 h-3.5 mr-1" /> 100%
            </div>
          </div>
        </div>

        {/* KPI 2: Stock Crítico */}
        <div className="bg-white border border-[#e4beb9]/30 rounded-2xl p-6 flex flex-col justify-between hover:shadow-[0px_4px_16px_rgba(183,28,28,0.03)] transition-all duration-300 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-[#b7131a]/5 rounded-bl-full"></div>
          <div className="flex justify-between items-start mb-6 relative z-10">
            <span className="text-[11px] font-bold text-[#b7131a] uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#b7131a]"></span> Stock Crítico
            </span>
            <AlertTriangle className="w-5 h-5 text-[#b7131a]" />
          </div>
          <div className="flex items-end justify-between relative z-10">
            <div className="text-2xl font-bold text-[#271716]">{kpis.critico} items</div>
            <button 
              onClick={() => setSelectedAlertaTipo('critico')}
              className="text-[#b7131a] text-xs font-bold underline cursor-pointer hover:text-[#93000d] bg-transparent border-none"
            >
              Ver Detalle
            </button>
          </div>
        </div>

        {/* KPI 3: Sobre-pedidos */}
        <div className="bg-white border border-[#e4beb9]/30 rounded-2xl p-6 flex flex-col justify-between hover:shadow-[0px_4px_16px_rgba(183,28,28,0.03)] transition-all duration-300 relative overflow-hidden">
          <div className="flex justify-between items-start mb-6">
            <span className="text-[11px] font-bold text-[#D97706] uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#D97706]"></span> Sobre-pedidos
            </span>
            <Archive className="w-5 h-5 text-[#D97706]" />
          </div>
          <div className="flex items-end justify-between">
            <div className="text-2xl font-bold text-[#271716]">{kpis.sobrepedido} items</div>
            <span className="text-xs font-semibold text-[#5f5e5e]">Analizado</span>
          </div>
        </div>

        {/* KPI 4: Insumos Olvidados */}
        <div className="bg-white border border-[#e4beb9]/30 rounded-2xl p-6 flex flex-col justify-between hover:shadow-[0px_4px_16px_rgba(183,28,28,0.03)] transition-all duration-300 relative overflow-hidden">
          <div className="flex justify-between items-start mb-6">
            <span className="text-[11px] font-bold text-[#2563EB] uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#2563EB]"></span> Insumos Olvidados
            </span>
            <ClipboardList className="w-5 h-5 text-[#2563EB]" />
          </div>
          <div className="flex items-end justify-between">
            <div className="text-2xl font-bold text-[#271716]">{kpis.olvidado} items</div>
            <span className="text-xs font-semibold text-[#5f5e5e] hover:underline cursor-pointer" onClick={() => setSelectedAlertaTipo('olvido')}>Pendiente</span>
          </div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white border border-[#e4beb9]/30 rounded-xl p-3 gap-4 shadow-sm">
        <div className="w-full md:w-auto relative">
          <select 
            value={selectedSucursal}
            onChange={(e) => setSelectedSucursal(e.target.value)}
            className="w-full md:w-64 bg-transparent border border-[#e4beb9]/50 rounded-lg py-2 pl-4 pr-10 text-sm font-semibold text-[#271716] cursor-pointer focus:outline-none focus:border-[#b7131a] focus:ring-1 focus:ring-[#b7131a] appearance-none"
          >
            <option value="all">Todas las Sucursales</option>
            {sucursales.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none w-4 h-4 text-[#5f5e5e]">▼</div>
        </div>

        {/* Filter Pills */}
        <div className="flex w-full md:w-auto overflow-x-auto gap-2 py-1">
          <button 
            onClick={() => setSelectedAlertaTipo('all')}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full border text-xs font-bold transition-all ${
              selectedAlertaTipo === 'all'
                ? 'border-[#b7131a] bg-[#fff0ee] text-[#b7131a]'
                : 'border-[#e4beb9]/40 text-[#5f5e5e] hover:bg-[#e4e2e1]/30'
            }`}
          >
            Todos
          </button>
          <button 
            onClick={() => setSelectedAlertaTipo('critico')}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full border text-xs font-bold transition-all flex items-center gap-1.5 ${
              selectedAlertaTipo === 'critico'
                ? 'border-[#b7131a] bg-[#fff0ee] text-[#b7131a]'
                : 'border-[#e4beb9]/40 text-[#5f5e5e] hover:bg-[#e4e2e1]/30'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#b7131a]"></span>
            <span>Crítico</span>
          </button>
          <button 
            onClick={() => setSelectedAlertaTipo('sobrepedido')}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full border text-xs font-bold transition-all flex items-center gap-1.5 ${
              selectedAlertaTipo === 'sobrepedido'
                ? 'border-[#b7131a] bg-[#fff0ee] text-[#b7131a]'
                : 'border-[#e4beb9]/40 text-[#5f5e5e] hover:bg-[#e4e2e1]/30'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#D97706]"></span>
            <span>Exceso</span>
          </button>
          <button 
            onClick={() => setSelectedAlertaTipo('olvido')}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full border text-xs font-bold transition-all flex items-center gap-1.5 ${
              selectedAlertaTipo === 'olvido'
                ? 'border-[#b7131a] bg-[#fff0ee] text-[#b7131a]'
                : 'border-[#e4beb9]/40 text-[#5f5e5e] hover:bg-[#e4e2e1]/30'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#2563EB]"></span>
            <span>Olvido</span>
          </button>
        </div>
      </div>

      {/* Live-Editable Data Table Container */}
      <div className="bg-white border border-[#e4beb9]/30 rounded-2xl overflow-hidden flex-1 flex flex-col shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-[#fff0ee]/15 border-b border-[#e4beb9]/20">
                <th className="text-xs font-bold text-[#5f5e5e] py-4 px-5 uppercase tracking-wider">Sucursal</th>
                <th className="text-xs font-bold text-[#5f5e5e] py-4 px-5 uppercase tracking-wider">Ingrediente</th>
                <th className="text-xs font-bold text-[#5f5e5e] py-4 px-5 uppercase tracking-wider text-right">Stock Actual</th>
                <th className="text-xs font-bold text-[#5f5e5e] py-4 px-5 uppercase tracking-wider text-right">Proyección</th>
                <th className="text-xs font-bold text-[#5f5e5e] py-4 px-5 uppercase tracking-wider text-right">Nec. Real</th>
                <th className="text-xs font-bold text-[#5f5e5e] py-4 px-5 uppercase tracking-wider text-right">Cant. Pedido</th>
                <th className="text-xs font-bold text-[#5f5e5e] py-4 px-5 uppercase tracking-wider text-center">Estado</th>
                <th className="text-xs font-bold text-[#5f5e5e] py-4 px-5 uppercase tracking-wider text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="text-xs font-medium text-[#271716]">
              {filteredAlerts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-[#5f5e5e] font-semibold">
                    No se encontraron alertas para los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredAlerts.map((row, index) => {
                  // Determinar color de badge de estado
                  let badgeClass = 'bg-[#10B981]/10 text-[#059669]';
                  let statusLabel = 'OK';
                  let showWarningDot = false;
                  let dotBg = 'bg-[#10B981]';

                  if (row.alerta_tipo === 'Riesgo de Quiebre') {
                    badgeClass = 'bg-[#b7131a]/10 text-[#b7131a]';
                    statusLabel = 'CRÍTICO';
                    showWarningDot = true;
                    dotBg = 'bg-[#b7131a]';
                  } else if (row.alerta_tipo === 'Sobre-pedido') {
                    badgeClass = 'bg-[#F59E0B]/10 text-[#D97706]';
                    statusLabel = 'EXCESO';
                    showWarningDot = true;
                    dotBg = 'bg-[#F59E0B]';
                  } else if (row.alerta_tipo === 'Insumo Olvidado') {
                    badgeClass = 'bg-[#2563EB]/10 text-[#2563EB]';
                    statusLabel = 'OLVIDO';
                    showWarningDot = true;
                    dotBg = 'bg-[#2563EB]';
                  }

                  const needAction = row.alerta_tipo !== 'Correcto';

                  return (
                    <tr 
                      key={`${row.sucursal}-${row.ingrediente_id}`} 
                      className={`border-b border-[#e4beb9]/10 hover:bg-[#fff8f7] transition-colors h-[56px] ${
                        index % 2 === 1 ? 'bg-[#fff8f7]/40' : ''
                      }`}
                    >
                      <td className="py-2 px-5 font-semibold">{row.sucursal}</td>
                      <td className="py-2 px-5 font-bold text-[#271716]">{row.nombre}</td>
                      <td className="py-2 px-5 text-right font-mono">{row.stock_actual_unidad_base.toFixed(1)} {row.unidad_base}</td>
                      <td className="py-2 px-5 text-right font-mono text-[#5f5e5e]">{row.proyeccion.toFixed(1)} {row.unidad_base}</td>
                      <td className="py-2 px-5 text-right font-mono font-semibold">{row.necesidad_real.toFixed(1)} {row.unidad_base}</td>
                      
                      {/* Input de cantidad de pedido inline */}
                      <td className="py-2 px-5 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={row.cantidad_formatos}
                            onChange={(e) => handleCantidadChange(row.ingrediente_id, row.sucursal, parseFloat(e.target.value) || 0)}
                            className="w-16 text-right bg-white border border-[#e4beb9]/60 rounded px-1.5 py-1 text-xs font-bold font-mono focus:outline-none focus:border-[#b7131a] focus:ring-1 focus:ring-[#b7131a] text-[#b7131a]"
                          />
                          <span className="text-[#5f5e5e] font-semibold text-[10px] w-14 text-left truncate">{row.formato_compra}</span>
                        </div>
                      </td>

                      <td className="py-2 px-5 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded font-bold text-[10px] tracking-wider uppercase ${badgeClass}`}>
                          {showWarningDot && <span className={`w-1.5 h-1.5 rounded-full ${dotBg}`} />}
                          {statusLabel}
                        </span>
                      </td>

                      <td className="py-2 px-5 text-center">
                        {needAction ? (
                          <button
                            onClick={() => handleCorregir(row.ingrediente_id, row.sucursal, row.necesidad_real, row.unidad_base_por_formato)}
                            className="text-[#b7131a] hover:bg-[#b7131a]/5 border border-[#b7131a]/30 px-3 py-1 rounded text-[11px] font-bold transition-all"
                          >
                            Corregir
                          </button>
                        ) : (
                          <button
                            disabled
                            className="text-[#5f5e5e] border border-[#e4beb9]/30 px-3 py-1 rounded text-[11px] font-bold opacity-30 cursor-not-allowed"
                          >
                            Correcto
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
