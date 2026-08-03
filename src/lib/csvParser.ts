import Papa from 'papaparse';
import { Ingrediente, Consumo, Inventario, OrdenCompra } from '../types';

/**
 * Helper genérico para descargar y parsear archivos CSV en la carpeta public/
 */
export function fetchAndParseCSV<T>(url: string): Promise<T[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(url, {
      download: true,
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true, // Convierte números automáticamente
      complete: (results) => {
        resolve(results.data as T[]);
      },
      error: (err) => {
        reject(err);
      }
    });
  });
}

/**
 * Carga todos los conjuntos de datos del dashboard desde la carpeta /datos en public/
 */
export async function loadAllDashboardData(): Promise<{
  ingredientes: Ingrediente[];
  consumo: Consumo[];
  inventario: Inventario[];
  ordenes: OrdenCompra[];
}> {
  try {
    const [ingredientes, consumo, inventario, ordenes] = await Promise.all([
      fetchAndParseCSV<any>('/datos/ingredientes.csv'),
      fetchAndParseCSV<any>('/datos/consumo_historico.csv'),
      fetchAndParseCSV<any>('/datos/inventario_actual.csv'),
      fetchAndParseCSV<any>('/datos/orden_compra_semana.csv')
    ]);

    // Sanitización y casteo manual por seguridad
    const cleanIngredientes: Ingrediente[] = ingredientes.map(item => ({
      ingrediente_id: String(item.ingrediente_id || ''),
      nombre: String(item.nombre || ''),
      proveedor: String(item.proveedor || 'Distribuidora DPA'),
      unidad_base: String(item.unidad_base || 'und'),
      formato_compra: String(item.formato_compra || 'unidad'),
      unidad_base_por_formato: Number(item.unidad_base_por_formato || 1.0),
      es_perecedero: item.es_perecedero === 'Si' ? 'Si' : 'No'
    }));

    const cleanConsumo: Consumo[] = consumo.map(item => ({
      sucursal: String(item.sucursal || ''),
      ingrediente_id: String(item.ingrediente_id || ''),
      semana: String(item.semana || ''),
      consumo_unidad_base: Number(item.consumo_unidad_base || 0)
    }));

    const cleanInventario: Inventario[] = inventario.map(item => ({
      sucursal: String(item.sucursal || ''),
      ingrediente_id: String(item.ingrediente_id || ''),
      stock_actual_unidad_base: Number(item.stock_actual_unidad_base || 0)
    }));

    const cleanOrdenes: OrdenCompra[] = ordenes.map(item => ({
      sucursal: String(item.sucursal || ''),
      ingrediente_id: String(item.ingrediente_id || ''),
      cantidad_formatos: Number(item.cantidad_formatos || 0)
    }));

    return {
      ingredientes: cleanIngredientes,
      consumo: cleanConsumo,
      inventario: cleanInventario,
      ordenes: cleanOrdenes
    };
  } catch (error) {
    console.error('Error al cargar datos del dashboard:', error);
    throw error;
  }
}
