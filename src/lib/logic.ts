import { Ingrediente, Consumo, Inventario, OrdenCompra, AlertaConsolidada } from '../types';

/**
 * Calcula la proyección del consumo para la Semana 7 utilizando un promedio ponderado
 * con pesos [0.05, 0.10, 0.15, 0.20, 0.25, 0.25] para las semanas S1 a S6.
 */
export function calculateProjections(dfConsumo: Consumo[]): Map<string, number> {
  const projections = new Map<string, number>();

  // Agrupar consumos por "sucursal|||ingrediente_id"
  const groups = new Map<string, Map<string, number>>();

  for (const item of dfConsumo) {
    const key = `${item.sucursal}|||${item.ingrediente_id}`;
    if (!groups.has(key)) {
      groups.set(key, new Map<string, number>());
    }
    groups.get(key)!.set(item.semana, item.consumo_unidad_base);
  }

  const weeks = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'];
  const weights = [0.05, 0.10, 0.15, 0.20, 0.25, 0.25];

  for (const [key, weekMap] of groups.entries()) {
    const values: number[] = [];
    let sum = 0;
    let count = 0;

    for (const w of weeks) {
      const val = weekMap.get(w);
      if (val !== undefined && !isNaN(val)) {
        values.push(val);
        sum += val;
        count++;
      } else {
        values.push(NaN);
      }
    }

    // Promedio para rellenar vacíos
    const mean = count > 0 ? sum / count : 0.0;

    // Rellenar NaN con la media
    const cleanValues = values.map(v => (isNaN(v) ? mean : v));

    // Multiplicación matricial (dot product)
    let projection = 0;
    for (let i = 0; i < 6; i++) {
      projection += cleanValues[i] * weights[i];
    }

    projections.set(key, projection);
  }

  return projections;
}

/**
 * Recalcula los tipos de alertas, iconos y mensajes descriptivos
 * basándose en el estado de cantidades modificadas por el usuario.
 */
export function recalculateAlerts(alerts: AlertaConsolidada[]): AlertaConsolidada[] {
  return alerts.map(row => {
    const proj = row.proyeccion;
    const inv = row.stock_actual_unidad_base;
    const nec = row.necesidad_real;
    const ped = row.cantidad_formatos * row.unidad_base_por_formato;
    const formatoVal = row.unidad_base_por_formato;
    const formatoTxt = row.formato_compra;
    const unidad = row.unidad_base;
    const ingrediente = row.nombre;
    const sucursal = row.sucursal;

    let tipo: 'Insumo Olvidado' | 'Riesgo de Quiebre' | 'Sobre-pedido' | 'Correcto' = 'Correcto';
    let icon = '🟢';
    let msg = '';

    // Alerta: Insumo Olvidado
    if (nec > 0 && ped === 0) {
      const formatoSugerido = Math.ceil(nec / formatoVal);
      msg = `Insumo Olvidado: ${sucursal} necesita ${nec.toFixed(2)} ${unidad} de ${ingrediente} pero no lo incluyó en el pedido. Se sugiere pedir al menos ${formatoSugerido} ${formatoTxt}.`;
      tipo = 'Insumo Olvidado';
      icon = '🔵';
    }
    // Alerta: Riesgo de Quiebre (Pedido < Necesidad Real)
    else if (ped < nec) {
      const falta = nec - ped;
      const formatoSugerido = Math.ceil(falta / formatoVal);
      msg = `Riesgo de Quiebre: ${sucursal} pide ${ped.toFixed(2)} ${unidad} de ${ingrediente}, pero requiere ${nec.toFixed(2)} ${unidad} (falta ${falta.toFixed(2)} ${unidad}). Se sugiere agregar ${formatoSugerido} ${formatoTxt} más.`;
      tipo = 'Riesgo de Quiebre';
      icon = '🔴';
    }
    // Alerta: Sobre-pedido (Pedido > Necesidad Real + 1 Formato en unidad base)
    else if (ped > nec + formatoVal) {
      const exceso = ped - nec;
      const perecederoWarn = row.es_perecedero === 'Si' ? ' (Insumo PERECEDERO - peligro de merma)' : '';
      msg = `Sobre-pedido: ${sucursal} pide ${ped.toFixed(2)} ${unidad} (${row.cantidad_formatos} ${formatoTxt}) de ${ingrediente}. Supera la necesidad real (${nec.toFixed(2)} ${unidad}) por ${exceso.toFixed(2)} ${unidad}${perecederoWarn}.`;
      tipo = 'Sobre-pedido';
      icon = '🟡';
    }
    // Estado: Correcto
    else {
      msg = `Correcto: El pedido de ${ped.toFixed(2)} ${unidad} (${row.cantidad_formatos} ${formatoTxt}) cubre bien la necesidad real de ${nec.toFixed(2)} ${unidad} en ${sucursal}.`;
      tipo = 'Correcto';
      icon = '🟢';
    }

    return {
      ...row,
      pedido_unidad_base: ped,
      alerta_tipo: tipo,
      alerta_icono: icon,
      alerta_mensaje: msg
    };
  });
}

/**
 * Combina las proyecciones, el inventario y las órdenes para generar las alertas de compra consolidadas.
 */
export function processAlerts(
  dfIngredientes: Ingrediente[],
  dfConsumo: Consumo[],
  dfInventario: Inventario[],
  dfOrdenes: OrdenCompra[]
): AlertaConsolidada[] {
  // 1. Proyectar consumos
  const dfProj = calculateProjections(dfConsumo);

  // 2. Generar base combinatoria cartesiana de Sucursales x Ingredientes
  const sucursales = Array.from(new Set(dfConsumo.map(c => c.sucursal)));
  const ingredienteIds = dfIngredientes.map(i => i.ingrediente_id);

  const dfMerged: AlertaConsolidada[] = [];

  for (const sucursal of sucursales) {
    for (const ingredienteId of ingredienteIds) {
      const ingrediente = dfIngredientes.find(i => i.ingrediente_id === ingredienteId)!;
      const key = `${sucursal}|||${ingredienteId}`;

      const proyeccion = dfProj.get(key) || 0.0;

      const invItem = dfInventario.find(i => i.sucursal === sucursal && i.ingrediente_id === ingredienteId);
      const stockActual = invItem ? invItem.stock_actual_unidad_base : 0.0;

      const necesidadReal = Math.max(0, proyeccion - stockActual);

      const ordItem = dfOrdenes.find(o => o.sucursal === sucursal && o.ingrediente_id === ingredienteId);
      const cantidadFormatos = ordItem ? ordItem.cantidad_formatos : 0.0;

      dfMerged.push({
        sucursal,
        ingrediente_id: ingredienteId,
        nombre: ingrediente.nombre || ingredienteId,
        unidad_base: ingrediente.unidad_base || 'und',
        formato_compra: ingrediente.formato_compra || 'unidad',
        unidad_base_por_formato: ingrediente.unidad_base_por_formato || 1.0,
        es_perecedero: ingrediente.es_perecedero || 'No',
        proveedor: ingrediente.proveedor || 'Distribuidora DPA',
        proyeccion,
        stock_actual_unidad_base: stockActual,
        necesidad_real: necesidadReal,
        cantidad_formatos: cantidadFormatos,
        pedido_unidad_base: cantidadFormatos * (ingrediente.unidad_base_por_formato || 1.0),
        alerta_tipo: 'Correcto', // Se recalcula abajo
        alerta_icono: '🟢',
        alerta_mensaje: ''
      });
    }
  }

  // Recalcular alertas del consolidado
  return recalculateAlerts(dfMerged);
}
