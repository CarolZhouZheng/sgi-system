import {
  ActualizarProductoDTO,
  CrearProductoDTO,
  FiltroProductosDTO,
} from '../dtos/producto.dto';
import { ProductoRepository } from '../repositories/producto.repository';

export const ProductoService = {
  async registrarProducto(datos: CrearProductoDTO) {
    const producto = await ProductoRepository.crear(datos);

    return producto;
  },

  async listarProductos(filtros?: Partial<FiltroProductosDTO>) {
    const productos = await ProductoRepository.listar(filtros);

    if (filtros?.stock === 'bajo') {
      return productos.filter(
        (producto) => producto.stock_actual <= producto.stock_minimo
      );
    }

    return productos;
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

  async actualizarProducto(id: number, datos: ActualizarProductoDTO) {
    const producto = await this.obtenerPorId(id);

    if (!producto.estado) {
      throw createError({
        statusCode: 400,
        statusMessage: `El producto "${producto.nombre}" está dado de baja. Reactívelo antes de modificar sus datos`,
      });
    }

    // Las cadenas vacías en campos opcionales se guardan como null.
    const cambios = {
      ...datos,
      ...(datos.descripcion !== undefined && {
        descripcion: datos.descripcion || null,
      }),
      ...(datos.categoria !== undefined && {
        categoria: datos.categoria || null,
      }),
    };

    return await ProductoRepository.actualizar(id, cambios);
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