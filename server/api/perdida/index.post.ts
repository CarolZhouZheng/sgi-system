import { defineEventHandler, getCookie, readBody, createError } from "h3";
import { crearPerdida } from "../../services/perdida.service";

export default defineEventHandler(async (event) => {
  // D-18: Validar sesión obligatoriamente mediante la cookie de sesión
  const sessionCookie =
    getCookie(event, "usuario_session") || getCookie(event, "usuario_sesion");
  if (!sessionCookie) {
    throw createError({
      statusCode: 401,
      statusMessage: "No hay sesión activa.",
    });
  }

  let sesion: any;
  try {
    sesion =
      typeof sessionCookie === "string"
        ? JSON.parse(sessionCookie)
        : sessionCookie;
  } catch (error) {
    // D-18: Responder 401 si la cookie de sesión está dañada o no es JSON válido
    throw createError({
      statusCode: 401,
      statusMessage: "La sesión está dañada o es inválida.",
    });
  }

  const idUsuario = Number(sesion?.id_usuario);
  if (!idUsuario || isNaN(idUsuario) || idUsuario <= 0) {
    throw createError({
      statusCode: 401,
      statusMessage: "Sesión inválida.",
    });
  }

  const body = (await readBody(event)) || {};

  // D-19: El id_usuario debe provenir exclusivamente de la sesión autenticada.
  // Se ignora / sobrescribe cualquier id_usuario enviado en el body.
  body.id_usuario = idUsuario;

  try {
    return await crearPerdida(body, idUsuario);
  } catch (error: any) {
    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 400,
      statusMessage: error.message,
    });
  }
});
