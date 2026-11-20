export interface Producto {
  id_producto: number;
  nombre: string;
  descripcion: string | null;
  categoria: string | null;
  unidad_medida: string;
  stock_actual: number;
  stock_minimo: number;
  estado: boolean;
  fecha_creacion: string;
  fecha_vencimiento?: string | null;
}