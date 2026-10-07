import {
  registrarPerdidaSchema,
  type RegistrarPerdidaDTO,
} from "../dtos/perdida.dto";
import { registrarPerdida } from "../repositories/perdida.repository";

export async function crearPerdida(
  data: RegistrarPerdidaDTO,
  idUsuarioSesion?: number,
) {
  const datos = {
    ...data,
    ...(idUsuarioSesion ? { id_usuario: idUsuarioSesion } : {}),
  };
  const datosValidados = registrarPerdidaSchema.parse(datos);

  return await registrarPerdida(datosValidados);
}
