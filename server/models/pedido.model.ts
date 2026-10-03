export interface DetallePedidoInput {
  id_producto: number
  cantidad: number
}

export interface CrearPedidoInput {
  id_destinatario: number
  id_usuario: number
  fecha_entrega?: string | null
  prioridad: string
  encargado_entrega?: string | null
  detalles: DetallePedidoInput[]
}

export interface Pedido {
  id_pedido: number
  id_destinatario: number
  id_usuario: number
  fecha_registro: string
  fecha_entrega: string | null
  estado: string
  prioridad: string
  encargado_entrega: string | null
  observaciones?: string | null
}

export interface DetallePedido {
  id_detalle_pedido: number
  id_pedido: number
  id_producto: number
  cantidad: number
  cantidad_entregada: number
  producto?: {
    id_producto: number
    nombre: string
    unidad_medida: string
  } | null
}

export interface PedidoListado extends Pedido {
  destinatario?: {
    id_destinatario: number
    nombre_empresa: string
  } | null
  detalle_pedido: DetallePedido[]
}