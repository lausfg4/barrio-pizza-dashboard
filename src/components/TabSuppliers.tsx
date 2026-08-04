'use client';

import React, { useState, useMemo } from 'react';
import { AlertaConsolidada } from '../types';
import { ChevronDown, ChevronUp, FileText, Download, CheckCircle2, Clock, Truck } from 'lucide-react';

interface TabSuppliersProps {
  alerts: AlertaConsolidada[];
}

export default function TabSuppliers({ alerts }: TabSuppliersProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  // Precios estimados para calcular el costo de los pedidos por unidad base
  const preciosUnitarios: Record<string, number> = {
    'Harina 00': 1.20,
    'Harina gluten free': 2.50,
    'Semola': 1.50,
    'Levadura': 4.00,
    'Oregano seco': 8.00,
    'Mozzarella': 6.50,
    'Burrata': 9.00,
    'Salsa pelatti': 2.50,
    'Pepperoni': 14.00,
    'Jamon': 8.50,
    'Parmesano': 12.00,
    'Queso vegano': 9.50,
    'Aceite de oliva': 9.00,
    'Aceitunas': 5.00,
    'Albahaca fresca': 4.00,
    'Arugula': 5.00,
    'Hongos': 4.50,
    'Cebolla blanca': 1.00,
    'Pimenton': 2.50,
    'Pina': 1.50,
    'Prosciutto': 18.00,
    'Cajas de pizza': 0.35
  };

  // Agrupar órdenes por Proveedor
  const orders = useMemo(() => {
    const ordersMap = new Map<string, Array<{
      ingrediente: string;
      cantidadFormatos: number;
      formato: string;
      unidadBasePorFormato: number;
      costoEstimado: number;
    }>>();

    alerts.forEach(a => {
      // Solo incluimos insumos con pedido mayor a 0
      if (a.cantidad_formatos > 0) {
        const prov = a.proveedor || 'Distribuidora DPA';
        const precioUnit = preciosUnitarios[a.nombre] || 3.00;
        const totalBase = a.cantidad_formatos * a.unidad_base_por_formato;
        const costoEstimado = totalBase * precioUnit;

        if (!ordersMap.has(prov)) {
          ordersMap.set(prov, []);
        }

        ordersMap.get(prov)!.push({
          ingrediente: a.nombre,
          cantidadFormatos: a.cantidad_formatos,
          formato: a.formato_compra,
          unidadBasePorFormato: a.unidad_base_por_formato,
          costoEstimado
        });
      }
    });

    // Crear lista de proveedores con códigos y metadatos simulados
    const list = Array.from(ordersMap.entries()).map(([proveedor, items], index) => {
      const totalPedido = items.reduce((acc, i) => acc + i.costoEstimado, 0);
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
        items,
        totalPedido
      };
    });

    return list;
  }, [alerts]);

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
        <th class="number">Costo Estimado (USD)</th>
      </tr>
    </thead>
    <tbody>
      ${order.items.map(item => `
        <tr>
          <td>${item.ingrediente}</td>
          <td class="number">${item.cantidadFormatos} ${item.formato}</td>
          <td class="number">$${item.costoEstimado.toFixed(2)}</td>
        </tr>
      `).join('')}
      <tr class="total-row">
        <td>Total General Estimado</td>
        <td class="number">-</td>
        <td class="number">$${order.totalPedido.toFixed(2)}</td>
      </tr>
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
    const headers = ['Insumo', 'Cantidad Pedida', 'Formato', 'Costo Estimado (USD)'];
    const rows = order.items.map(i => [
      i.ingrediente,
      i.cantidadFormatos,
      i.formato,
      i.costoEstimado.toFixed(2)
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
      {/* Header */}
      <div className="flex flex-col gap-1 mb-2">
        <h2 className="text-3xl font-bold text-[#271716] tracking-tight">Pedidos por Proveedor</h2>
        <p className="text-sm text-[#5f5e5e] font-medium">Órdenes de Compra Agrupadas</p>
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
                    {/* Total Order Cost */}
                    <div className="text-right">
                      <p className="text-[10px] text-[#5f5e5e] font-bold uppercase tracking-wider">Total Estimado</p>
                      <p className="text-sm font-bold text-[#b7131a]">${order.totalPedido.toFixed(2)}</p>
                    </div>

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
                            <th className="py-2.5 px-4 text-right">Costo Estimado</th>
                          </tr>
                        </thead>
                        <tbody className="text-xs font-semibold text-[#271716]">
                          {order.items.map(item => (
                            <tr key={item.ingrediente} className="border-b border-[#e4beb9]/10">
                              <td className="py-2.5 px-4">{item.ingrediente}</td>
                              <td className="py-2.5 px-4 text-right font-mono">
                                {item.cantidadFormatos} {item.formato}
                              </td>
                              <td className="py-2.5 px-4 text-right font-mono text-[#b7131a]">
                                ${item.costoEstimado.toFixed(2)}
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
