export interface Ingrediente {
  ingrediente_id: string;
  nombre: string;
  proveedor: string;
  unidad_base: string;
  formato_compra: string;
  unidad_base_por_formato: number;
  es_perecedero: 'Si' | 'No';
}

export interface Consumo {
  sucursal: string;
  ingrediente_id: string;
  semana: string;
  consumo_unidad_base: number;
}

export interface Inventario {
  sucursal: string;
  ingrediente_id: string;
  stock_actual_unidad_base: number;
}

export interface OrdenCompra {
  sucursal: string;
  ingrediente_id: string;
  cantidad_formatos: number;
}

export interface AlertaConsolidada {
  sucursal: string;
  ingrediente_id: string;
  nombre: string;
  unidad_base: string;
  formato_compra: string;
  unidad_base_por_formato: number;
  es_perecedero: 'Si' | 'No';
  proveedor: string;
  proyeccion: number;
  stock_actual_unidad_base: number;
  necesidad_real: number;
  cantidad_formatos: number;
  pedido_unidad_base: number;
  alerta_tipo: 'Insumo Olvidado' | 'Riesgo de Quiebre' | 'Sobre-pedido' | 'Correcto';
  alerta_mensaje: string;
  alerta_icono: string;
}

export interface ProveedorPedido {
  proveedor: string;
  codigoOrden: string;
  fechaEntrega: string;
  estado: 'Pendiente' | 'Entregado' | 'En camino' | 'Cancelado';
  sucursal: string;
  items: Array<{
    ingrediente: string;
    cantidadFormatos: number;
    formato: string;
    costoEstimado: number;
  }>;
  totalPedido: number;
}
