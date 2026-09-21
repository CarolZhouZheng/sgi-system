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