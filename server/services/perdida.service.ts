import {
  registrarPerdidaSchema,
  type RegistrarPerdidaDTO,
} from '../dtos/perdida.dto'
import { registrarPerdida } from '../repositories/perdida.repository'

export async function crearPerdida(data: RegistrarPerdidaDTO) {
  const datosValidados = registrarPerdidaSchema.parse(data)

  return await registrarPerdida(datosValidados)
}