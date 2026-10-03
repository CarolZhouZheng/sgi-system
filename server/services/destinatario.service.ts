import { DestinatarioRepository } from '../repositories/destinatario.repository';
import type { Destinatario } from '../models/destinatario.model';

export class DestinatarioService {
  private repository: DestinatarioRepository;

  constructor() {
    this.repository = new DestinatarioRepository();
  }

  async registrarDestinatario(datos: Destinatario) {
    try {
      // IT-22: Verificar duplicados comparando exactamente en minúsculas en el servicio
      const todos = await this.repository.obtenerTodos();
      const nombreBuscado = datos.nombre_empresa.trim().toLowerCase();
      
      const existente = todos.find(d => d.nombre_empresa.trim().toLowerCase() === nombreBuscado);
      
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
