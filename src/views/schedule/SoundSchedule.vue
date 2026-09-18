<template>
  <v-card>
    <v-card-title class="d-flex align-center flex-wrap py-4 ga-2">
      <v-text-field
        v-model="search"
        prepend-inner-icon="mdi-magnify"
        label="Search Schedule"
        single-line
        hide-details
        density="compact"
        class="max-width-300 mr-2"
      />

      <v-chip size="small" color="primary" variant="tonal" prepend-icon="mdi-calendar-check" class="mr-2">
        Midweek: {{ localMidweekDay }}
      </v-chip>
      
      <v-spacer />
      
      <!-- Actions -->
      <div class="d-flex align-center ga-1">
        <v-btn
          v-if="authStore.isAdmin"
          color="primary"
          variant="flat"
          prepend-icon="mdi-plus"
          @click="openAddDialog"
          class="mr-2"
        >
          Add Assignment
        </v-btn>

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

    <!-- Meeting Type Filter -->
    <div class="d-flex align-center px-4 pb-2 ga-2 flex-wrap">
      <span class="text-caption font-weight-bold text-medium-emphasis">MEETING:</span>
      <v-chip-group v-model="meetingFilter" mandatory selected-class="text-primary font-weight-bold">
        <v-chip value="all" filter size="small" variant="outlined">All Meetings</v-chip>
        <v-chip value="midweek" filter size="small" variant="outlined" color="indigo">Midweek ({{ localMidweekDay }})</v-chip>
        <v-chip value="weekend" filter size="small" variant="outlined" color="teal">Weekend (Sunday)</v-chip>
      </v-chip-group>
    </div>

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
      :items="filteredSchedule"
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
        <div class="d-flex align-center ga-2">
          <span>{{ getDayName(item.date) }}</span>
          <v-chip 
            size="x-small" 
            :color="isMidweek(item.date) ? 'indigo' : 'teal'" 
            variant="tonal"
          >
            {{ isMidweek(item.date) ? 'Midweek' : 'Weekend' }}
          </v-chip>
        </div>
      </template>
    </v-data-table>

    <!-- Edit Dialog -->
    <v-dialog v-model="editDialog" max-width="500">
      <v-card v-if="editedItem">
        <v-card-title>{{ isAddingEntry ? 'Add Assignment' : 'Edit Entry' }}</v-card-title>
        <v-card-text>
          <v-text-field 
            v-model="editedItem.date" 
            label="Date" 
            type="date" 
            variant="outlined"
            density="comfortable"
            class="mb-3"
            :hint="`Midweek: ${localMidweekDay} | Weekend: Sunday`"
            persistent-hint
          />
          <v-text-field v-model="editedItem.stage" label="Stage" variant="outlined" density="comfortable" class="mb-3" />
          <v-text-field v-model="editedItem.pc" label="PC" variant="outlined" density="comfortable" class="mb-3" />
          <v-text-field v-model="editedItem.amplifier" label="Amplifier" variant="outlined" density="comfortable" class="mb-3" />
          <v-text-field v-model="editedItem.rowingA" label="Rowing A" variant="outlined" density="comfortable" class="mb-3" />
          <v-text-field v-model="editedItem.rowingB" label="Rowing B" variant="outlined" density="comfortable" class="mb-3" />
        </v-card-text>
        <v-card-actions>
          <v-btn v-if="!isAddingEntry" color="error" @click="removeEntry">Delete</v-btn>
          <v-spacer />
          <v-btn @click="editDialog = false">Cancel</v-btn>
          <v-btn color="primary" @click="saveEdit">{{ isAddingEntry ? 'Add' : 'Save' }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/config/firebase'
import { useAuthStore } from '@/stores/auth'
import { exportToExcel } from '@/utils/excel'

const props = defineProps({
  scheduleData: Array,
  midweekDay: String
})

const authStore = useAuthStore()
const localSchedule = ref([])
const loading = ref(false)
const search = ref('')
const selected = ref([])
const editDialog = ref(false)
const isAddingEntry = ref(false)
const editedItem = ref(null)
const showColumnSelector = ref(false)
const meetingFilter = ref('all')
const localMidweekDay = ref(props.midweekDay || 'Thursday')

watch(() => props.midweekDay, (newVal) => {
  if (newVal) localMidweekDay.value = newVal
})

const loadMidweekDay = async () => {
  if (props.midweekDay) {
    localMidweekDay.value = props.midweekDay
    return
  }
  try {
    const snap = await getDoc(doc(db, 'settings', 'meetings'))
    if (snap.exists() && snap.data().midweekMeetingDay) {
      localMidweekDay.value = snap.data().midweekMeetingDay
      return
    }
    const snapCong = await getDoc(doc(db, 'settings', 'congregation'))
    if (snapCong.exists() && snapCong.data().midweekMeetingDay) {
      localMidweekDay.value = snapCong.data().midweekMeetingDay
    }
  } catch (err) {
    console.error('Error loading midweek day in SoundSchedule:', err)
  }
}

const daysList = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const isMidweek = (dateStr) => {
  if (!dateStr) return false
  const d = new Date(dateStr)
  const mIdx = daysList.indexOf(localMidweekDay.value) !== -1 ? daysList.indexOf(localMidweekDay.value) : 4
  return d.getDay() === mIdx
}

const filteredSchedule = computed(() => {
  let list = localSchedule.value
  if (meetingFilter.value === 'midweek') {
    const mIdx = daysList.indexOf(localMidweekDay.value) !== -1 ? daysList.indexOf(localMidweekDay.value) : 4
    list = list.filter(item => {
      if (!item.date) return false
      return new Date(item.date).getDay() === mIdx
    })
  } else if (meetingFilter.value === 'weekend') {
    list = list.filter(item => {
      if (!item.date) return false
      return new Date(item.date).getDay() === 0 // Sunday
    })
  }
  return list
})

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
  const data = filteredSchedule.value.map(i => ({ 
    ...i, 
    date: formatDate(i.date),
    day: getDayName(i.date) 
  }))
  exportToExcel(data, allColumns, 'Sound_Schedule')
}

const print = () => window.print()

const openAddDialog = () => {
  isAddingEntry.value = true
  const now = new Date()
  const mIdx = daysList.indexOf(localMidweekDay.value) !== -1 ? daysList.indexOf(localMidweekDay.value) : 4
  const day = now.getDay()
  const diff = (mIdx - day + 7) % 7 || 7
  const nextDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diff)

  editedItem.value = {
    id: Date.now(),
    date: nextDate.toISOString().split('T')[0],
    stage: '',
    pc: '',
    amplifier: '',
    rowingA: '',
    rowingB: '-'
  }
  editDialog.value = true
}

const editRow = (event, { item }) => {
  isAddingEntry.value = false
  editedItem.value = { ...item }
  editDialog.value = true
}

const saveEdit = () => {
  if (isAddingEntry.value) {
    localSchedule.value.push({ ...editedItem.value })
    localSchedule.value.sort((a, b) => new Date(a.date) - new Date(b.date))
    saveToLocalStorage()
  } else {
    const idx = localSchedule.value.findIndex(i => i.id === editedItem.value.id)
    if (idx !== -1) {
      localSchedule.value[idx] = { ...editedItem.value }
      saveToLocalStorage()
    }
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

onMounted(() => {
  loadFromLocalStorage()
  loadMidweekDay()
})
</script>

<style scoped>
.max-width-300 { max-width: 300px; }
@media print {
  .v-btn, .v-text-field, .v-toolbar, .v-tabs, .v-card-title, .v-chip-group { display: none !important; }
}
</style>
