// ===== INICIO DE MI IMPLEMENTACIÓN - RF-01 (Utilidad compartida con todo el proyecto) =====
// Este archivo crea la conexión entre nuestro servidor (backend) y la base de datos en Supabase.
// Lee la URL y la clave privada desde el archivo .env para tener permiso de guardar datos.
// CONEXIÓN: Es importado por server/repositories/producto.repository.ts para insertar productos en la tabla.
import { createClient } from '@supabase/supabase-js';

// En Nuxt, las variables se pueden leer de process.env o useRuntimeConfig()
const supabaseUrl = process.env.SUPABASE_URL || 'https://hiedwijbjchedscaxppf.supabase.co/';
// Usa la clave de servicio si está disponible, si no, usa la pública o el fallback
const supabaseKey =
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_KEY ||
  'sbpublishable--J0DehQC5BzVErwDdjUFg_ZgQwybna';

// Instancia global del cliente de Supabase para ser usada en el servidor
export const supabase = createClient(supabaseUrl, supabaseKey);
// ===== FIN DE MI IMPLEMENTACIÓN - RF-01 (Utilidad compartida con todo el proyecto) =====