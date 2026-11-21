// ===== INICIO DE MI IMPLEMENTACIÓN - RF-01 (Modelo compartido en el módulo de productos) =====
// Esta interfaz define la estructura exacta que tiene un producto guardado en la tabla "producto" de la base de datos.
// Sirve para que TypeScript sepa qué campos devuelve Supabase después de registrar un producto.
// CONEXIÓN: La utiliza server/repositories/producto.repository.ts para indicar qué tipo de dato devuelve el método "crear".
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
// ===== FIN DE MI IMPLEMENTACIÓN - RF-01 =====