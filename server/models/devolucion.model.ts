// server/models/devolucion.model.ts
// RF-11: Gestión de Devoluciones (tabla devolucion)

export type EstadoDevolucion = 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';

export interface Devolucion {
  id_devolucion: number;
  id_pedido: number;
  id_producto: number;
  id_lote: number | null;
  id_usuario: number;
  cantidad_devuelta: number;
  motivo: string;
  fecha: string;
  estado: EstadoDevolucion;
  observaciones: string | null;
}

export interface ProductoDevolucionResumen {
  id_producto: number;
  nombre: string;
  unidad_medida: string;
  categoria?: string | null;
  stock_actual?: number;
}

export interface DestinatarioDevolucionResumen {
  id_destinatario: number;
  nombre_empresa: string;
  telefono?: string | null;
  correo?: string | null;
}

export interface PedidoDevolucionResumen {
  id_pedido: number;
  fecha_registro: string;
  fecha_entrega: string | null;
  estado: string;
  prioridad: string;
  id_destinatario: number;
  destinatario?: DestinatarioDevolucionResumen | null;
}

export interface UsuarioDevolucionResumen {
  id_usuario: number;
  nombre: string;
  apellido?: string | null;
  nombre_usuario: string;
}

export interface LoteDevolucionResumen {
  id_lote: number;
  numero_lote: string;
  fecha_vencimiento?: string | null;
}

export interface DevolucionDetalle extends Devolucion {
  producto?: ProductoDevolucionResumen | null;
  pedido?: PedidoDevolucionResumen | null;
  usuario?: UsuarioDevolucionResumen | null;
  lote?: LoteDevolucionResumen | null;
}

export interface CrearDevolucionInput {
  id_pedido: number;
  id_producto: number;
  id_lote?: number | null;
  id_usuario: number;
  cantidad_devuelta: number;
  motivo: string;
  fecha?: string;
  estado?: EstadoDevolucion;
  observaciones?: string | null;
}

export interface CambiarEstadoDevolucionInput {
  estado: EstadoDevolucion;
  observaciones?: string | null;
}

export interface FiltrosDevolucion {
  estado?: string;
  id_producto?: number;
  id_pedido?: number;
  id_destinatario?: number;
  fechaDesde?: string;
  fechaHasta?: string;
  limite?: number;
}
