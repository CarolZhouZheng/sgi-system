export default defineEventHandler((event) => {
  // Solo registramos si no estamos en producción
  if (process.env.NODE_ENV === 'production') return;

  const url = event.node.req.url || '/';

  // Omitir peticiones internas de Vite y assets para evitar spam en consola
  if (url.startsWith('/_nuxt') || url.includes('__vite') || url === '/favicon.ico') {
    return;
  }

  // Marca de tiempo al iniciar la petición
  const start = performance.now();
  const method = event.node.req.method || 'UNKNOWN';

  // Padding para que los métodos se vean alineados (ej. "GET    ", "DELETE ")
  const methodPadded = method.padEnd(7, ' ');

  event.node.res.on('finish', () => {
    const end = performance.now();
    const duration = (end - start).toFixed(2); // Duración en milisegundos
    const statusCode = event.node.res.statusCode;

    // Colores de fondo y texto estilo Gin (Golang)
    const reset = '\x1b[0m';
    const textBlack = '\x1b[30m';
    const textWhite = '\x1b[97m';
    const textBlue = '\x1b[34m';
    const textDim = '\x1b[2m';

    let statusColor = '\x1b[42m'; // Fondo verde
    let textColor = textBlack;

    if (statusCode >= 500) {
      statusColor = '\x1b[41m'; // Fondo rojo
      textColor = textWhite;
    } else if (statusCode >= 400) {
      statusColor = '\x1b[43m'; // Fondo amarillo
      textColor = textBlack;
    } else if (statusCode >= 300) {
      statusColor = '\x1b[46m'; // Fondo cian
      textColor = textBlack;
    }

    // Bloque del Status estilo Gin (ej. " 200 ")
    const statusBlock = `${statusColor}${textColor} ${statusCode} ${reset}`;

    // Marca de tiempo actual (ej. 15:04:05)
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

    // Construcción del log final estilo Gin / Golang
    console.log(`[API] ${textDim}${timeStr}${reset} | ${statusBlock} | ${duration.padStart(8, ' ')} ms | ${textBlue}${methodPadded}${reset} | ${url}`);
  });
});