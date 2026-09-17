<template>
  <v-card>
    <v-card-title class="d-flex align-center flex-wrap py-4">
      <v-text-field
        v-model="search"
        prepend-inner-icon="mdi-magnify"
        label="Search Schedule"
        single-line
        hide-details
        density="compact"
        class="max-width-300 mr-4"
      />
      
      <v-spacer />
      
      <v-btn v-if="authStore.isAdmin && selected.length > 0" color="error" variant="tonal" prepend-icon="mdi-delete" @click="deleteSelected" class="mr-2">
        Delete ({{ selected.length }})
      </v-btn>
      
      <v-btn color="success" variant="tonal" prepend-icon="mdi-export" @click="exportData" class="mr-2">Export</v-btn>
      
      <v-btn icon @click="print">
        <v-icon>mdi-printer</v-icon>
      </v-btn>
    </v-card-title>



    <v-data-table
      v-model="selected"
      :headers="headers"
      :items="localSchedule"
      :search="search"
      :loading="loading"
      item-value="id"
      :show-select="authStore.isAdmin"
      hover
      @click:row="authStore.isAdmin ? editRow : null"
    >
      <template v-slot:item.date="{ item }">
        {{ formatDate(item.date) }}
      </template>
      <template v-slot:item.day="{ item }">
        {{ getDayName(item.date) }}
      </template>
    </v-data-table>

    <!-- Load Dialog -->
    <v-dialog v-model="showLoadDialog" max-width="600">
      <v-card>
        <v-card-title>Load Saved Cleaning Schedule</v-card-title>
        <v-list v-if="savedSchedules.length > 0">
          <v-list-item v-for="saved in savedSchedules" :key="saved.id" @click="loadSelected(saved)" class="mb-2" border>
            <v-list-item-title>{{ formatDate(saved.startDate) }} - {{ formatDate(saved.endDate) }}</v-list-item-title>
            <v-list-item-subtitle>{{ saved.schedule.length }} entries | Generated {{ formatTimestamp(saved.createdAt) }}</v-list-item-subtitle>
          </v-list-item>
        </v-list>
        <v-card-text v-else class="text-center pa-8 text-grey">No saved schedules found.</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="showLoadDialog = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Edit Dialog -->
    <v-dialog v-model="editDialog" max-width="500">
      <v-card v-if="editedItem">
        <v-card-title>Edit Entry</v-card-title>
        <v-card-text>
          <v-text-field v-model="editedItem.group" label="Group" />
          <v-text-field v-if="showRestrooms" v-model="editedItem.gentsRestroom" label="Gents Restroom" />
          <v-text-field v-if="showRestrooms" v-model="editedItem.ladiesRestroom" label="Ladies Restroom" />
        </v-card-text>
        <v-card-actions>
          <v-btn color="error" @click="removeEntry">Delete</v-btn>
          <v-spacer />
          <v-btn @click="editDialog = false">Cancel</v-btn>
          <v-btn color="primary" @click="saveEdit">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup>
import { ref, watch, onMounted, computed } from 'vue'
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore'
import { db } from '@/config/firebase'
import { useAuthStore } from '@/stores/auth'
import { exportToExcel } from '@/utils/excel'

const props = defineProps({
  scheduleData: Array
})

const authStore = useAuthStore()
const localSchedule = ref([])
const loading = ref(false)
const saving = ref(false)
const search = ref('')
const selected = ref([])
const showLoadDialog = ref(false)
const savedSchedules = ref([])
const editDialog = ref(false)
const editedItem = ref(null)

const showRestrooms = computed(() => {
  return localSchedule.value.some(i => (i.gentsRestroom && i.gentsRestroom.trim()) || (i.ladiesRestroom && i.ladiesRestroom.trim()))
})

const headers = computed(() => {
  const base = [
    { title: 'Date', key: 'date' },
    { title: 'Day', key: 'day' },
    { title: 'Group', key: 'group' }
  ]
  if (showRestrooms.value) {
    base.push(
      { title: 'Gents Restroom', key: 'gentsRestroom' },
      { title: 'Ladies Restroom', key: 'ladiesRestroom' }
    )
  }
  return base
})

const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
const getDayName = (d) => new Date(d).toLocaleDateString('en-US', { weekday: 'long' })
const formatTimestamp = (ts) => ts?.toDate ? ts.toDate().toLocaleString() : '-'

const loadSaved = async () => {
  loading.value = true
  try {
    const q = query(collection(db, 'schedules'), where('type', '==', 'cleaning'), orderBy('createdAt', 'desc'), limit(10))
    const snap = await getDocs(q)
    savedSchedules.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    if (savedSchedules.value.length > 0 && localSchedule.value.length === 0) {
      loadSelected(savedSchedules.value[0])
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const loadSelected = (saved) => {
  localSchedule.value = [...saved.schedule]
  showLoadDialog.value = false
}

const exportData = () => {
  const data = localSchedule.value.map(i => ({ ...i, day: getDayName(i.date) }))
  exportToExcel(data, headers.value, 'Cleaning_Schedule')
}

const print = () => window.print()

const editRow = (event, { item }) => {
  editedItem.value = { ...item }
  editDialog.value = true
}

const saveEdit = () => {
  const idx = localSchedule.value.findIndex(i => i.id === editedItem.value.id)
  if (idx !== -1) {
    localSchedule.value[idx] = { ...editedItem.value }
  }
  editDialog.value = false
}

const removeEntry = () => {
  localSchedule.value = localSchedule.value.filter(i => i.id !== editedItem.value.id)
  editDialog.value = false
}

const deleteSelected = () => {
  if (confirm(`Delete ${selected.value.length} items?`)) {
    // In Vuetify 3 v-data-table, v-model="selected" returns item-value (ids)
    const idsToDelete = [...selected.value]
    localSchedule.value = localSchedule.value.filter(i => !idsToDelete.includes(i.id))
    selected.value = []
  }
}

watch(() => props.scheduleData, (newVal) => {
  if (newVal && newVal.length > 0) {
    localSchedule.value = [...newVal]
  }
}, { immediate: true })

onMounted(loadSaved)
</script>

<style scoped>
.max-width-300 { max-width: 300px; }
@media print {
  .v-btn, .v-text-field, .v-toolbar, .v-tabs { display: none !important; }
}
</style>
