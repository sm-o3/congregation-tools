import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'

// Vuetify configuration with glassmorphism-ready themes
const vuetify = createVuetify({
    components,
    directives,
    theme: {
        defaultTheme: 'light',
        themes: {
            light: {
                colors: {
                    primary: '#6366F1',     // Indigo
                    secondary: '#8B5CF6',   // Violet
                    accent: '#F59E0B',      // Amber
                    error: '#EF4444',
                    info: '#3B82F6',
                    success: '#10B981',
                    warning: '#F59E0B',
                    surface: '#FFFFFF',
                    background: '#F0F2F5',
                    'on-surface': '#1E293B',
                    'on-background': '#1E293B',
                }
            },
            dark: {
                colors: {
                    primary: '#818CF8',     // Lighter Indigo
                    secondary: '#A78BFA',   // Lighter Violet
                    accent: '#FBBF24',
                    error: '#F87171',
                    info: '#60A5FA',
                    success: '#34D399',
                    warning: '#FBBF24',
                    surface: '#1E1B2E',
                    background: '#0F0D1A',
                    'on-surface': '#E2E8F0',
                    'on-background': '#E2E8F0',
                }
            }
        }
    },
    defaults: {
        VCard: {
            rounded: 'xl',
        },
        VBtn: {
            rounded: 'lg',
        },
        VTextField: {
            variant: 'outlined',
            rounded: 'lg',
        },
        VSelect: {
            variant: 'outlined',
            rounded: 'lg',
        },
        VTextarea: {
            variant: 'outlined',
            rounded: 'lg',
        },
        VCheckbox: {
            color: 'primary',
        },
        VDataTable: {
            mobileBreakpoint: 0,
        },
    }
})

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(vuetify)

// Initialize auth before mounting
const authStore = useAuthStore()
authStore.initAuth().then(() => {
    app.mount('#app')
})
