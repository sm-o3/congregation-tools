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
      
      <!-- Desktop Actions -->
      <div class="d-none d-md-flex align-center">
        <v-btn 
          v-if="selected.length > 0 && authStore.isAdmin"
          color="error"
          variant="tonal"
          @click="deleteSelected"
          prepend-icon="mdi-delete"
          class="mr-2"
        >
          Delete ({{ selected.length }})
        </v-btn>

        <v-btn color="info" variant="tonal" prepend-icon="mdi-calendar-clock" @click="loadSavedSchedules" class="mr-2" :loading="loading">Load Saved</v-btn>
        
        <input type="file" ref="fileInput" accept=".xlsx, .xls" style="display: none" @change="handleFileUpload" />
        <v-btn v-if="authStore.isAdmin" color="success" variant="tonal" @click="triggerFileInput" prepend-icon="mdi-import" class="mr-2" :loading="importing">Import</v-btn>
        <v-btn color="info" variant="tonal" @click="exportData" prepend-icon="mdi-export" class="mr-2">Export</v-btn>
        <v-btn icon @click="printTable"><v-icon>mdi-printer</v-icon></v-btn>
      </div>

      <!-- Mobile Actions -->
      <div class="d-flex d-md-none align-center">
        <v-btn v-if="selected.length > 0 && authStore.isAdmin" icon color="error" @click="deleteSelected" class="mr-1" size="small"><v-icon>mdi-delete</v-icon></v-btn>
        <v-menu offset-y>
          <template v-slot:activator="{ props }"><v-btn icon v-bind="props" size="small"><v-icon>mdi-dots-vertical</v-icon></v-btn></template>
          <v-list>
            <v-list-item prepend-icon="mdi-calendar-clock" @click="loadSavedSchedules" title="Load Saved" />
            <v-list-item v-if="authStore.isAdmin" prepend-icon="mdi-import" @click="triggerFileInput" title="Import" />
            <v-list-item prepend-icon="mdi-export" @click="exportData" title="Export" />
            <v-list-item prepend-icon="mdi-printer" @click="printTable" title="Print" />
          </v-list>
        </v-menu>
      </div>
    </v-card-title>
    
    <v-data-table
      v-model="selected"
      :headers="headers"
      :items="talks"
      :loading="loading"
      :search="search"
      item-value="id"
      :show-select="authStore.isAdmin"
      @click:row="handleRowClick"
      :row-props="getRowProps"
      hover
    >
      <template v-slot:item.date="{ item }">
        {{ formatDate(item.date) }}
      </template>
    </v-data-table>

    <!-- Load Saved Dialog -->
    <v-dialog v-model="loadDialog" max-width="800px">
      <v-card>
        <v-card-title>Load Saved Public Talk Schedule</v-card-title>
        <v-card-text>
          <v-list v-if="savedSchedules.length > 0">
            <v-list-item
              v-for="saved in savedSchedules"
              :key="saved.id"
              @click="loadSelectedBatch(saved)"
              class="mb-2"
              border
            >
              <v-list-item-title class="font-weight-bold">
                {{ formatDate(saved.startDate) }} - {{ formatDate(saved.endDate) }}
              </v-list-item-title>
              <v-list-item-subtitle>
                {{ saved.schedule.length }} talk(s) | Generated {{ formatTimestamp(saved.createdAt) }}
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>
          <div v-else class="text-center pa-8 text-grey">No saved schedules found.</div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="loadDialog = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Edit Dialog -->
    <v-dialog v-model="dialog" max-width="600px">
      <v-card>
        <v-card-title>{{ editMode ? 'Edit Public Talk' : 'Add Public Talk' }}</v-card-title>
        <v-card-text>
          <v-form ref="form">
            <v-text-field v-model="editedItem.date" label="Date" type="date" :rules="[v => !!v || 'Required']" />
            <v-text-field v-model="editedItem.talkNumber" label="Talk Number" type="number" />
            <v-text-field v-model="editedItem.talkTitle" label="Talk Title" :rules="[v => !!v || 'Required']" />
            <v-text-field v-model="editedItem.speaker" label="Speaker" :rules="[v => !!v || 'Required']" />
            <v-text-field v-model="editedItem.chairman" label="Chairman" :rules="[v => !!v || 'Required']" />
            <v-text-field v-model="editedItem.watchtowerReading" label="WT Reader" :rules="[v => !!v || 'Required']" />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-btn v-if="editMode && authStore.isAdmin" color="error" @click="deleteTalk(editedItem)">Delete</v-btn>
          <v-spacer />
          <v-btn @click="closeDialog">Cancel</v-btn>
          <v-btn color="primary" @click="saveTalk">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp 
} from 'firebase/firestore'
import { db } from '@/config/firebase'
import { useAuthStore } from '@/stores/auth'
import { exportToExcel, importFromExcel, parseExcelDate } from '@/utils/excel'

const props = defineProps({
  scheduleData: Array
})

const authStore = useAuthStore()

const talks = ref([])
const selected = ref([])
const loading = ref(false)
const importing = ref(false)
const dialog = ref(false)
const editMode = ref(false)
const form = ref(null)
const fileInput = ref(null)
const search = ref('')

const loadDialog = ref(false)
const savedSchedules = ref([])

const headers = [
  { title: 'Date', key: 'date' },
  { title: 'No.', key: 'talkNumber' },
  { title: 'Title', key: 'talkTitle' },
  { title: 'Speaker', key: 'speaker' },
  { title: 'Chairman', key: 'chairman' },
  { title: 'WT Reader', key: 'watchtowerReading' }
]

const defaultItem = {
  date: '',
  talkNumber: '',
  talkTitle: '',
  speaker: '',
  chairman: '',
  watchtowerReading: ''
}

const editedItem = ref({ ...defaultItem })

const getRowProps = (row) => {
  const specials = ['நினைவுநாள்', 'மண்டல மாநாடு', 'வட்டாரக் கண்காணி சந்திப்பு']
  if (specials.some(s => row.item.talkTitle?.includes(s))) return { class: 'bg-indigo-lighten-5' }
  return {}
}

const formatDate = (t) => {
  if (!t) return ''
  const d = t.toDate ? t.toDate() : new Date(t)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

const toInputDateFormat = (d) => {
  if (!d) return ''
  const dateObj = d.toDate ? d.toDate() : (d instanceof Date ? d : new Date(d))
  if (isNaN(dateObj.getTime())) return ''
  const y = dateObj.getFullYear()
  const m = String(dateObj.getMonth() + 1).padStart(2, '0')
  const day = String(dateObj.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const formatTimestamp = (ts) => ts?.toDate ? ts.toDate().toLocaleString() : '-'

const loadTalks = async () => {
  loading.value = true
  try {
    const snap = await getDocs(collection(db, 'publicTalks'))
    talks.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => {
        const dA = a.date?.toDate ? a.date.toDate() : new Date(a.date)
        const dB = b.date?.toDate ? b.date.toDate() : new Date(b.date)
        return dB - dA
      })
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const loadSavedSchedules = async () => {
  loading.value = true
  try {
    const q = query(
      collection(db, 'schedules'), 
      where('type', '==', 'public_talks'),
      orderBy('createdAt', 'desc'),
      limit(10)
    )
    const snap = await getDocs(q)
    savedSchedules.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    loadDialog.value = true
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const loadSelectedBatch = (batch) => {
  talks.value = batch.schedule.sort((a, b) => {
     const dA = a.date?.toDate ? a.date.toDate() : new Date(a.date)
     const dB = b.date?.toDate ? b.date.toDate() : new Date(b.date)
     return dB - dA
  })
  loadDialog.value = false
}

const handleRowClick = (event, row) => {
  if (!authStore.isAdmin) return
  const item = row?.item || row
  if (!item) return
  editMode.value = true
  editedItem.value = {
    ...item,
    date: toInputDateFormat(item.date)
  }
  dialog.value = true
}

const closeDialog = () => { dialog.value = false }

const saveTalk = async () => {
  try {
    let dateObj = null
    if (editedItem.value.date) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(editedItem.value.date)) {
        const [y, m, d] = editedItem.value.date.split('-').map(Number)
        dateObj = new Date(y, m - 1, d, 12, 0, 0)
      } else {
        dateObj = new Date(editedItem.value.date)
      }
    }
    const data = {
      ...editedItem.value,
      date: dateObj ? Timestamp.fromDate(dateObj) : null
    }
    if (editMode.value) {
      const { id, ...payload } = data
      await updateDoc(doc(db, 'publicTalks', id), { ...payload, updatedAt: serverTimestamp() })
    } else {
      await addDoc(collection(db, 'publicTalks'), { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
    }
    await loadTalks()
    closeDialog()
  } catch (error) { console.error(error) }
}

const deleteTalk = async (item) => {
  if (confirm('Delete this talk?')) {
    await deleteDoc(doc(db, 'publicTalks', item.id))
    dialog.value = false
    await loadTalks()
  }
}

const deleteSelected = async () => {
  if (confirm(`Delete ${selected.value.length} items?`)) {
    for (const id of selected.value) await deleteDoc(doc(db, 'publicTalks', id))
    selected.value = []
    await loadTalks()
  }
}

const printTable = () => window.print()
const triggerFileInput = () => fileInput.value?.click()

const exportData = () => {
  const data = talks.value.map(t => ({
    ...t,
    date: formatDate(t.date)
  }))
  exportToExcel(data, headers, 'Public_Talks_Schedule')
}

const handleFileUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return
  importing.value = true
  try {
    const data = await importFromExcel(file, headers)
    for (const row of data) {
      if (!row.talkTitle && !row.speaker && !row.date) continue
      const parsedDate = parseExcelDate(row.date)
      if (!parsedDate) continue

      const talkDoc = {
        date: Timestamp.fromDate(parsedDate),
        talkNumber: row.talkNumber ? (Number(row.talkNumber) || row.talkNumber) : '',
        talkTitle: row.talkTitle || '',
        speaker: row.speaker || '',
        chairman: row.chairman || '',
        watchtowerReading: row.watchtowerReading || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
      await addDoc(collection(db, 'publicTalks'), talkDoc)
    }
    await loadTalks()
  } catch (err) {
    console.error('Import failed:', err)
  } finally {
    importing.value = false
    if (event.target) event.target.value = ''
  }
}

watch(() => props.scheduleData, (val) => {
  if (val && val.length > 0) talks.value = val
}, { immediate: true })

onMounted(loadTalks)
</script>

<style scoped>
.max-width-300 { max-width: 300px; }
@media print { .v-btn, .v-text-field { display: none !important; } }
</style>
