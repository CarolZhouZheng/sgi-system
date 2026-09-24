import { ProductoService } from '../../services/producto.service';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);

  let filtroEstado: boolean | undefined = undefined;
  if (query.estado === 'true' || query.estado === true) {
    filtroEstado = true;
  } else if (query.estado === 'false' || query.estado === false) {
    filtroEstado = false;
  }

  const productos = await ProductoService.listarProductos(filtroEstado);

  return {
    success: true,
    total: productos.length,
    data: productos,
  };
});
