export interface RegistrarPerdida {
  id_producto: number
  id_lote?: number | null
  id_usuario: number
  cantidad: number
  motivo: string
  tipo_perdida: string
  fecha?: string
  observaciones?: string
}

export interface ResultadoPerdida {
  id_perdida: number
  id_producto: number
  id_lote: number | null
  id_usuario: number
  cantidad: number
  stock_anterior: number
  stock_nuevo: number
  motivo: string
  tipo_perdida: string
  fecha: string
  observaciones: string | null
}
