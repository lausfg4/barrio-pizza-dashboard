'use client';

import React, { useState, useMemo } from 'react';
import { AlertaConsolidada } from '../types';
import { ChevronDown, ChevronUp, FileText, Download, CheckCircle2, Clock, Truck } from 'lucide-react';

interface TabSuppliersProps {
  alerts: AlertaConsolidada[];
}

export default function TabSuppliers({ alerts }: TabSuppliersProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);
  const [selectedSucursal, setSelectedSucursal] = useState<string>('all');

  // Obtener sucursales únicas para el dropdown
  const sucursales = useMemo(() => {
    return Array.from(new Set(alerts.map(a => a.sucursal))).sort();
  }, [alerts]);

  // Agrupar órdenes por Proveedor
  const orders = useMemo(() => {
    const ordersMap = new Map<string, Map<string, {
      ingrediente: string;
      cantidadFormatos: number;
      formato: string;
      unidadBasePorFormato: number;
    }>>();

    alerts.forEach(a => {
      // Filtrar por sucursal seleccionada
      if (selectedSucursal !== 'all' && a.sucursal !== selectedSucursal) {
        return;
      }

      // Solo incluimos insumos con pedido mayor a 0
      if (a.cantidad_formatos > 0) {
        const prov = a.proveedor || 'Distribuidora DPA';

        if (!ordersMap.has(prov)) {
          ordersMap.set(prov, new Map());
        }

        const providerMap = ordersMap.get(prov)!;
        const key = a.ingrediente_id; // Clave única por insumo para acumular cantidades

        if (providerMap.has(key)) {
          const existing = providerMap.get(key)!;
          existing.cantidadFormatos += a.cantidad_formatos;
        } else {
          providerMap.set(key, {
            ingrediente: a.nombre,
            cantidadFormatos: a.cantidad_formatos,
            formato: a.formato_compra,
            unidadBasePorFormato: a.unidad_base_por_formato
          });
        }
      }
    });

    // Crear lista de proveedores con códigos y metadatos simulados
    const list = Array.from(ordersMap.entries()).map(([proveedor, itemsMap], index) => {
      const items = Array.from(itemsMap.values());
      const initials = proveedor.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

      // Metadatos simulados por consistencia
      const codes = [`#ORD-2026-001`, `#ORD-2026-002`, `#ORD-2026-003`, `#ORD-2026-004`];
      const dates = ['Hoy, 4:00 PM', 'Mañana, 10:00 AM', '05/08/2026', '06/08/2026'];
      const statuses: Array<'Pendiente' | 'Entregado' | 'En camino'> = ['En camino', 'Pendiente', 'Entregado'];

      return {
        proveedor,
        initials,
        codigoOrden: codes[index % codes.length],
        fechaEntrega: dates[index % dates.length],
        estado: statuses[index % statuses.length],
        items
      };
    });

    return list;
  }, [alerts, selectedSucursal]);

  // Exportar datos a un archivo Excel formateado (.xls HTML)
  const handleExportExcel = (order: typeof orders[0]) => {
    const htmlContent = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #271716; }
    table { border-collapse: collapse; width: 100%; margin-top: 15px; }
    th { background-color: #b7131a; color: #ffffff; font-weight: bold; text-align: left; padding: 12px; border: 1px solid #e4beb9; }
    td { padding: 12px; border: 1px solid #e4beb9; font-size: 13px; }
    .title { font-size: 20px; font-weight: bold; color: #b7131a; margin-bottom: 5px; }
    .subtitle { font-size: 13px; color: #5f5e5e; margin-bottom: 25px; font-weight: bold; }
    .total-row { font-weight: bold; background-color: #fff0ee; color: #b7131a; }
    .number { text-align: right; }
  </style>
</head>
<body>
  <div class="title">Barrio Pizza — Orden de Compra</div>
  <div class="subtitle">Proveedor: ${order.proveedor}</div>
  <table>
    <thead>
      <tr>
        <th>Insumo</th>
        <th class="number">Cantidad Pedida</th>
      </tr>
    </thead>
    <tbody>
      ${order.items.map(item => `
        <tr>
          <td>${item.ingrediente}</td>
          <td class="number">${item.cantidadFormatos} ${item.formato}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
</body>
</html>
    `;

    const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Pedido_${order.proveedor.replace(/\s+/g, '_')}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Exportar datos a CSV
  const handleExportCSV = (order: typeof orders[0]) => {
    const headers = ['Insumo', 'Cantidad Pedida', 'Formato'];
    const rows = order.items.map(i => [
      i.ingrediente,
      i.cantidadFormatos,
      i.formato
    ]);

    const csvContent = [
      `Proveedor: ${order.proveedor}`,
      '',
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Pedido_${order.proveedor.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header and Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div className="flex flex-col gap-1">
          <h2 className="text-3xl font-bold text-[#271716] tracking-tight">Pedidos por Proveedor</h2>
          <p className="text-sm text-[#5f5e5e] font-medium">Órdenes de Compra Agrupadas</p>
        </div>

        <div className="relative w-full md:w-64">
          <select 
            value={selectedSucursal}
            onChange={(e) => setSelectedSucursal(e.target.value)}
            className="w-full bg-white border border-[#e4beb9]/50 rounded-lg py-2 pl-4 pr-10 text-sm font-semibold text-[#271716] cursor-pointer focus:outline-none focus:border-[#b7131a] focus:ring-1 focus:ring-[#b7131a] appearance-none shadow-sm"
          >
            <option value="all">Todas las Sucursales</option>
            {sucursales.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none w-4 h-4 text-[#5f5e5e]">▼</div>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white border border-[#e4beb9]/30 rounded-2xl p-12 text-center shadow-sm">
          <p className="text-sm text-[#5f5e5e] font-semibold">
            No hay órdenes de compra programadas. Agrega cantidades a pedir en la pestaña "Resumen &amp; Alertas" para generar órdenes.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((order, index) => {
            const isExpanded = expandedIndex === index;
            
            return (
              <div 
                key={order.proveedor}
                className="bg-white border border-[#e4beb9]/30 rounded-2xl overflow-hidden shadow-sm hover:shadow-[0px_4px_16px_rgba(183,28,28,0.02)] transition-all"
              >
                {/* Accordion Trigger Header */}
                <button
                  onClick={() => setExpandedIndex(isExpanded ? null : index)}
                  className="w-full flex flex-col md:flex-row md:items-center justify-between p-5 gap-4 hover:bg-[#fff8f7]/40 transition-colors text-left"
                >
                  <div className="flex items-center gap-4">
                    {/* Circle Avatar Initials */}
                    <div className="w-10 h-10 rounded-full bg-[#fff0ee] border border-[#e4beb9]/50 flex items-center justify-center font-bold text-sm text-[#b7131a]">
                      {order.initials}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#271716]">{order.proveedor}</h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 self-end md:self-auto">
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-[#5f5e5e]" /> : <ChevronDown className="w-5 h-5 text-[#5f5e5e]" />}
                  </div>
                </button>

                {/* Accordion Expandable Content */}
                {isExpanded && (
                  <div className="border-t border-[#e4beb9]/20 p-5 bg-[#fff8f7]/20 flex flex-col gap-4">
                    {/* Items List Table */}
                    <div className="border border-[#e4beb9]/30 rounded-xl overflow-hidden bg-white">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-[#fff0ee]/15 border-b border-[#e4beb9]/20 text-[11px] font-bold text-[#5f5e5e]">
                            <th className="py-2.5 px-4">Insumo</th>
                            <th className="py-2.5 px-4 text-right">Cantidad Pedida</th>
                          </tr>
                        </thead>
                        <tbody className="text-xs font-semibold text-[#271716]">
                          {order.items.map(item => (
                            <tr key={item.ingrediente} className="border-b border-[#e4beb9]/10">
                              <td className="py-2.5 px-4">{item.ingrediente}</td>
                              <td className="py-2.5 px-4 text-right font-mono">
                                {item.cantidadFormatos} {item.formato}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Export Actions */}
                    <div className="flex justify-end gap-2.5">
                      <button
                        onClick={() => handleExportCSV(order)}
                        className="bg-white hover:bg-[#fff8f7] border border-[#e4beb9]/50 text-[#b7131a] text-xs font-bold py-2.5 px-5 rounded-lg transition-all flex items-center gap-1.5 shadow-sm"
                      >
                        <Download className="w-4 h-4" />
                        <span>Exportar CSV</span>
                      </button>
                      <button
                        onClick={() => handleExportExcel(order)}
                        className="bg-white hover:bg-[#fff8f7] border border-[#e4beb9]/50 text-[#b7131a] text-xs font-bold py-2.5 px-5 rounded-lg transition-all flex items-center gap-1.5 shadow-sm"
                      >
                        <FileText className="w-4 h-4" />
                        <span>Exportar Excel</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
