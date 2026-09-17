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
      
      <!-- Actions -->
      <div class="d-flex align-center">
        <v-btn
          v-if="authStore.isAdmin && selected.length > 0"
          color="error"
          variant="tonal"
          prepend-icon="mdi-delete"
          @click="deleteSelected"
          class="mr-2"
        >
          Delete ({{ selected.length }})
        </v-btn>

        <v-btn 
          icon 
          @click="showColumnSelector = !showColumnSelector"
          class="mr-2"
          variant="text"
        >
          <v-icon>mdi-view-column</v-icon>
        </v-btn>

        <v-btn color="info" variant="tonal" @click="exportData" prepend-icon="mdi-export" class="mr-2">Export</v-btn>
        <v-btn icon @click="print" variant="text"><v-icon>mdi-printer</v-icon></v-btn>
      </div>
    </v-card-title>

    <v-card-text v-if="showColumnSelector">
      <div class="mb-2 text-subtitle-2">Toggle Column Visibility:</div>
      <v-chip-group v-model="visibleColumns" multiple column>
        <v-chip
          v-for="col in allColumns"
          :key="col.key"
          :value="col.key"
          filter
          variant="outlined"
          size="small"
        >
          {{ col.title }}
        </v-chip>
      </v-chip-group>
    </v-card-text>

    <v-data-table
      v-model="selected"
      :headers="visibleHeaders"
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

    <!-- Edit Dialog -->
    <v-dialog v-model="editDialog" max-width="500">
      <v-card v-if="editedItem">
        <v-card-title>Edit Entry</v-card-title>
        <v-card-text>
          <v-text-field v-model="editedItem.date" label="Date" type="date" readonly />
          <v-text-field v-model="editedItem.stage" label="Stage" />
          <v-text-field v-model="editedItem.pc" label="PC" />
          <v-text-field v-model="editedItem.amplifier" label="Amplifier" />
          <v-text-field v-model="editedItem.rowingA" label="Rowing A" />
          <v-text-field v-model="editedItem.rowingB" label="Rowing B" />
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
import { ref, computed, watch, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { exportToExcel } from '@/utils/excel'

const props = defineProps({
  scheduleData: Array
})

const authStore = useAuthStore()
const localSchedule = ref([])
const loading = ref(false)
const search = ref('')
const selected = ref([])
const editDialog = ref(false)
const editedItem = ref(null)
const showColumnSelector = ref(false)

const allColumns = [
  { title: 'Date', key: 'date' },
  { title: 'Day', key: 'day' },
  { title: 'Stage', key: 'stage' },
  { title: 'PC', key: 'pc' },
  { title: 'Amplifier', key: 'amplifier' },
  { title: 'Rowing A', key: 'rowingA' },
  { title: 'Rowing B', key: 'rowingB' }
]

const visibleColumns = ref(['date', 'day', 'stage', 'pc', 'amplifier', 'rowingA', 'rowingB'])

const visibleHeaders = computed(() => {
  return allColumns.filter(c => visibleColumns.value.includes(c.key))
})

const formatDate = (d) => {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

const getDayName = (d) => {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-US', { weekday: 'long' })
}

const saveToLocalStorage = () => {
  localStorage.setItem('soundScheduleData', JSON.stringify(localSchedule.value))
}

const loadFromLocalStorage = () => {
  const saved = localStorage.getItem('soundScheduleData')
  if (saved) {
    localSchedule.value = JSON.parse(saved)
  }
}

const exportData = () => {
  const data = localSchedule.value.map(i => ({ 
    ...i, 
    date: formatDate(i.date),
    day: getDayName(i.date) 
  }))
  exportToExcel(data, allColumns, 'Sound_Schedule')
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
    saveToLocalStorage()
  }
  editDialog.value = false
}

const removeEntry = () => {
  localSchedule.value = localSchedule.value.filter(i => i.id !== editedItem.value.id)
  saveToLocalStorage()
  editDialog.value = false
}

const deleteSelected = () => {
  if (confirm(`Delete ${selected.value.length} items?`)) {
    const idsToDelete = [...selected.value]
    localSchedule.value = localSchedule.value.filter(i => !idsToDelete.includes(i.id))
    selected.value = []
    saveToLocalStorage()
  }
}

watch(() => props.scheduleData, (newVal) => {
  if (newVal && newVal.length > 0) {
    localSchedule.value = [...newVal]
    saveToLocalStorage()
  }
}, { immediate: true })

onMounted(loadFromLocalStorage)
</script>

<style scoped>
.max-width-300 { max-width: 300px; }
@media print {
  .v-btn, .v-text-field, .v-toolbar, .v-tabs, .v-card-title, .v-chip-group { display: none !important; }
}
</style>
