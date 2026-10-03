import { DestinatarioRepository } from '../repositories/destinatario.repository';
import type { Destinatario } from '../models/destinatario.model';

export class DestinatarioService {
  private repository: DestinatarioRepository;

  constructor() {
    this.repository = new DestinatarioRepository();
  }

  async registrarDestinatario(datos: Destinatario) {
    try {
      // D-07: Verificar si ya existe una empresa con ese nombre
      const existente = await this.repository.buscarPorNombre(datos.nombre_empresa);
      if (existente) {
        return { success: false, error: 'Ya existe un destinatario registrado con ese nombre de empresa.' };
      }

      const nuevoDestinatario = await this.repository.crear(datos);
      return { success: true, data: nuevoDestinatario };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async listarDestinatarios() {
    try {
      const destinatarios = await this.repository.obtenerTodos();
      return { success: true, data: destinatarios };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}
