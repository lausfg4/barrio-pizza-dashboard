'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { AlertaConsolidada, Consumo } from '../types';
import { 
  LineChart as ReChartsLineChart, 
  Line, 
  BarChart as ReChartsBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { 
  Calendar, 
  Database, 
  AlertTriangle, 
  Trash2
} from 'lucide-react';

interface TabAnalyticsProps {
  alerts: AlertaConsolidada[];
  consumo: Consumo[];
}

export default function TabAnalytics({ alerts, consumo }: TabAnalyticsProps) {
  const [selectedSucursal, setSelectedSucursal] = useState<string>('');
  const [selectedIngrediente, setSelectedIngrediente] = useState<string>('');

  // Obtener sucursales únicas ordenadas
  const sucursales = useMemo(() => {
    return Array.from(new Set(consumo.map(c => c.sucursal))).sort();
  }, [consumo]);

  // Obtener ingredientes únicos ordenados para evitar duplicados en el select
  const ingredientes = useMemo(() => {
    const seen = new Set<string>();
    const list: Array<{ id: string; nombre: string }> = [];
    alerts.forEach(a => {
      if (!seen.has(a.ingrediente_id)) {
        seen.add(a.ingrediente_id);
        list.push({ id: a.ingrediente_id, nombre: a.nombre });
      }
    });
    return list.sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [alerts]);

  // Inicializar selectores con los primeros elementos disponibles
  useEffect(() => {
    if (sucursales.length > 0 && !selectedSucursal) {
      setSelectedSucursal(sucursales[0]);
    }
    if (ingredientes.length > 0 && !selectedIngrediente) {
      setSelectedIngrediente(ingredientes[0].id);
    }
  }, [sucursales, ingredientes, selectedSucursal, selectedIngrediente]);

  // Obtener datos consolidados para la combinación seleccionada
  const activeAlert = useMemo(() => {
    const targetSuc = selectedSucursal || (sucursales[0] || '');
    const targetIng = selectedIngrediente || (ingredientes[0]?.id || '');
    return alerts.find(a => a.sucursal === targetSuc && a.ingrediente_id === targetIng);
  }, [alerts, selectedSucursal, selectedIngrediente, sucursales, ingredientes]);

  // Consumo histórico de la combinación seleccionada
  const activeConsumos = useMemo(() => {
    const targetSuc = selectedSucursal || (sucursales[0] || '');
    const targetIng = selectedIngrediente || (ingredientes[0]?.id || '');
    return consumo.filter(c => c.sucursal === targetSuc && c.ingrediente_id === targetIng);
  }, [consumo, selectedSucursal, selectedIngrediente, sucursales, ingredientes]);

  // Calcular métricas para el insumo y sucursal seleccionados (Similares a Python)
  const metrics = useMemo(() => {
    if (!activeAlert) {
      return {
        consumoPromedio: '0.0',
        stock: '0.0',
        cobertura: '0.0 Días',
        coberturaStatus: 'Sin Datos',
        coberturaClass: 'bg-gray-100 text-gray-500',
        desperdicio: '0.0',
        unidad: ''
      };
    }

    const weeks = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'];
    const consumoSum = activeConsumos.reduce((acc, c) => acc + c.consumo_unidad_base, 0);
    const count = activeConsumos.length || 1;
    const consumoProm = consumoSum / count;

    const stock = activeAlert.stock_actual_unidad_base;
    const proyeccion = activeAlert.proyeccion;
    
    // Días de cobertura = (Stock / Proyección Semanal) * 7
    const coberturaDias = proyeccion > 0 ? (stock / proyeccion) * 7 : (stock > 0 ? 99.0 : 0.0);
    
    let coberturaStatus = 'Suficiente 🟢';
    let coberturaClass = 'bg-[#10B981]/10 text-[#059669]';
    if (coberturaDias < 3.0) {
      coberturaStatus = 'Crítico 🔴';
      coberturaClass = 'bg-[#b7131a]/10 text-[#b7131a]';
    } else if (coberturaDias < 7.0) {
      coberturaStatus = 'Regular 🟡';
      coberturaClass = 'bg-[#F59E0B]/10 text-[#D97706]';
    }

    // Desperdicio estimado = stock - proyeccion (si es perecedero)
    const desperdicioVal = activeAlert.es_perecedero === 'Si' ? Math.max(0, stock - proyeccion) : 0;

    return {
      consumoPromedio: consumoProm.toFixed(1),
      stock: stock.toFixed(1),
      cobertura: `${coberturaDias.toFixed(1)} Días`,
      coberturaStatus,
      coberturaClass,
      desperdicio: desperdicioVal.toFixed(1),
      unidad: activeAlert.unidad_base
    };
  }, [activeAlert, activeConsumos]);

  // Gráfico de Líneas (Tendencia)
  const lineChartData = useMemo(() => {
    const weeks = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'];
    const dataMap: Record<string, number> = {};
    weeks.forEach(w => { dataMap[w] = 0; });

    activeConsumos.forEach(c => {
      dataMap[c.semana] = c.consumo_unidad_base;
    });

    const proyeccionVal = activeAlert ? activeAlert.proyeccion : 0;

    return [
      { name: 'S1', Consumo: dataMap['S1'], Proyeccion: null },
      { name: 'S2', Consumo: dataMap['S2'], Proyeccion: null },
      { name: 'S3', Consumo: dataMap['S3'], Proyeccion: null },
      { name: 'S4', Consumo: dataMap['S4'], Proyeccion: null },
      { name: 'S5', Consumo: dataMap['S5'], Proyeccion: null },
      { name: 'S6', Consumo: dataMap['S6'], Proyeccion: dataMap['S6'] }, // Conector
      { name: 'S7 (Pred)', Consumo: null, Proyeccion: parseFloat(proyeccionVal.toFixed(2)) }
    ];
  }, [activeConsumos, activeAlert]);

  // Gráfico de Barras (Stock vs Necesidad del ingrediente seleccionado en todas las sucursales)
  const barChartData = useMemo(() => {
    const targetIng = selectedIngrediente || (ingredientes[0]?.id || '');
    const filteredAlerts = alerts.filter(a => a.ingrediente_id === targetIng);

    return filteredAlerts.map(a => ({
      name: a.sucursal,
      'Stock Actual': parseFloat(a.stock_actual_unidad_base.toFixed(1)),
      'Necesidad Real': parseFloat(a.necesidad_real.toFixed(1))
    }));
  }, [alerts, selectedIngrediente, ingredientes]);

  // Tabla inferior: listado de todos los insumos de la sucursal seleccionada
  const detailTableData = useMemo(() => {
    const targetSuc = selectedSucursal || (sucursales[0] || '');
    const filteredAlerts = alerts.filter(a => a.sucursal === targetSuc);

    return filteredAlerts.map(a => {
      const promedioSemana = a.proyeccion;
      const stock = a.stock_actual_unidad_base;
      const coberturaDias = promedioSemana > 0 ? (stock / (promedioSemana / 7)) : (stock > 0 ? 99 : 0);

      let estado = 'Suficiente 🟢';
      if (coberturaDias < 3) estado = 'Crítico 🔴';
      else if (coberturaDias < 7) estado = 'Regular 🟡';

      return {
        ingrediente: a.nombre,
        sucursal: a.sucursal,
        promedio: `${promedioSemana.toFixed(1)} ${a.unidad_base}/sem`,
        stock: `${stock.toFixed(1)} ${a.unidad_base}`,
        cobertura: `${coberturaDias.toFixed(1)} días`,
        estado
      };
    });
  }, [alerts, selectedSucursal, sucursales]);

  const activeIngredienteName = useMemo(() => {
    return ingredientes.find(i => i.id === selectedIngrediente)?.nombre || 'Ingrediente';
  }, [ingredientes, selectedIngrediente]);

  const alertBanner = useMemo(() => {
    if (!activeAlert) return null;

    const sucursal = activeAlert.sucursal;
    const ingrediente = activeAlert.nombre;
    const unidad = activeAlert.unidad_base;
    const ped = activeAlert.pedido_unidad_base;
    const proj = activeAlert.proyeccion;

    if (activeAlert.alerta_tipo === 'Riesgo de Quiebre') {
      return {
        type: 'danger',
        message: `ALERTA: ${sucursal} está pidiendo ${ped.toFixed(1)} ${unidad} de ${ingrediente} menos que lo proyectado (${proj.toFixed(1)} ${unidad}) → riesgo de quiebre.`
      };
    } else if (activeAlert.alerta_tipo === 'Insumo Olvidado') {
      return {
        type: 'warning',
        message: `ALERTA: ${sucursal} no incluyó ${ingrediente} en el pedido, pero se proyecta una necesidad de ${proj.toFixed(1)} ${unidad} → riesgo de desabastecimiento.`
      };
    } else if (activeAlert.alerta_tipo === 'Sobre-pedido') {
      return {
        type: 'excess',
        message: `ALERTA: ${sucursal} está pidiendo ${ped.toFixed(1)} ${unidad} de ${ingrediente} de más en comparación a lo proyectado (${proj.toFixed(1)} ${unidad}) → riesgo de merma.`
      };
    } else {
      return {
        type: 'success',
        message: `✓ El pedido de ${ped.toFixed(1)} ${unidad} de ${ingrediente} en ${sucursal} cubre adecuadamente la necesidad proyectada.`
      };
    }
  }, [activeAlert]);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-1 mb-2">
        <h2 className="text-3xl font-bold text-[#271716] tracking-tight">Análisis de Consumo</h2>
        <p className="text-sm text-[#5f5e5e] font-medium">Proyecciones de Inventario y Demanda</p>
      </div>

      {/* Select Filters */}
      <div className="flex flex-col md:flex-row gap-4 bg-white border border-[#e4beb9]/30 rounded-xl p-4 shadow-sm">
        <div className="flex-1 flex flex-col gap-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-[#5f5e5e]">Sucursal:</label>
          <div className="relative">
            <select 
              value={selectedSucursal}
              onChange={(e) => setSelectedSucursal(e.target.value)}
              className="w-full bg-transparent border border-[#e4beb9]/50 rounded-lg py-2 pl-4 pr-10 text-sm font-semibold text-[#271716] cursor-pointer focus:outline-none focus:border-[#b7131a] focus:ring-1 focus:ring-[#b7131a] appearance-none"
            >
              {sucursales.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none w-4 h-4 text-[#5f5e5e]">▼</div>
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-[#5f5e5e]">Insumo / Ingrediente:</label>
          <div className="relative">
            <select 
              value={selectedIngrediente}
              onChange={(e) => setSelectedIngrediente(e.target.value)}
              className="w-full bg-transparent border border-[#e4beb9]/50 rounded-lg py-2 pl-4 pr-10 text-sm font-semibold text-[#271716] cursor-pointer focus:outline-none focus:border-[#b7131a] focus:ring-1 focus:ring-[#b7131a] appearance-none"
            >
              {ingredientes.map(i => (
                <option key={i.id} value={i.id}>{i.nombre}</option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none w-4 h-4 text-[#5f5e5e]">▼</div>
          </div>
        </div>
      </div>

      {/* Alert Warning/Success Banner Box */}
      {alertBanner && (
        <div className={`border-l-4 rounded-xl p-4 text-xs font-bold shadow-sm ${
          alertBanner.type === 'danger'
            ? 'bg-[#fff0ee] border-[#b7131a] text-[#b7131a]'
            : alertBanner.type === 'warning'
            ? 'bg-[#eff6ff] border-[#2563EB] text-[#2563EB]'
            : alertBanner.type === 'excess'
            ? 'bg-[#fffbeb] border-[#D97706] text-[#D97706]'
            : 'bg-[#ecfdf5] border-[#10B981] text-[#059669]'
        }`}>
          {alertBanner.message}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* KPI 1: Consumo Promedio */}
        <div className="bg-white border border-[#e4beb9]/30 rounded-2xl p-6 flex flex-col justify-between hover:shadow-[0px_4px_16px_rgba(183,28,28,0.03)] transition-all">
          <div className="flex justify-between items-start mb-6">
            <span className="text-[11px] font-bold text-[#5f5e5e] uppercase tracking-wider">Consumo Total Semanal</span>
            <Calendar className="w-5 h-5 text-[#5f5e5e]" />
          </div>
          <div className="flex items-end justify-between">
            <div className="text-2xl font-bold text-[#271716]">{metrics.consumoPromedio} {metrics.unidad}</div>
            <div className="text-[10px] text-[#5f5e5e] bg-gray-100 px-2 py-0.5 rounded font-bold">Prom. S1 a S6</div>
          </div>
        </div>

        {/* KPI 2: Stock Promedio */}
        <div className="bg-white border border-[#e4beb9]/30 rounded-2xl p-6 flex flex-col justify-between hover:shadow-[0px_4px_16px_rgba(183,28,28,0.03)] transition-all">
          <div className="flex justify-between items-start mb-6">
            <span className="text-[11px] font-bold text-[#5f5e5e] uppercase tracking-wider">Stock Promedio</span>
            <Database className="w-5 h-5 text-[#5f5e5e]" />
          </div>
          <div className="flex items-end justify-between">
            <div className="text-2xl font-bold text-[#271716]">{metrics.stock} {metrics.unidad}</div>
            <div className="text-[10px] text-[#059669] bg-[#10B981]/10 px-2 py-0.5 rounded font-bold">En Bodega</div>
          </div>
        </div>

        {/* KPI 3: Días de Cobertura */}
        <div className="bg-white border border-[#e4beb9]/30 rounded-2xl p-6 flex flex-col justify-between hover:shadow-[0px_4px_16px_rgba(183,28,28,0.03)] transition-all">
          <div className="flex justify-between items-start mb-6">
            <span className="text-[11px] font-bold text-[#5f5e5e] uppercase tracking-wider">Días de Cobertura</span>
            <AlertTriangle className="w-5 h-5 text-[#5f5e5e]" />
          </div>
          <div className="flex items-end justify-between">
            <div className="text-2xl font-bold text-[#271716]">{metrics.cobertura}</div>
            <div className={`text-[10px] px-2 py-0.5 rounded font-bold ${metrics.coberturaClass}`}>
              {metrics.coberturaStatus}
            </div>
          </div>
        </div>

        {/* KPI 4: Desperdicio Estimado */}
        <div className="bg-white border border-[#e4beb9]/30 rounded-2xl p-6 flex flex-col justify-between hover:shadow-[0px_4px_16px_rgba(183,28,28,0.03)] transition-all">
          <div className="flex justify-between items-start mb-6">
            <span className="text-[11px] font-bold text-[#5f5e5e] uppercase tracking-wider">Desperdicio Estimado</span>
            <Trash2 className="w-5 h-5 text-[#5f5e5e]" />
          </div>
          <div className="flex items-end justify-between">
            <div className="text-2xl font-bold text-[#271716]">{metrics.desperdicio} {metrics.unidad}</div>
            <div className="text-[10px] text-[#D97706] bg-[#F59E0B]/10 px-2 py-0.5 rounded font-bold">Exceso Estimado</div>
          </div>
        </div>
      </div>

      {/* Recharts Graphs Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart */}
        <div className="bg-white border border-[#e4beb9]/30 rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-[#271716] mb-2 uppercase tracking-wider">Histórico de Consumo</h3>
          <p className="text-xs text-[#5f5e5e] font-semibold mb-4">
            Tendencia a 6 semanas y predicción ({activeIngredienteName})
          </p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ReChartsLineChart data={lineChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4beb9" strokeOpacity={0.2} />
                <XAxis dataKey="name" stroke="#5f5e5e" fontSize={11} fontWeight={600} />
                <YAxis stroke="#5f5e5e" fontSize={11} fontWeight={600} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e4beb9', borderRadius: '8px' }}
                  labelStyle={{ fontWeight: 'bold', color: '#271716' }}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                {/* Consumo Histórico */}
                <Line 
                  type="monotone" 
                  dataKey="Consumo" 
                  name="Consumo Real"
                  stroke="#271716" 
                  strokeWidth={3} 
                  dot={{ r: 5, stroke: '#271716', strokeWidth: 2, fill: '#FFFFFF' }} 
                  activeDot={{ r: 7 }} 
                  connectNulls
                />
                {/* Proyección S7 */}
                <Line 
                  type="monotone" 
                  dataKey="Proyeccion" 
                  name="Predicción"
                  stroke="#b7131a" 
                  strokeWidth={3} 
                  strokeDasharray="4 4" 
                  dot={{ r: 6, stroke: '#b7131a', strokeWidth: 2, fill: '#FFFFFF' }} 
                  connectNulls
                />
              </ReChartsLineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="bg-white border border-[#e4beb9]/30 rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-[#271716] mb-2 uppercase tracking-wider">Inventario vs Necesidad</h3>
          <p className="text-xs text-[#5f5e5e] font-semibold mb-4">
            Stock actual vs Proyección para próximos 7 días en sucursales
          </p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ReChartsBarChart data={barChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4beb9" strokeOpacity={0.2} />
                <XAxis dataKey="name" stroke="#5f5e5e" fontSize={10} fontWeight={600} />
                <YAxis stroke="#5f5e5e" fontSize={11} fontWeight={600} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e4beb9', borderRadius: '8px' }}
                  labelStyle={{ fontWeight: 'bold', color: '#271716' }}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                <Bar dataKey="Stock Actual" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Necesidad Real" fill="#b7131a" radius={[4, 4, 0, 0]} />
              </ReChartsBarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

    </div>
  );
}
