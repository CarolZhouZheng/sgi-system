<script setup lang="ts">
// RF-00: Redirigir la raíz "/" al módulo principal del sistema
definePageMeta({ middleware: 'auth' })
await navigateTo('/productos', { replace: true })
</script>
