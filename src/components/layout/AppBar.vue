<template>
  <v-app-bar elevation="0" app height="64">
    <!-- Hamburger menu -->
    <v-app-bar-nav-icon 
      @click="$emit('toggle-drawer')"
      class="mr-0"
    />
    
    <v-app-bar-title class="brand-title ms-1">
      <router-link to="/" class="text-decoration-none">
        <div class="brand-badge clickable" :title="displayTitle">
          <span class="brand-text">{{ displayTitle }}</span>
        </div>
      </router-link>
    </v-app-bar-title>
    
    <v-spacer />
    
    <!-- Theme Toggle -->
    <v-btn 
      icon 
      variant="text"
      @click="toggleTheme"
      class="mr-1"
    >
      <v-icon>{{ isDark ? 'mdi-white-balance-sunny' : 'mdi-weather-night' }}</v-icon>
      <v-tooltip activator="parent" location="bottom">Toggle Theme</v-tooltip>
    </v-btn>
    
    <v-menu offset-y>
      <template v-slot:activator="{ props }">
        <v-btn icon v-bind="props" class="mr-2">
          <v-avatar size="36" color="primary" variant="tonal">
            <v-img 
              v-if="authStore.user?.photoURL" 
              :src="authStore.user.photoURL"
              alt="User avatar"
            />
            <span v-else class="text-body-2 font-weight-bold">
              {{ (authStore.user?.displayName || authStore.user?.email || '?')[0].toUpperCase() }}
            </span>
          </v-avatar>
        </v-btn>
      </template>
      
      <v-list rounded="lg" min-width="200">
        <v-list-item>
          <v-list-item-title class="text-body-2 font-weight-bold">
            {{ authStore.user?.displayName || authStore.user?.email }}
          </v-list-item-title>
          <v-list-item-subtitle class="text-caption">
            {{ authStore.userRole }}
          </v-list-item-subtitle>
        </v-list-item>
        
        <v-divider class="my-1" />
        
        <v-list-item @click="goToProfile" prepend-icon="mdi-account-outline" rounded="lg">
          <v-list-item-title>My Profile</v-list-item-title>
        </v-list-item>
        
        <v-list-item @click="handleLogout" prepend-icon="mdi-logout" rounded="lg" color="error">
          <v-list-item-title>Logout</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
  </v-app-bar>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useTheme } from 'vuetify'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

defineEmits(['toggle-drawer'])

const authStore = useAuthStore()
const router = useRouter()
const theme = useTheme()

const isDark = computed(() => theme.global.current.value.dark)
const displayTitle = computed(() => authStore.congregationName?.trim() || 'Congregation Tools')

onMounted(async () => {
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme) {
    theme.global.name.value = savedTheme
  }
  if (!authStore.congregationName) {
    await authStore.fetchCongSettings()
  }
})

const toggleTheme = () => {
  theme.global.name.value = theme.global.current.value.dark ? 'light' : 'dark'
  localStorage.setItem('theme', theme.global.name.value)
}

const goToProfile = () => {
  router.push('/profile')
}

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
:deep(.v-toolbar-title.brand-title),
:deep(.brand-title) {
  margin-inline-start: 4px !important;
}

.brand-badge {
  display: inline-flex;
  align-items: center;
  background: linear-gradient(135deg, #6366F1, #8B5CF6);
  color: white;
  padding: 6px 16px;
  border-radius: 10px;
  font-weight: 700;
  font-size: 0.95rem;
  letter-spacing: -0.01em;
  box-shadow: 0 2px 12px rgba(99, 102, 241, 0.35);
  max-width: 100%;
}

.brand-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 600px) {
  .brand-badge {
    font-size: 0.85rem;
    padding: 4px 10px;
    max-width: calc(100vw - 160px);
  }
}
</style>
