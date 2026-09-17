<template>
  <div>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-4">My Profile</h1>
      </v-col>
    </v-row>
    
    <v-row>
      <v-col cols="12" md="6">
        <v-card>
          <v-card-text>
            <div class="text-center mb-6">
              <v-avatar size="120" class="mb-4">
                <v-img 
                  v-if="authStore.user?.photoURL" 
                  :src="authStore.user.photoURL"
                  alt="User avatar"
                />
                <v-icon v-else size="120">mdi-account-circle</v-icon>
              </v-avatar>
            </div>
            
            <v-form @submit.prevent="saveProfile">
              <v-text-field
                v-model="displayName"
                label="Name"
                prepend-icon="mdi-account"
                :disabled="saving"
              />
              
              <v-text-field
                :model-value="authStore.user?.email"
                label="Email"
                prepend-icon="mdi-email"
                readonly
                disabled
              />
              
              <v-text-field
                :model-value="authStore.userRole"
                label="Role"
                prepend-icon="mdi-shield-account"
                readonly
                disabled
              />
              

              <v-alert 
                v-if="message" 
                :type="messageType"
                variant="tonal"
                class="mb-4 mt-4"
              >
                {{ message }}
              </v-alert>
              
              <v-btn 
                type="submit" 
                color="primary" 
                block
                :loading="saving"
                class="mt-4"
              >
                Save Changes
              </v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { doc, updateDoc, getDoc } from 'firebase/firestore'
import { updateProfile } from 'firebase/auth'
import { useAuthStore } from '@/stores/auth'
import { auth, db } from '@/config/firebase'

const authStore = useAuthStore()
const displayName = ref('')

const saving = ref(false)
const message = ref('')
const messageType = ref('success')


onMounted(async () => {
  displayName.value = authStore.user?.displayName || ''
  
})

const saveProfile = async () => {
  try {
    saving.value = true
    message.value = ''
    
    // Update Firebase Auth profile
    await updateProfile(auth.currentUser, {
      displayName: displayName.value
    })
    
    // Currently no other specific profile fields to update in Firestore
    // as role and spiritualRole are managed by Admins
    
    // Update local store
    authStore.user.displayName = displayName.value
    
    message.value = 'Profile and meeting times updated successfully'
    messageType.value = 'success'
  } catch (error) {
    console.error('Error updating profile:', error)
    message.value = 'Failed to update profile'
    messageType.value = 'error'
  } finally {
    saving.value = false
  }
}
</script>
