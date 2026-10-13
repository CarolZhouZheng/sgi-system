export type NivelUrgencia = 'CRITICO' | 'ALTO' | 'MEDIO';
export type EstadoVencimiento = 'VENCIDO' | 'POR_VENCER';

export interface AlertaVencimiento {
  id_lote: number;
  numero_lote: string;
  id_producto: number;
  nombre_producto: string;
  categoria?: string | null;
  unidad_medida: string;
  cantidad: number;
  fecha_vencimiento: string; // YYYY-MM-DD
  fecha_produccion?: string | null;
  dias_restantes: number; // Negativo si ya venció, 0 si vence hoy, positivo si faltan días
  estado_vencimiento: EstadoVencimiento;
  nivel_urgencia: NivelUrgencia;
  mensaje: string;
}

export interface ResumenAlertas {
  total: number;
  total_vencidos: number;
  total_por_vencer: number;
  dias_umbral_alerta: number;
}

export interface RespuestaAlertas {
  resumen: ResumenAlertas;
  alertas: AlertaVencimiento[];
}
