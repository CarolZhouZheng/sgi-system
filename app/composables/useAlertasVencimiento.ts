import { ref, computed } from 'vue';

export type NivelUrgencia = 'CRITICO' | 'ALTO' | 'MEDIO';
export type EstadoVencimiento = 'VENCIDO' | 'POR_VENCER';

export interface AlertaVencimientoItem {
  id_lote: number;
  numero_lote: string;
  id_producto: number;
  nombre_producto: string;
  categoria?: string | null;
  unidad_medida: string;
  cantidad: number;
  fecha_vencimiento: string;
  fecha_produccion?: string | null;
  dias_restantes: number;
  estado_vencimiento: EstadoVencimiento;
  nivel_urgencia: NivelUrgencia;
  mensaje: string;
}

export interface ResumenAlertasData {
  total: number;
  total_vencidos: number;
  total_por_vencer: number;
  dias_umbral_alerta: number;
}

export const useAlertasVencimiento = () => {
  const alertas = useState<AlertaVencimientoItem[]>('alertas_vencimiento_lista', () => []);
  const resumen = useState<ResumenAlertasData>('alertas_vencimiento_resumen', () => ({
    total: 0,
    total_vencidos: 0,
    total_por_vencer: 0,
    dias_umbral_alerta: 3,
  }));
  const loading = ref(false);
  const error = ref<string | null>(null);
  const ultimaActualizacion = ref<Date | null>(null);
  const filtroActivo = ref<'TODOS' | 'VENCIDOS' | 'POR_VENCER'>('TODOS');

  const cargarAlertas = async (diasAnticipacion?: number) => {
    loading.value = true;
    error.value = null;

    try {
      const queryParams: Record<string, string | number> = {};
      if (diasAnticipacion) {
        queryParams.dias_anticipacion = diasAnticipacion;
      }

      const res = await $fetch<{
        success: boolean;
        data: AlertaVencimientoItem[];
        resumen: ResumenAlertasData;
      }>('/api/alertas/vencimientos', {
        params: queryParams,
      });

      if (res && res.success) {
        alertas.value = res.data || [];
        resumen.value = res.resumen || {
          total: 0,
          total_vencidos: 0,
          total_por_vencer: 0,
          dias_umbral_alerta: 3,
        };
        ultimaActualizacion.value = new Date();
      }
    } catch (err: any) {
      error.value = err?.data?.statusMessage || err?.message || 'Error al obtener alertas de vencimiento';
      console.error('[RF-06] Error cargando alertas:', err);
    } finally {
      loading.value = false;
    }
  };

  const alertasFiltradas = computed(() => {
    if (filtroActivo.value === 'VENCIDOS') {
      return alertas.value.filter((a) => a.estado_vencimiento === 'VENCIDO');
    }
    if (filtroActivo.value === 'POR_VENCER') {
      return alertas.value.filter((a) => a.estado_vencimiento === 'POR_VENCER');
    }
    return alertas.value;
  });

  const totalAlertas = computed(() => resumen.value.total);
  const tieneVencidos = computed(() => resumen.value.total_vencidos > 0);
  const tienePorVencer = computed(() => resumen.value.total_por_vencer > 0);

  return {
    alertas,
    resumen,
    loading,
    error,
    ultimaActualizacion,
    filtroActivo,
    alertasFiltradas,
    totalAlertas,
    tieneVencidos,
    tienePorVencer,
    cargarAlertas,
  };
};
