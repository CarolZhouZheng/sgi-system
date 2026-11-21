# ==============================================================================
# Etapa 1: Construcción (Builder)
# Compila el frontend (Vue) y el backend (Nitro) de Nuxt 4 para producción.
# ==============================================================================
FROM node:24-slim AS builder

WORKDIR /app

# Copiar manifiestos y configuración base primero para aprovechar la caché de capas
COPY package.json package-lock.json nuxt.config.ts tsconfig.json ./

# Instalar dependencias exactas del lockfile
RUN npm ci

# Copiar el código fuente (filtrado por .dockerignore, sin .env ni credenciales)
COPY . .

# Compilar Nuxt 4 para producción sin credenciales en la imagen.
# Se pasan strings vacíos para que Nuxt conserve las claves de runtimeConfig.public
# y Nitro pueda sobreescribirlas en tiempo de ejecución desde compose.yaml.
ENV NODE_ENV=production
RUN SUPABASE_URL="" SUPABASE_ANON_KEY="" npm run build

# ==============================================================================
# Etapa 2: Ejecución (Production Runner)
# Imagen final liviana sin código fuente, sin devDependencies y sin credenciales.
# ==============================================================================
FROM node:24-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NITRO_HOST=0.0.0.0
ENV NITRO_PORT=3000
ENV TZ=America/Costa_Rica

# Copiar únicamente el resultado compilado (.output) con propietario no-root
COPY --from=builder --chown=node:node /app/.output ./.output

# Ejecutar como usuario no privilegiado por seguridad
USER node

EXPOSE 3000

# Verificación de salud del servidor Nuxt usando fetch nativo de Node 24
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/login').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", ".output/server/index.mjs"]
