export type EstadoProduccion = 'PENDIENTE' | 'EN_PROCESO' | 'COMPLETADA' | 'CANCELADA'

export interface Produccion {
  id_produccion: number
  id_pedido?: number | null
  id_producto: number
  id_usuario: number
  id_lote?: number | null
  cantidad_planificada: number
  cantidad_producida: number
  estado: EstadoProduccion
  fecha_produccion: string
  tiempo_real?: string | null
  observaciones?: string | null
}

export interface ProduccionDetalle extends Produccion {
  producto?: {
    id_producto: number
    nombre: string
    unidad_medida: string
    categoria?: string | null
  } | null
  pedido?: {
    id_pedido: number
    prioridad: string
    fecha_entrega?: string | null
    estado: string
    destinatario?: {
      id_destinatario: number
      nombre_empresa: string
    } | null
  } | null
  usuario?: {
    id_usuario: number
    nombre: string
    nombre_usuario: string
  } | null
  lote?: {
    id_lote: number
    numero_lote: string
    fecha_vencimiento?: string | null
  } | null
}

export interface CrearProduccionInput {
  id_pedido?: number | null
  id_producto: number
  id_usuario: number
  id_lote?: number | null
  cantidad_planificada: number
  cantidad_producida?: number
  estado?: EstadoProduccion
  fecha_produccion?: string
  tiempo_real?: string | null
  observaciones?: string | null
}

export interface ActualizarProduccionInput {
  cantidad_planificada?: number
  cantidad_producida?: number
  estado?: EstadoProduccion
  id_lote?: number | null
  tiempo_real?: string | null
  observaciones?: string | null
}

export interface CambiarEstadoProduccionInput {
  estado: EstadoProduccion
  cantidad_producida?: number
  tiempo_real?: string | null
  observaciones?: string | null
}

export interface FiltrosColaProduccion {
  estado?: string
  id_producto?: number
  id_pedido?: number
  fecha?: string
}
