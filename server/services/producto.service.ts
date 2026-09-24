import { CrearProductoDTO } from '../dtos/producto.dto';
import { ProductoRepository } from '../repositories/producto.repository';

export const ProductoService = {
  async registrarProducto(datos: CrearProductoDTO) {
    const producto = await ProductoRepository.crear(datos);

    return producto;
  },

  async listarProductos(filtroEstado?: boolean) {
    return await ProductoRepository.listar(filtroEstado);
  },

  async obtenerPorId(id: number) {
    const producto = await ProductoRepository.obtenerPorId(id);
    if (!producto) {
      throw createError({
        statusCode: 404,
        statusMessage: `No se encontró ningún producto con ID ${id}`,
      });
    }
    return producto;
  },

  async darDeBajaProducto(id: number) {
    const producto = await this.obtenerPorId(id);

    if (!producto.estado) {
      throw createError({
        statusCode: 400,
        statusMessage: `El producto "${producto.nombre}" ya se encuentra dado de baja (inactivo)`,
      });
    }

    return await ProductoRepository.darDeBaja(id);
  },

  async reactivarProducto(id: number) {
    const producto = await this.obtenerPorId(id);

    if (producto.estado) {
      throw createError({
        statusCode: 400,
        statusMessage: `El producto "${producto.nombre}" ya se encuentra activo`,
      });
    }

    return await ProductoRepository.reactivar(id);
  },
};