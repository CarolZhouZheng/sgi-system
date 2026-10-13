import { AlertaRepository } from '../repositories/alerta.repository';
import type {
  AlertaVencimiento,
  EstadoVencimiento,
  NivelUrgencia,
  RespuestaAlertas,
} from '../models/alerta.model';
import type { ConsultaAlertasDto } from '../dtos/alerta.dto';

export const AlertaService = {
  /**
   * Calcula la diferencia de días entre la fecha de vencimiento y la fecha actual de referencia.
   * Devuelve un entero: < 0 si ya venció, 0 si vence hoy, > 0 si vence a futuro.
   */
  calcularDiasDiferencia(fechaVencimiento: string, fechaReferencia?: string): number {
    const hoyStr =
      fechaReferencia ||
      new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Tegucigalpa' }).format(new Date());

    const [aAno, aMes, aDia] = hoyStr.split('-').map(Number);
    const [vAno, vMes, vDia] = fechaVencimiento.split('-').map(Number);

    const fechaHoyUtc = Date.UTC(aAno, aMes - 1, aDia);
    const fechaVencUtc = Date.UTC(vAno, vMes - 1, vDia);

    const msPorDia = 1000 * 60 * 60 * 24;
    return Math.round((fechaVencUtc - fechaHoyUtc) / msPorDia);
  },

  /**
   * Obtiene la lista de alertas de productos/lotes próximos a vencer o ya vencidos,
   * junto con el resumen estadístico para la campana de notificaciones.
   */
  async obtenerAlertasVencimiento(
    params?: ConsultaAlertasDto,
    fechaReferencia?: string
  ): Promise<RespuestaAlertas> {
    const diasUmbral =
      params?.dias_anticipacion && params.dias_anticipacion > 0
        ? params.dias_anticipacion
        : await AlertaRepository.obtenerDiasConfiguracion();

    const lotesRaw = await AlertaRepository.obtenerLotesCandidatos();

    const todasAlertas: AlertaVencimiento[] = [];

    for (const lote of lotesRaw) {
      if (!lote.fecha_vencimiento) continue;

      const diasRestantes = this.calcularDiasDiferencia(
        lote.fecha_vencimiento,
        fechaReferencia
      );

      // Si el lote vence en más días que el umbral configurado, no genera alerta
      if (diasRestantes > diasUmbral) {
        continue;
      }

      let estadoVencimiento: EstadoVencimiento;
      let nivelUrgencia: NivelUrgencia;
      let mensaje: string;

      if (diasRestantes < 0) {
        estadoVencimiento = 'VENCIDO';
        nivelUrgencia = 'CRITICO';
        const diasPasados = Math.abs(diasRestantes);
        mensaje = diasPasados === 1 ? 'Venció hace 1 día' : `Venció hace ${diasPasados} días`;
      } else if (diasRestantes === 0) {
        estadoVencimiento = 'POR_VENCER';
        nivelUrgencia = 'CRITICO';
        mensaje = 'Vence hoy';
      } else if (diasRestantes === 1) {
        estadoVencimiento = 'POR_VENCER';
        nivelUrgencia = 'ALTO';
        mensaje = 'Vence mañana (1 día)';
      } else if (diasRestantes <= 2) {
        estadoVencimiento = 'POR_VENCER';
        nivelUrgencia = 'ALTO';
        mensaje = `Vence en ${diasRestantes} días`;
      } else {
        estadoVencimiento = 'POR_VENCER';
        nivelUrgencia = 'MEDIO';
        mensaje = `Vence en ${diasRestantes} días`;
      }

      // Extraer datos del producto relacionado
      const prodData = Array.isArray(lote.producto) ? lote.producto[0] : lote.producto;
      const nombreProducto = prodData?.nombre || `Producto #${lote.id_producto}`;
      const categoria = prodData?.categoria || null;
      const unidadMedida = prodData?.unidad_medida || 'unidad';

      todasAlertas.push({
        id_lote: lote.id_lote,
        numero_lote: lote.numero_lote,
        id_producto: lote.id_producto,
        nombre_producto: nombreProducto,
        categoria,
        unidad_medida: unidadMedida,
        cantidad: Number(lote.cantidad) || 0,
        fecha_vencimiento: lote.fecha_vencimiento,
        fecha_produccion: lote.fecha_produccion || null,
        dias_restantes: diasRestantes,
        estado_vencimiento: estadoVencimiento,
        nivel_urgencia: nivelUrgencia,
        mensaje,
      });
    }

    // Ordenar alertas: primero los vencidos (más antiguos primero), luego los más cercanos a vencer
    todasAlertas.sort((a, b) => a.dias_restantes - b.dias_restantes);

    // Contadores globales antes de filtrados opcionales
    const totalVencidos = todasAlertas.filter((a) => a.estado_vencimiento === 'VENCIDO').length;
    const totalPorVencer = todasAlertas.filter((a) => a.estado_vencimiento === 'POR_VENCER').length;

    // Aplicar filtros de consulta si fueron especificados
    let alertasFiltradas = todasAlertas;
    if (params?.solo_vencidos) {
      alertasFiltradas = todasAlertas.filter((a) => a.estado_vencimiento === 'VENCIDO');
    } else if (params?.solo_por_vencer) {
      alertasFiltradas = todasAlertas.filter((a) => a.estado_vencimiento === 'POR_VENCER');
    }

    return {
      resumen: {
        total: todasAlertas.length,
        total_vencidos: totalVencidos,
        total_por_vencer: totalPorVencer,
        dias_umbral_alerta: diasUmbral,
      },
      alertas: alertasFiltradas,
    };
  },
};
