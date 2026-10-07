import { crearPerdida } from '../../services/perdida.service'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  try {
    return await crearPerdida(body)
  } catch (error: any) {
    throw createError({
      statusCode: 400,
      statusMessage: error.message,
    })
  }
})
