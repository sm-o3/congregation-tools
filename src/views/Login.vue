<template>
  <div class="login-wrapper fill-height d-flex align-center justify-center py-10 px-4">
    <v-card class="login-card elevation-0" max-width="450" width="100%">
      
      <!-- Top Decorative Bar -->
      <div class="card-top-bar"></div>
      
      <v-card-text class="pa-sm-10 pa-6 text-center">
        
        <!-- Logo/Icon -->
        <div class="logo-wrapper mx-auto mb-6 elevation-3">
          <v-icon size="40" color="white">mdi-account-group</v-icon>
        </div>
        
        <h1 class="text-h4 font-weight-bold mb-2 login-title">Congregation Tools</h1>
        <p class="text-body-1 text-medium-emphasis mb-8">
          Welcome! Please sign in with your authorized Google account to continue.
        </p>
        
        <v-alert 
          v-if="authStore.error" 
          type="error" 
          variant="tonal"
          class="mb-6 rounded-lg text-left"
          closable
        >
          {{ authStore.error }}
        </v-alert>
        
        <v-btn 
          block 
          size="x-large" 
          color="primary"
          variant="flat"
          class="login-btn font-weight-bold text-subtitle-1"
          :loading="authStore.loading"
          @click="handleSignIn"
          prepend-icon="mdi-google"
          elevation="4"
        >
          Continue with Google
        </v-btn>
        
        <div class="mt-8 text-caption text-medium-emphasis">
          Secure access restricted to authorized personnel.
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

const handleSignIn = async () => {
  const success = await authStore.signInWithGoogle()
  if (success) {
    router.push('/')
  }
}
</script>

<style scoped>
.login-wrapper {
  min-height: 100vh;
  /* Rich gradient background */
  background: linear-gradient(135deg, #1A1333 0%, #0F0D1A 40%, #2A1B54 100%);
  position: relative;
  overflow: hidden;
}

/* Decorative background elements */
.login-wrapper::before {
  content: '';
  position: absolute;
  top: -10%;
  left: -10%;
  width: 50%;
  height: 50%;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.4) 0%, rgba(0, 0, 0, 0) 70%);
  filter: blur(60px);
  z-index: 0;
}

.login-wrapper::after {
  content: '';
  position: absolute;
  bottom: -10%;
  right: -10%;
  width: 50%;
  height: 50%;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, rgba(0, 0, 0, 0) 70%);
  filter: blur(60px);
  z-index: 0;
}

.login-card {
  position: relative;
  z-index: 1;
  border-radius: 24px !important;
  /* Glass effect handled by global style.css but reinforced here for the standalone page */
  background: rgba(30, 27, 46, 0.6) !important;
  backdrop-filter: blur(24px) saturate(1.8);
  -webkit-backdrop-filter: blur(24px) saturate(1.8);
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.6) !important;
  overflow: hidden;
}

.card-top-bar {
  height: 6px;
  width: 100%;
  background: linear-gradient(90deg, #6366F1, #8B5CF6, #F59E0B);
}

.logo-wrapper {
  width: 80px;
  height: 80px;
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
  transform: rotate(-5deg);
  transition: transform 0.3s ease;
}

.login-card:hover .logo-wrapper {
  transform: rotate(0deg) scale(1.05);
}

.login-title {
  background: linear-gradient(to right, #E2E8F0, #A78BFA);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.login-btn {
  border-radius: 14px !important;
  letter-spacing: 0.5px !important;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(99, 102, 241, 0.4) !important;
}

@media (max-width: 600px) {
  .login-card {
    border-radius: 20px !important;
  }
}
</style>
