<template>
  <v-app>
    <template v-if="authStore.isAuthenticated && authStore.hasAccess">
      <AppBar @toggle-drawer="drawer = !drawer" />
      <NavigationDrawer v-model="drawer" />
      
      <v-main>
        <v-container :fluid="$vuetify.display.mdAndUp" :class="containerClass">
          <router-view />
        </v-container>
      </v-main>
    </template>
    
    <template v-else>
      <router-view />
    </template>
  </v-app>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useDisplay, useTheme } from 'vuetify'
import { useAuthStore } from '@/stores/auth'
import { getSavedTheme, applyTheme, fetchRemoteTheme } from '@/utils/theme'
import AppBar from '@/components/layout/AppBar.vue'
import NavigationDrawer from '@/components/layout/NavigationDrawer.vue'

const authStore = useAuthStore()
const route = useRoute()
const display = useDisplay()
const theme = useTheme()

onMounted(async () => {
  const localTheme = getSavedTheme()
  applyTheme(theme, localTheme)
  await fetchRemoteTheme(theme)
})

// Drawer state - open by default on desktop, closed on mobile
const drawer = ref(display.mdAndUp.value)

// Container class for responsive padding
const containerClass = computed(() => {
  if (display.xs.value) return 'pa-2' // Mobile: minimal padding
  if (display.sm.value) return 'pa-4' // Tablet: small padding
  return 'pa-6' // Desktop: normal padding
})

// Auto-close drawer on mobile when route changes
watch(() => route.path, () => {
  if (display.xs.value) {
    drawer.value = false
  }
})
</script>

<style>
/* Responsive font sizing */
html {
  font-size: 16px; /* Desktop default */
}

@media (max-width: 960px) {
  html {
    font-size: 14px; /* Tablet */
  }
}

@media (max-width: 600px) {
  html {
    font-size: 12px; /* Mobile */
  }
}

/* Ensure proper scaling */
.v-application {
  font-size: 1rem;
}

/* Custom sub-texts and dynamic theme variable support */
.v-theme--light .text-medium-emphasis,
.v-theme--light .text-grey-darken-1 {
  color: var(--app-subtext-light, #64748B) !important;
}

.v-theme--dark .text-medium-emphasis,
.v-theme--dark .text-grey-darken-1 {
  color: var(--app-subtext-dark, #94A3B8) !important;
}
</style>
