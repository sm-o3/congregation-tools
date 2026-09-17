<template>
  <div class="manage-users">
    <v-row class="mb-4" align="center">
      <v-col cols="12" sm="8">
        <h1 class="text-h4">Manage Users</h1>
        <p class="text-subtitle-1 text-grey-darken-1 mt-2">
          Add or remove users and assign their access roles.
        </p>
      </v-col>
      <v-col cols="12" sm="4" class="text-sm-right d-flex justify-sm-end align-center">
        <!-- Desktop Actions -->
        <div class="d-none d-sm-flex align-center justify-end w-100">
          <v-btn
            v-if="selected.length > 0"
            color="error"
            prepend-icon="mdi-delete"
            @click="deleteSelectedUsers"
            class="mr-2"
          >
            Delete ({{ selected.length }})
          </v-btn>
          <v-btn
            color="primary"
            prepend-icon="mdi-account-plus"
            @click="openAddDialog"
          >
            Add User
          </v-btn>
        </div>

        <!-- Mobile Actions Menu -->
        <div class="d-flex d-sm-none justify-end w-100 mt-2">
          <v-btn
            v-if="selected.length > 0"
            icon
            color="error"
            @click="deleteSelectedUsers"
            class="mr-1"
            size="small"
          >
            <v-icon>mdi-delete</v-icon>
          </v-btn>
          
          <v-menu offset-y>
            <template v-slot:activator="{ props }">
              <v-btn icon v-bind="props" size="small">
                <v-icon>mdi-dots-vertical</v-icon>
              </v-btn>
            </template>
            <v-list>
              <v-list-item @click="openAddDialog" prepend-icon="mdi-account-plus">
                <v-list-item-title>Add User</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </div>
      </v-col>
    </v-row>

    <!-- Error/Success Alerts -->
    <v-alert
      v-if="error"
      type="error"
      variant="tonal"
      class="mb-4"
      closable
      @click:close="error = null"
    >
      {{ error }}
    </v-alert>

    <v-alert
      v-if="successMsg"
      type="success"
      variant="tonal"
      class="mb-4"
      closable
      @click:close="successMsg = null"
    >
      {{ successMsg }}
    </v-alert>

    <!-- Users Data Table -->
    <v-card>
      <v-card-text class="pa-0">
        <v-data-table
          v-model="selected"
          :headers="headers"
          :items="users"
          :loading="loading"
          item-value="id"
          show-select
          hover
          @click:row="handleRowClick"
        >
          <!-- Display Name -->
          <template v-slot:item.displayName="{ item }">
            <div class="d-flex align-center gap-3">
              <v-avatar size="32" color="primary" variant="tonal">
                <span>{{ item.displayName?.charAt(0)?.toUpperCase() || '?' }}</span>
              </v-avatar>
              <div class="font-weight-medium">{{ item.displayName }}</div>
            </div>
          </template>

          <!-- Group -->
          <template v-slot:item.groupName="{ item }">
            <span v-if="item.role === 'editor'" class="text-grey-darken-2">
              {{ item.groupName || 'All Groups / None' }}
            </span>
            <span v-else class="text-grey">N/A</span>
          </template>

          <!-- Email -->
          <template v-slot:item.email="{ item }">
            <span class="text-grey-darken-2">{{ item.email }}</span>
          </template>

          <!-- App Role Chip -->
          <template v-slot:item.role="{ item }">
            <v-chip
              :color="getRoleColor(item.role)"
              size="small"
              class="font-weight-medium"
            >
              {{ item.role?.toUpperCase() || 'UNKNOWN' }}
            </v-chip>
          </template>

          <!-- Spiritual Role Chip -->
          <template v-slot:item.spiritualRole="{ item }">
            <v-chip
              :color="getSpiritualRoleColor(item.spiritualRole)"
              size="small"
              variant="outlined"
            >
              {{ item.spiritualRole || 'Publisher' }}
            </v-chip>
          </template>

          <!-- Status -->
          <template v-slot:item.status="{ item }">
            <v-chip
              :color="item.uid ? 'success' : 'warning'"
              size="small"
              variant="flat"
            >
              {{ item.uid ? 'Active' : 'Pending Login' }}
            </v-chip>
          </template>


        </v-data-table>
      </v-card-text>
    </v-card>

    <!-- Add/Edit User Dialog -->
    <v-dialog v-model="showUserDialog" max-width="500px">
      <v-card>
        <v-card-title class="bg-primary text-white pa-4">
          {{ isEditing ? 'Edit User' : 'Add New User' }}
        </v-card-title>
        
        <v-card-text class="pa-4">
          <v-form ref="form" v-model="isFormValid" @submit.prevent="saveUser">
            <v-text-field
              v-model="userForm.displayName"
              label="Full Name"
              variant="outlined"
              :rules="[v => !!v || 'Name is required']"
              class="mb-4"
            />
            
            <v-text-field
              v-model="userForm.email"
              label="Email Address (Google Account)"
              variant="outlined"
              type="email"
              :rules="[
                v => !!v || 'Email is required',
                v => /.+@.+\..+/.test(v) || 'Must be a valid email'
              ]"
              :disabled="isEditing"
              class="mb-4"
              persistent-hint
              :hint="isEditing ? 'Email cannot be changed' : 'Must be the Google account they use to sign in'"
            />
            
            <v-select
              v-model="userForm.role"
              :items="appRoles"
              label="App Access Level"
              variant="outlined"
              :rules="[v => !!v || 'App role is required']"
              class="mb-4"
              persistent-hint
              hint="Admin: Full access. Editor: Typical access. Viewer: Read-only."
            />
            
            <v-select
              v-model="userForm.spiritualRole"
              :items="spiritualRoles"
              label="Spiritual Role"
              variant="outlined"
              :rules="[v => !!v || 'Spiritual role is required']"
              persistent-hint
              hint="Affects visibility of specific menu items like Database and Home."
              class="mb-4"
            />
            
            <v-select
              v-if="userForm.role === 'editor'"
              v-model="userForm.groupId"
              :items="groups"
              item-title="name"
              item-value="id"
              label="Assigned Group"
              variant="outlined"
              clearable
              persistent-hint
              hint="Restricts Editors to only see reports for their assigned group."
            />
          </v-form>
        </v-card-text>
        
        <v-card-actions class="pa-4 pt-0">
          <v-spacer />
          <v-btn
            variant="text"
            color="grey-darken-1"
            @click="showUserDialog = false"
            :disabled="saving"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            @click="saveUser"
            :loading="saving"
            :disabled="!isFormValid"
          >
            {{ isEditing ? 'Update User' : 'Add User' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="showDeleteDialog" max-width="400px">
      <v-card>
        <v-card-title class="bg-error text-white pa-4">
          Revoke Access?
        </v-card-title>
        <v-card-text class="pa-4">
          Are you sure you want to remove access for <strong>{{ itemToDelete?.displayName }}</strong> ({{ itemToDelete?.email }})?
          <br><br>
          They will no longer be able to log into the application.
        </v-card-text>
        <v-card-actions class="pa-4 pt-0">
          <v-spacer />
          <v-btn
            variant="text"
            color="grey-darken-1"
            @click="showDeleteDialog = false"
            :disabled="deleting"
          >
            Cancel
          </v-btn>
          <v-btn
            color="error"
            variant="flat"
            @click="confirmDelete"
            :loading="deleting"
          >
            Remove Access
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { collection, getDocs, doc, setDoc, deleteDoc, serverTimestamp, query, where } from 'firebase/firestore'
import { db } from '@/config/firebase'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const currentUserEmail = computed(() => authStore.user?.email)

// State
const users = ref([])
const groups = ref([])
const selected = ref([])
const loading = ref(true)
const error = ref(null)
const successMsg = ref(null)

// Dialogs
const showUserDialog = ref(false)
const showDeleteDialog = ref(false)
const isEditing = ref(false)
const saving = ref(false)
const deleting = ref(false)
const itemToDelete = ref(null)

// Form
const form = ref(null)
const isFormValid = ref(false)
const userForm = ref({
  id: null,
  displayName: '',
  email: '',
  role: 'editor',
  spiritualRole: 'Publisher',
  groupId: null
})

// Options
const appRoles = [
  { title: 'Admin (Full Access)', value: 'admin' },
  { title: 'Editor (Standard)', value: 'editor' },
  { title: 'Viewer (Read Only)', value: 'viewer' }
]

const spiritualRoles = [
  'Elder',
  'Ministerial Servant',
  'Publisher'
]

const headers = [
  { title: 'User', key: 'displayName', align: 'start' },
  { title: 'Email', key: 'email', align: 'start' },
  { title: 'App Access', key: 'role', align: 'start' },
  { title: 'Group', key: 'groupName', align: 'start' },
  { title: 'Spiritual Role', key: 'spiritualRole', align: 'start' },
  { title: 'Status', key: 'status', align: 'start' }
]

// Data loading
const loadUsers = async () => {
  loading.value = true
  error.value = null
  try {
    const groupsSnap = await getDocs(collection(db, 'groups'))
    groups.value = groupsSnap.docs.map(doc => ({ id: doc.id, name: doc.data().name }))

    const snapshot = await getDocs(collection(db, 'users'))
    users.value = snapshot.docs.map(doc => {
      const data = doc.data()
      const groupName = groups.value.find(g => g.id === data.groupId)?.name || null
      return {
        id: doc.id,
        groupName,
        ...data
      }
    })
  } catch (err) {
    console.error('Error loading users:', err)
    error.value = 'Failed to load users. Please check your connection and permissions.'
  } finally {
    loading.value = false
  }
}

// Dialog handlers
const openAddDialog = () => {
  isEditing.value = false
  userForm.value = {
    id: null,
    displayName: '',
    email: '',
    role: 'editor',
    spiritualRole: 'Publisher',
    groupId: null
  }
  if (form.value) form.value.resetValidation()
  showUserDialog.value = true
}

const openEditDialog = (item) => {
  isEditing.value = true
  userForm.value = {
    id: item.id,
    displayName: item.displayName,
    email: item.email,
    role: item.role || 'editor',
    spiritualRole: item.spiritualRole || 'Publisher',
    groupId: item.groupId || null
  }
  if (form.value) form.value.resetValidation()
  showUserDialog.value = true
}

const openDeleteDialog = (item) => {
  itemToDelete.value = item
  showDeleteDialog.value = true
}

// Actions
const saveUser = async () => {
  const { valid } = await form.value.validate()
  if (!valid) return
  
  saving.value = true
  error.value = null
  
  try {
    const emailLower = userForm.value.email.toLowerCase().trim()
    
    if (!isEditing.value) {
      // Check if email already exists
      const q = query(collection(db, 'users'), where('email', '==', emailLower))
      const snapshot = await getDocs(q)
      
      if (!snapshot.empty) {
        throw new Error('A user with this email address already exists.')
      }
      
      // Since we don't have their UID yet, use their email as the temporary doc ID
      // The auth store will update the actual UID when they log in
      const docId = `temp_${emailLower.replace(/[^a-zA-Z0-9]/g, '_')}`
      
      await setDoc(doc(db, 'users', docId), {
        email: emailLower,
        displayName: userForm.value.displayName,
        role: userForm.value.role,
        spiritualRole: userForm.value.spiritualRole,
        groupId: userForm.value.role === 'editor' ? userForm.value.groupId || null : null,
        uid: null, // Will be populated on first login
        createdAt: serverTimestamp()
      })
      
      successMsg.value = `User ${userForm.value.displayName} added successfully.`
    } else {
      // Editing existing user
      await setDoc(doc(db, 'users', userForm.value.id), {
        displayName: userForm.value.displayName,
        email: emailLower,
        role: userForm.value.role,
        spiritualRole: userForm.value.spiritualRole,
        groupId: userForm.value.role === 'editor' ? userForm.value.groupId || null : null
        // Preserving UID and createdAt happens naturally with setDoc + merge if we used merge: true,
        // but since we fetched everything, we should merge.
      }, { merge: true })
      
      successMsg.value = `User details updated successfully.`
    }
    
    showUserDialog.value = false
    await loadUsers()
  } catch (err) {
    console.error('Error saving user:', err)
    error.value = err.message || 'Failed to save user.'
  } finally {
    saving.value = false
  }
}

const confirmDelete = async () => {
  if (!itemToDelete.value) return
  
  deleting.value = true
  error.value = null
  
  try {
    await deleteDoc(doc(db, 'users', itemToDelete.value.id))
    successMsg.value = `Access revoked for ${itemToDelete.value.displayName}.`
    showDeleteDialog.value = false
    await loadUsers()
  } catch (err) {
    console.error('Error deleting user:', err)
    error.value = 'Failed to remove user access.'
  } finally {
    deleting.value = false
  }
}

// Helpers
const getRoleColor = (role) => {
  switch (role) {
    case 'admin': return 'deep-purple'
    case 'editor': return 'info'
    default: return 'grey'
  }
}

const getSpiritualRoleColor = (role) => {
  switch (role) {
    case 'Elder': return 'purple-darken-1'
    case 'Ministerial Servant': return 'blue-darken-1'
    case 'Publisher': return 'grey-darken-1'
    default: return 'grey'
  }
}

const handleRowClick = (event, { item }) => {
  openEditDialog(item)
}

const deleteSelectedUsers = async () => {
  if (!confirm(`Delete ${selected.value.length} selected users?`)) return
  try {
    loading.value = true
    const promises = selected.value.map(id => deleteDoc(doc(db, 'users', id)))
    await Promise.all(promises)
    selected.value = []
    successMsg.value = 'Selected users deleted.'
    await loadUsers()
  } catch (err) {
    console.error('Error deleting users:', err)
    error.value = 'Failed to delete some users.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadUsers()
})
</script>
