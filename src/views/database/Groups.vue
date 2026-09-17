<template>
  <div>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-4">Field Service Groups</h1>
      </v-col>
    </v-row>
    
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex align-center flex-wrap">
            <v-spacer />
            
            <!-- Desktop Actions -->
            <div class="d-none d-md-flex align-center">
              <v-btn
                v-if="selected.length > 0 && authStore.canDelete"
                color="error"
                @click="deleteSelected"
                prepend-icon="mdi-delete"
                class="mr-2"
              >
                Delete ({{ selected.length }})
              </v-btn>
              
              <v-btn 
                v-if="authStore.isAdmin" 
                color="primary" 
                @click="openAddDialog"
                prepend-icon="mdi-plus"
              >
                Add Group
              </v-btn>
              
              <v-btn 
                icon 
                @click="printTable"
                class="ml-2"
              >
                <v-icon>mdi-printer</v-icon>
              </v-btn>
            </div>

            <!-- Mobile Actions Menu -->
            <div class="d-flex d-md-none align-center">
              <v-btn 
                v-if="selected.length > 0 && authStore.canDelete"
                icon
                color="error"
                @click="deleteSelected"
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
                  <v-list-item v-if="authStore.isAdmin" @click="openAddDialog" prepend-icon="mdi-plus">
                    <v-list-item-title>Add Group</v-list-item-title>
                  </v-list-item>
                  <v-list-item @click="printTable" prepend-icon="mdi-printer">
                    <v-list-item-title>Print Table</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
            </div>
          </v-card-title>
          
          <v-data-table
            v-model="selected"
            :headers="headers"
            :items="groups"
            :loading="loading"
            item-value="id"
            :show-select="authStore.canDelete"
            @click:row="handleRowClick"
          >
            <template v-slot:item.members="{ item }">
              {{ item.members?.length || 0 }}
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>
    
    <!-- Add/Edit Dialog -->
    <v-dialog v-model="dialog" max-width="600px">
      <v-card>
        <v-card-title>
          {{ editMode ? 'Edit Group' : 'Add Group' }}
        </v-card-title>
        
        <v-card-text>
          <v-form ref="form">
            <v-text-field
              v-model="editedItem.name"
              label="Group Name"
              :rules="[v => !!v || 'Name is required']"
            />
            
            <v-select
              v-model="editedItem.overseer"
              :items="publisherNames"
              label="Overseer"
              clearable
            />
            
            <v-select
              v-model="editedItem.assistant"
              :items="publisherNames"
              label="Assistant"
              clearable
            />
            
            <v-select
              v-model="editedItem.members"
              :items="publishersSortedByFamily"
              item-title="displayLabel"
              item-value="id"
              label="Members"
              multiple
              chips
            />
          </v-form>
        </v-card-text>
        
        <v-card-actions>
          <v-btn 
            v-if="editMode && authStore.canDelete" 
            color="error" 
            @click="deleteGroup(editedItem)"
          >
            Delete
          </v-btn>
          <v-spacer />
          <v-btn @click="closeDialog">Cancel</v-btn>
          <v-btn color="primary" @click="saveGroup">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  serverTimestamp 
} from 'firebase/firestore'
import { db } from '@/config/firebase'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

const groups = ref([])
const publishers = ref([])
const selected = ref([])
const loading = ref(false)
const dialog = ref(false)
const editMode = ref(false)
const form = ref(null)

const headers = [
  { title: 'Group Name', key: 'name', value: 'name' },
  { title: 'Overseer', key: 'overseer', value: 'overseer' },
  { title: 'Assistant', key: 'assistant', value: 'assistant' },
  { title: 'Members', key: 'members', value: 'members' }
]

// Publisher names for Overseer/Assistant single selectors
const publisherNames = computed(() => {
  return publishers.value.map(p => p.name).sort((a, b) => a.localeCompare(b))
})

// Publishers sorted by family for the Members multi-select
const publishersSortedByFamily = computed(() => {
  return [...publishers.value]
    .sort((a, b) => {
      const familyA = (a.family || '').toLowerCase()
      const familyB = (b.family || '').toLowerCase()
      if (familyA !== familyB) return familyA.localeCompare(familyB)
      return (a.name || '').localeCompare(b.name || '')
    })
    .map(p => ({
      ...p,
      displayLabel: p.family ? `${p.name} (${p.family})` : p.name
    }))
})

const defaultItem = {
  name: '',
  overseer: '',
  assistant: '',
  members: []
}

const editedItem = ref({ ...defaultItem })

const loadGroups = async () => {
  loading.value = true
  try {
    const snapshot = await getDocs(collection(db, 'groups'))
    groups.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  } catch (error) {
    console.error('Error loading groups:', error)
  } finally {
    loading.value = false
  }
}

const loadPublishers = async () => {
  try {
    const snapshot = await getDocs(collection(db, 'publishers'))
    publishers.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  } catch (error) {
    console.error('Error loading publishers:', error)
  }
}

const openAddDialog = () => {
  editMode.value = false
  editedItem.value = { ...defaultItem }
  dialog.value = true
}

const handleRowClick = (event, { item }) => {
  if (authStore.isAdmin) {
    editGroup(item)
  }
}

const editGroup = (item) => {
  editMode.value = true
  editedItem.value = { ...item }
  dialog.value = true
}

const closeDialog = () => {
  dialog.value = false
  editedItem.value = { ...defaultItem }
}

const saveGroup = async () => {
  try {
    const groupId = editMode.value ? editedItem.value.id : null
    const newMembers = editedItem.value.members || []
    
    if (editMode.value) {
      const { id, ...data } = editedItem.value
      await updateDoc(doc(db, 'groups', id), {
        ...data,
        updatedAt: serverTimestamp()
      })
      
      // Sync publisher groupIds
      // 1. Find publishers removed from this group
      const oldMembers = groups.value.find(g => g.id === id)?.members || []
      const removedMembers = oldMembers.filter(m => !newMembers.includes(m))
      const addedMembers = newMembers.filter(m => !oldMembers.includes(m))
      
      // Remove groupId from removed publishers
      for (const pubId of removedMembers) {
        try {
          await updateDoc(doc(db, 'publishers', pubId), { groupId: null })
        } catch (e) { console.warn('Could not update publisher:', pubId) }
      }
      
      // Set groupId for added publishers
      for (const pubId of addedMembers) {
        try {
          await updateDoc(doc(db, 'publishers', pubId), { groupId: id })
        } catch (e) { console.warn('Could not update publisher:', pubId) }
      }
    } else {
      const docRef = await addDoc(collection(db, 'groups'), {
        ...editedItem.value,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      
      // Set groupId for all members of new group
      for (const pubId of newMembers) {
        try {
          await updateDoc(doc(db, 'publishers', pubId), { groupId: docRef.id })
        } catch (e) { console.warn('Could not update publisher:', pubId) }
      }
    }
    
    await loadGroups()
    await loadPublishers()
    closeDialog()
  } catch (error) {
    console.error('Error saving group:', error)
  }
}

const deleteGroup = async (item) => {
  if (!authStore.canDelete) return
  if (confirm('Are you sure you want to delete this group?')) {
    try {
      await deleteDoc(doc(db, 'groups', item.id))
      await loadGroups()
      closeDialog()
    } catch (error) {
      console.error('Error deleting group:', error)
    }
  }
}

const deleteSelected = async () => {
  if (!authStore.canDelete) return
  if (confirm(`Delete ${selected.value.length} selected groups?`)) {
    try {
      loading.value = true
      const promises = selected.value.map(id => deleteDoc(doc(db, 'groups', id)))
      await Promise.all(promises)
      selected.value = []
      await loadGroups()
    } catch (error) {
      console.error('Error deleting groups:', error)
      alert('Failed to delete some groups')
    } finally {
      loading.value = false
    }
  }
}

const printTable = () => {
  window.print()
}

onMounted(() => {
  loadGroups()
  loadPublishers()
})
</script>

<style scoped>
@media print {
  .v-btn {
    display: none !important;
  }
}
</style>
