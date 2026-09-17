<template>
  <v-card>
    <v-card-title class="d-flex align-center flex-wrap py-4">
      <v-text-field
        v-model="search"
        prepend-inner-icon="mdi-magnify"
        label="Search by Number or Title"
        single-line
        hide-details
        density="compact"
        class="max-width-300 mr-4"
      />
      <v-spacer v-if="authStore.isAdmin" />
      
      <input v-if="authStore.isAdmin" type="file" ref="fileInput" accept=".xlsx, .xls" style="display: none" @change="importS99Excel" />
      <v-btn v-if="authStore.isAdmin" color="success" variant="tonal" prepend-icon="mdi-import" @click="$refs.fileInput.click()" class="mr-2" :loading="importing">Import</v-btn>
      <v-btn v-if="authStore.isAdmin" color="info" variant="tonal" prepend-icon="mdi-export" @click="exportS99Excel">Export</v-btn>
    </v-card-title>
    
    <v-data-table
      :headers="headers"
      :items="s99Talks"
      :search="search"
      :loading="loading"
      hover
    >
      <template v-slot:item.lastGiven="{ item }">
        <div v-if="lastGivenMap[item.talkNumber]">
          <div class="font-weight-bold">{{ lastGivenMap[item.talkNumber].date }}</div>
          <div class="text-caption text-grey">{{ lastGivenMap[item.talkNumber].speaker }}</div>
        </div>
        <span v-else class="text-grey">-</span>
      </template>
    </v-data-table>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="5000">
      {{ snackbar.text }}
      <template v-slot:actions>
        <v-btn variant="text" @click="snackbar.show = false">Close</v-btn>
      </template>
    </v-snackbar>
  </v-card>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { collection, getDocs, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/config/firebase'
import { useAuthStore } from '@/stores/auth'
import { exportToExcel, importFromExcel } from '@/utils/excel'

const authStore = useAuthStore()

const search = ref('')
const loading = ref(false)
const importing = ref(false)
const s99Talks = ref([])
const publicTalks = ref([])
const fileInput = ref(null)

const snackbar = ref({ show: false, text: '', color: 'info' })

const headers = [
  { title: 'Talk No.', key: 'talkNumber' },
  { title: 'Title', key: 'talkTitle' },
  { title: 'Last Given', key: 'lastGiven' }
]

const excelColumns = [
  { title: 'Talk Number', key: 'talkNumber' },
  { title: 'Talk Title', key: 'talkTitle' }
]

const lastGivenMap = computed(() => {
  const map = {}
  const sortedTalks = [...publicTalks.value].sort((a, b) => {
    return (b.date?.toDate ? b.date.toDate() : new Date(b.date)) - (a.date?.toDate ? a.date.toDate() : new Date(a.date))
  })
  
  for (const t of sortedTalks) {
    if (t.talkNumber && !map[t.talkNumber]) {
      const date = t.date?.toDate ? t.date.toDate() : new Date(t.date)
      map[t.talkNumber] = {
        date: date.toLocaleDateString(),
        speaker: t.speaker
      }
    }
  }
  return map
})

const loadData = async () => {
  loading.value = true
  try {
    const s99Snap = await getDocs(collection(db, 's99_talks'))
    s99Talks.value = s99Snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => Number(a.talkNumber) - Number(b.talkNumber))
    
    const ptSnap = await getDocs(collection(db, 'publicTalks'))
    publicTalks.value = ptSnap.docs.map(d => d.data())
  } catch (err) {
    console.error('Error loading S99 data:', err)
  } finally {
    loading.value = false
  }
}

const exportS99Excel = () => {
  exportToExcel(s99Talks.value, excelColumns, 'S99_Talks_MasterList')
}

const importS99Excel = async (event) => {
  const file = event.target.files[0]
  if (!file) return
  
  importing.value = true
  try {
    const data = await importFromExcel(file, excelColumns)
    let count = 0
    for (const row of data) {
      if (!row.talkNumber || !row.talkTitle) continue
      const existingRef = s99Talks.value.find(t => t.talkNumber == row.talkNumber)
      if (existingRef) {
        await updateDoc(doc(db, 's99_talks', existingRef.id), { talkTitle: row.talkTitle.toString() })
      } else {
        await addDoc(collection(db, 's99_talks'), {
          talkNumber: row.talkNumber.toString(),
          talkTitle: row.talkTitle.toString(),
          createdAt: serverTimestamp()
        })
      }
      count++
    }
    await loadData()
    snackbar.value = { show: true, text: `Imported ${count} S-99 themes successfully!`, color: 'success' }
  } catch (error) {
    snackbar.value = { show: true, text: 'Failed to import S-99 Excel: ' + error.message, color: 'error' }
  } finally {
    importing.value = false
    event.target.value = ''
  }
}

onMounted(loadData)
</script>

<style scoped>
.max-width-300 {
  max-width: 300px;
}
</style>
