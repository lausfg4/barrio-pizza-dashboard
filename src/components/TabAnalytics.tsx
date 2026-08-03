'use client';

import React, { useState, useMemo } from 'react';
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
  CheckCircle2, 
  Percent, 
  AlertOctagon,
  ArrowUpRight
} from 'lucide-react';

interface TabAnalyticsProps {
  alerts: AlertaConsolidada[];
  consumo: Consumo[];
}

export default function TabAnalytics({ alerts, consumo }: TabAnalyticsProps) {
  const [selectedSucursal, setSelectedSucursal] = useState<string>('all');
  const [selectedIngrediente, setSelectedIngrediente] = useState<string>('all');

  // Sucursales únicas
  const sucursales = useMemo(() => {
    return Array.from(new Set(consumo.map(c => c.sucursal)));
  }, [consumo]);

  // Ingredientes únicos en las alertas
  const ingredientes = useMemo(() => {
    return Array.from(new Set(alerts.map(a => ({ id: a.ingrediente_id, nombre: a.nombre }))));
  }, [alerts]);

  // Métricas Superiores
  const metrics = useMemo(() => {
    // Filtrar según sucursal
    const filteredAlerts = alerts.filter(a => selectedSucursal === 'all' || a.sucursal === selectedSucursal);
    
    // Cobertura general (promedio)
    let totalStock = 0;
    let totalProj = 0;
    filteredAlerts.forEach(a => {
      totalStock += a.stock_actual_unidad_base;
      totalProj += a.proyeccion;
    });
    
    // Proyección semanal promedio de la sucursal
    const coberturaSemanas = totalProj > 0 ? (totalStock / totalProj) : 0;
    
    // Eficiencia de pedido
    let okCount = 0;
    filteredAlerts.forEach(a => {
      if (a.alerta_tipo === 'Correcto') okCount++;
    });
    const eficiencia = filteredAlerts.length > 0 ? (okCount / filteredAlerts.length) * 100 : 100;
    
    // Total Mermas Ponderadas (estimadas para sobre-pedidos)
    let mermasVal = 0;
    filteredAlerts.forEach(a => {
      if (a.alerta_tipo === 'Sobre-pedido' && a.es_perecedero === 'Si') {
        // Asignamos un costo ficticio al kilo/litro de $10.00 para la métrica
        const exceso = a.pedido_unidad_base - a.necesidad_real;
        mermasVal += exceso * 12.5; // Costo por unidad ponderada
      }
    });

    // Insumos críticos (menos de 0.5 semanas de cobertura)
    let criticos = 0;
    filteredAlerts.forEach(a => {
      if (a.proyeccion > 0) {
        const cover = a.stock_actual_unidad_base / a.proyeccion;
        if (cover < 0.5) criticos++;
      } else if (a.stock_actual_unidad_base === 0) {
        criticos++;
      }
    });

    return {
      cobertura: `${coberturaSemanas.toFixed(1)} semanas`,
      eficiencia: `${eficiencia.toFixed(1)}%`,
      mermas: `$${mermasVal.toFixed(2)}`,
      criticos: `${criticos} insumos`
    };
  }, [alerts, selectedSucursal]);

  // Datos para el gráfico de Línea de Tendencia (S1 a S6, y S7 proyectado)
  const lineChartData = useMemo(() => {
    // Filtrar consumo histórico
    const filteredConsumo = consumo.filter(c => {
      const matchSuc = selectedSucursal === 'all' || c.sucursal === selectedSucursal;
      const matchIng = selectedIngrediente === 'all' || c.ingrediente_id === selectedIngrediente;
      return matchSuc && matchIng;
    });

    // Obtener consumo semanal sumado
    const weeks = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'];
    const dataMap: Record<string, number> = {};
    weeks.forEach(w => { dataMap[w] = 0; });

    filteredConsumo.forEach(c => {
      if (dataMap[c.semana] !== undefined) {
        dataMap[c.semana] += c.consumo_unidad_base;
      }
    });

    // Obtener proyección S7 sumada para los mismos filtros
    const filteredAlerts = alerts.filter(a => {
      const matchSuc = selectedSucursal === 'all' || a.sucursal === selectedSucursal;
      const matchIng = selectedIngrediente === 'all' || a.ingrediente_id === selectedIngrediente;
      return matchSuc && matchIng;
    });
    const s7Proj = filteredAlerts.reduce((acc, a) => acc + a.proyeccion, 0);

    const chart = [
      { name: 'S1', Consumo: dataMap['S1'], Proyeccion: null },
      { name: 'S2', Consumo: dataMap['S2'], Proyeccion: null },
      { name: 'S3', Consumo: dataMap['S3'], Proyeccion: null },
      { name: 'S4', Consumo: dataMap['S4'], Proyeccion: null },
      { name: 'S5', Consumo: dataMap['S5'], Proyeccion: null },
      { name: 'S6', Consumo: dataMap['S6'], Proyeccion: dataMap['S6'] }, // Conector
      { name: 'S7', Consumo: null, Proyeccion: s7Proj } // Proyección punteada
    ];

    return chart;
  }, [consumo, alerts, selectedSucursal, selectedIngrediente]);

  // Datos para el gráfico de Barras: Stock vs Necesidad
  const barChartData = useMemo(() => {
    const filteredAlerts = alerts.filter(a => {
      const matchSuc = selectedSucursal === 'all' || a.sucursal === selectedSucursal;
      const matchIng = selectedIngrediente === 'all' || a.ingrediente_id === selectedIngrediente;
      return matchSuc && matchIng;
    });

    // Agrupar por ingrediente para consolidar
    const ingredientMap = new Map<string, { stock: number; necesidad: number }>();
    filteredAlerts.forEach(a => {
      const existing = ingredientMap.get(a.nombre) || { stock: 0, necesidad: 0 };
      ingredientMap.set(a.nombre, {
        stock: existing.stock + a.stock_actual_unidad_base,
        necesidad: existing.necesidad + a.necesidad_real
      });
    });

    return Array.from(ingredientMap.entries()).map(([name, val]) => ({
      name,
      'Stock Actual': parseFloat(val.stock.toFixed(1)),
      'Necesidad Real': parseFloat(val.necesidad.toFixed(1))
    })).slice(0, 8); // Mostrar los primeros 8 para no saturar
  }, [alerts, selectedSucursal, selectedIngrediente]);

  // Tabla inferior de análisis por ingrediente
  const detailTableData = useMemo(() => {
    const filteredAlerts = alerts.filter(a => selectedSucursal === 'all' || a.sucursal === selectedSucursal);
    
    // Agrupar por ingrediente y promediar consumos
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
  }, [alerts, selectedSucursal]);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-1 mb-2">
        <h2 className="text-3xl font-bold text-[#271716] tracking-tight">Análisis de Consumo</h2>
        <p className="text-sm text-[#5f5e5e] font-medium">Proyecciones de Inventario y Demanda</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border border-[#e4beb9]/30 rounded-2xl p-6 flex flex-col justify-between hover:shadow-[0px_4px_16px_rgba(183,28,28,0.03)] transition-all">
          <div className="flex justify-between items-start mb-6">
            <span className="text-[11px] font-bold text-[#5f5e5e] uppercase tracking-wider">Cobertura General</span>
            <Calendar className="w-5 h-5 text-[#5f5e5e]" />
          </div>
          <div className="flex items-end justify-between">
            <div className="text-2xl font-bold text-[#271716]">{metrics.cobertura}</div>
            <div className="text-[10px] text-[#059669] bg-[#10B981]/10 px-2 py-0.5 rounded font-bold">Estado: Óptimo</div>
          </div>
        </div>

        <div className="bg-white border border-[#e4beb9]/30 rounded-2xl p-6 flex flex-col justify-between hover:shadow-[0px_4px_16px_rgba(183,28,28,0.03)] transition-all">
          <div className="flex justify-between items-start mb-6">
            <span className="text-[11px] font-bold text-[#5f5e5e] uppercase tracking-wider">Eficiencia de Pedido</span>
            <CheckCircle2 className="w-5 h-5 text-[#5f5e5e]" />
          </div>
          <div className="flex items-end justify-between">
            <div className="text-2xl font-bold text-[#271716]">{metrics.eficiencia}</div>
            <div className="text-[10px] text-[#b7131a] bg-[#fff0ee] px-2 py-0.5 rounded font-bold flex items-center">
              <ArrowUpRight className="w-3 h-3 mr-0.5" /> +2.1% vs S6
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#e4beb9]/30 rounded-2xl p-6 flex flex-col justify-between hover:shadow-[0px_4px_16px_rgba(183,28,28,0.03)] transition-all">
          <div className="flex justify-between items-start mb-6">
            <span className="text-[11px] font-bold text-[#5f5e5e] uppercase tracking-wider">Pérdida por Merma</span>
            <Percent className="w-5 h-5 text-[#5f5e5e]" />
          </div>
          <div className="flex items-end justify-between">
            <div className="text-2xl font-bold text-[#271716]">{metrics.mermas}</div>
            <div className="text-[10px] text-[#059669] bg-[#10B981]/10 px-2 py-0.5 rounded font-bold">-12.5%</div>
          </div>
        </div>

        <div className="bg-white border border-[#e4beb9]/30 rounded-2xl p-6 flex flex-col justify-between hover:shadow-[0px_4px_16px_rgba(183,28,28,0.03)] transition-all">
          <div className="flex justify-between items-start mb-6">
            <span className="text-[11px] font-bold text-[#b7131a] uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#b7131a]"></span> Insumos Críticos
            </span>
            <AlertOctagon className="w-5 h-5 text-[#b7131a]" />
          </div>
          <div className="flex items-end justify-between">
            <div className="text-2xl font-bold text-[#271716]">{metrics.criticos}</div>
            <div className="text-[10px] text-[#b7131a] bg-[#fff0ee] px-2 py-0.5 rounded font-bold">Alerta Activa</div>
          </div>
        </div>
      </div>

      {/* Select Filters */}
      <div className="flex flex-col md:flex-row gap-4 bg-white border border-[#e4beb9]/30 rounded-xl p-3 shadow-sm">
        <div className="flex-1 relative">
          <select 
            value={selectedSucursal}
            onChange={(e) => setSelectedSucursal(e.target.value)}
            className="w-full bg-transparent border border-[#e4beb9]/50 rounded-lg py-2 pl-4 pr-10 text-sm font-semibold text-[#271716] cursor-pointer focus:outline-none focus:border-[#b7131a] focus:ring-1 focus:ring-[#b7131a] appearance-none"
          >
            <option value="all">Todas las Sucursales</option>
            {sucursales.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none w-4 h-4 text-[#5f5e5e]">▼</div>
        </div>

        <div className="flex-1 relative">
          <select 
            value={selectedIngrediente}
            onChange={(e) => setSelectedIngrediente(e.target.value)}
            className="w-full bg-transparent border border-[#e4beb9]/50 rounded-lg py-2 pl-4 pr-10 text-sm font-semibold text-[#271716] cursor-pointer focus:outline-none focus:border-[#b7131a] focus:ring-1 focus:ring-[#b7131a] appearance-none"
          >
            <option value="all">Todos los Ingredientes</option>
            {ingredientes.map(i => (
              <option key={i.id} value={i.id}>{i.nombre}</option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none w-4 h-4 text-[#5f5e5e]">▼</div>
        </div>
      </div>

      {/* Recharts Graphs Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart */}
        <div className="bg-white border border-[#e4beb9]/30 rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-[#271716] mb-4 uppercase tracking-wider">Tendencia de Consumo e Histórico</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ReChartsLineChart data={lineChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4beb9/20" />
                <XAxis dataKey="name" stroke="#5f5e5e" fontSize={11} fontWeight={600} />
                <YAxis stroke="#5f5e5e" fontSize={11} fontWeight={600} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#white', borderColor: '#e4beb9', borderRadius: '8px' }}
                  labelStyle={{ fontWeight: 'bold', color: '#271716' }}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                {/* Consumo Histórico */}
                <Line 
                  type="monotone" 
                  dataKey="Consumo" 
                  stroke="#271716" 
                  strokeWidth={2} 
                  dot={{ r: 4, stroke: '#271716', strokeWidth: 1.5, fill: '#FFFFFF' }} 
                  activeDot={{ r: 6 }} 
                  connectNulls
                />
                {/* Proyección S7 */}
                <Line 
                  type="monotone" 
                  dataKey="Proyeccion" 
                  stroke="#b7131a" 
                  strokeWidth={2} 
                  strokeDasharray="5 5" 
                  dot={{ r: 4, stroke: '#b7131a', strokeWidth: 1.5, fill: '#FFFFFF' }} 
                  connectNulls
                />
              </ReChartsLineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="bg-white border border-[#e4beb9]/30 rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-[#271716] mb-4 uppercase tracking-wider">Stock Actual vs. Necesidad Real</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ReChartsBarChart data={barChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4beb9/20" />
                <XAxis dataKey="name" stroke="#5f5e5e" fontSize={10} fontWeight={600} />
                <YAxis stroke="#5f5e5e" fontSize={11} fontWeight={600} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#white', borderColor: '#e4beb9', borderRadius: '8px' }}
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

      {/* Bottom Detail Table */}
      <div className="bg-white border border-[#e4beb9]/30 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-[#e4beb9]/20">
          <h3 className="text-sm font-bold text-[#271716] uppercase tracking-wider">Detalle de Cobertura de Stock</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#fff0ee]/15 border-b border-[#e4beb9]/20">
                <th className="text-xs font-bold text-[#5f5e5e] py-3.5 px-5">Ingrediente</th>
                <th className="text-xs font-bold text-[#5f5e5e] py-3.5 px-5">Sucursal</th>
                <th className="text-xs font-bold text-[#5f5e5e] py-3.5 px-5">Consumo Promedio</th>
                <th className="text-xs font-bold text-[#5f5e5e] py-3.5 px-5">Stock Actual</th>
                <th className="text-xs font-bold text-[#5f5e5e] py-3.5 px-5">Días Cobertura</th>
                <th className="text-xs font-bold text-[#5f5e5e] py-3.5 px-5 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="text-xs font-medium text-[#271716]">
              {detailTableData.slice(0, 10).map((row, index) => {
                return (
                  <tr 
                    key={`${row.sucursal}-${row.ingrediente}`} 
                    className={`border-b border-[#e4beb9]/10 hover:bg-[#fff8f7] transition-colors h-[48px] ${
                      index % 2 === 1 ? 'bg-[#fff8f7]/40' : ''
                    }`}
                  >
                    <td className="py-2 px-5 font-bold">{row.ingrediente}</td>
                    <td className="py-2 px-5 font-semibold text-[#5f5e5e]">{row.sucursal}</td>
                    <td className="py-2 px-5 font-mono">{row.promedio}</td>
                    <td className="py-2 px-5 font-mono font-semibold">{row.stock}</td>
                    <td className="py-2 px-5 font-mono font-bold text-[#b7131a]">{row.cobertura}</td>
                    <td className="py-2 px-5 text-center font-bold">{row.estado}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
