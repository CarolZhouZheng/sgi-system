import {
  ActualizarProductoDTO,
  CrearProductoDTO,
  FiltroProductosDTO,
} from '../dtos/producto.dto';
import { ProductoRepository } from '../repositories/producto.repository';

export const ProductoService = {
  // ===== INICIO DE MI IMPLEMENTACIÓN - RF-01 =====
  // Este método recibe los datos ya validados desde el endpoint (server/api/productos/index.post.ts).
  // CONEXIÓN: Llama a ProductoRepository.crear (server/repositories/producto.repository.ts) para guardar el producto en la base de datos y devuelve el resultado.
  async registrarProducto(datos: CrearProductoDTO) {
    const producto = await ProductoRepository.crear(datos);

    return producto;
  },
  // ===== FIN DE MI IMPLEMENTACIÓN - RF-01 =====
  // NOTA: Los métodos de abajo pertenecen a otros tickets (RF-07, RF-03 y RF-04).

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

    // La fecha de vencimiento no es columna de producto: se guarda en su lote.
    const { fecha_vencimiento, ...datosProducto } = datos;

    // Las cadenas vacías en campos opcionales se guardan como null.
    const cambios = {
      ...datosProducto,
      ...(datosProducto.descripcion !== undefined && {
        descripcion: datosProducto.descripcion || null,
      }),
      ...(datosProducto.categoria !== undefined && {
        categoria: datosProducto.categoria || null,
      }),
    };

    const hayCambiosProducto = Object.values(cambios).some((valor) => valor !== undefined);
    const productoActualizado = hayCambiosProducto
      ? await ProductoRepository.actualizar(id, cambios)
      : producto;

    if (fecha_vencimiento) {
      await ProductoRepository.actualizarFechaVencimiento(productoActualizado, fecha_vencimiento);
    }

    // Se devuelve siempre la fecha vigente (la que muestra el listado) para que no se pierda al editar.
    return {
      ...productoActualizado,
      fecha_vencimiento: await ProductoRepository.obtenerFechaVencimiento(id),
    };
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