import { CrearProductoDTO } from '../dtos/producto.dto';
import { ProductoRepository } from '../repositories/producto.repository';

export const ProductoService = {
  async registrarProducto(datos: CrearProductoDTO) {
    const producto = await ProductoRepository.crear(datos);

    return producto;
  },
};