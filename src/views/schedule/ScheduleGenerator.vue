<template>
  <div>
    <v-autocomplete
      v-model="assignableBrothers"
      :items="allBrothersOptions"
      label="Assignable Brothers (Uncheck to Exclude from Auto Assign)"
      multiple
      chips
      closable-chips
      hide-details
      density="compact"
      class="mb-4"
    >
      <template v-slot:prepend-item>
        <v-list-item title="Select All" @click="toggleAllBrothers">
          <template v-slot:prepend>
            <v-checkbox-btn
              :model-value="assignableBrothers.length === allBrothersOptions.length"
              :indeterminate="assignableBrothers.length > 0 && assignableBrothers.length < allBrothersOptions.length"
            ></v-checkbox-btn>
          </template>
        </v-list-item>
        <v-divider class="mt-2"></v-divider>
      </template>
    </v-autocomplete>

    <v-card class="mb-4">
      <v-card-text>
        <v-row class="align-center">
          <v-col cols="12" sm="4">
            <v-text-field v-model="fromDate" type="date" label="From Date" hide-details />
          </v-col>
          <v-col cols="12" sm="4">
            <v-text-field v-model="toDate" type="date" label="To Date" hide-details />
          </v-col>
          <v-col cols="12" sm="4">
            <v-btn color="primary" @click="generateSundays" block :loading="generating">Auto Assign</v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-card v-if="draftSchedule.length > 0">
      <v-card-title class="d-flex justify-space-between align-center flex-wrap gap-2 py-4">
        <h3 class="text-h6">Draft Schedule ({{ draftSchedule.length }} Sundays)</h3>
        <div class="d-flex gap-2">
          <v-btn color="error" variant="tonal" prepend-icon="mdi-trash-can" @click="clearDraft">Clear Draft</v-btn>
          <v-btn color="success" prepend-icon="mdi-content-save" @click="saveSchedule" :loading="saving">Save to Schedule</v-btn>
        </div>
      </v-card-title>
      
      <v-card-text class="pa-0 pa-sm-2">
        <div class="table-responsive">
          <table class="draft-table">
            <thead>
              <tr>
                <th style="width: 140px;">Date</th>
                <th style="width: 80px;">No.</th>
                <th>Talk Title</th>
                <th>Speaker</th>
                <th>Chairman</th>
                <th>WT Reader</th>
                <th style="width: 50px;"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in draftSchedule" :key="index">
                <td>
                  <v-text-field v-model="item.dateStr" hide-details density="compact" variant="plain" placeholder="DD MMM YYYY" @change="saveDraft" class="cell-input px-2" />
                </td>
                <td>
                  <v-autocomplete 
                    v-model="item.talkNumber" 
                    :items="s99Talks"
                    item-title="talkNumber"
                    item-value="talkNumber"
                    hide-details 
                    density="compact" 
                    variant="plain"
                    placeholder="#"
                    @update:modelValue="autoFillTitle(item)"
                    class="cell-input"
                    auto-select-first
                    menu-icon=""
                    hide-no-data
                  >
                    <template v-slot:item="{ props, item: slotItem }">
                      <v-list-item v-bind="props" :title="`${slotItem.raw.talkNumber} - ${slotItem.raw.talkTitle}`" density="compact"></v-list-item>
                    </template>
                  </v-autocomplete>
                </td>
                <td>
                  <v-combobox
                    v-model="item.talkTitle"
                    :items="customTalkTitles"
                    item-title="keyword"
                    item-value="suggestion"
                    :return-object="false"
                    hide-details
                    density="compact"
                    variant="plain"
                    placeholder="Title"
                    @update:modelValue="(val) => handleTitleSelect(item, val)"
                    class="cell-input"
                    menu-icon=""
                    hide-no-data
                  >
                    <template v-slot:item="{ props, item: slotItem }">
                      <v-list-item v-bind="props" :title="slotItem.raw.keyword" :subtitle="slotItem.raw.suggestion" density="compact"></v-list-item>
                    </template>
                  </v-combobox>
                </td>
                <td>
                  <v-combobox
                    v-model="item.speaker"
                    :items="chairmanOptions"
                    hide-details
                    density="compact"
                    variant="plain"
                    placeholder="Speaker"
                    @update:modelValue="saveDraft"
                    class="cell-input"
                    menu-icon=""
                  />
                </td>
                <td>
                  <v-combobox
                    v-model="item.chairman"
                    :items="chairmanOptions"
                    hide-details
                    density="compact"
                    variant="plain"
                    placeholder="Chairman"
                    @update:modelValue="saveDraft"
                    class="cell-input"
                    menu-icon=""
                  />
                </td>
                <td>
                  <v-combobox
                    v-model="item.watchtowerReading"
                    :items="readerOptions"
                    hide-details
                    density="compact"
                    variant="plain"
                    placeholder="Reader"
                    @update:modelValue="saveDraft"
                    class="cell-input"
                    menu-icon=""
                  />
                </td>
                <td class="text-center">
                  <v-btn icon size="x-small" variant="text" color="error" @click="removeDraftRow(index)">
                    <v-icon>mdi-close</v-icon>
                  </v-btn>
                </td>
              </tr>
            </tbody>
          </table>
          <div class="pa-2 border-top d-flex">
            <v-btn variant="text" prepend-icon="mdi-plus" @click="addDraftRow" color="primary">Add Next Sunday</v-btn>
          </div>
        </div>
      </v-card-text>
    </v-card>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="5000">
      {{ snackbar.text }}
      <template v-slot:actions>
        <v-btn variant="text" @click="snackbar.show = false">Close</v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { collection, getDocs, addDoc, doc, Timestamp, serverTimestamp } from 'firebase/firestore'
import { db } from '@/config/firebase'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const emit = defineEmits(['schedule-generated'])

// State
const s99Talks = ref([])
const publicTalks = ref([])
const publishers = ref([])
const generating = ref(false)
const saving = ref(false)

const fromDate = ref('')
const toDate = ref('')
const draftSchedule = ref(JSON.parse(localStorage.getItem('s99_draft_schedule') || '[]'))
const assignableBrothers = ref(JSON.parse(localStorage.getItem('s99_assignable_brothers') || '[]'))

// Snackbar
const snackbar = ref({ show: false, text: '', color: 'info' })

// Options
const allBrothersOptions = computed(() => {
  const allowedRoles = ['Elder', 'Ministerial Servant', 'Publisher']
  return publishers.value
    .filter(p => p.gender === 'Male' && allowedRoles.includes(p.role))
    .map(p => 'Br. ' + p.name)
    .sort()
})

const chairmanOptions = computed(() => {
  return publishers.value
    .filter(p => p.role === 'Elder' || p.role === 'Ministerial Servant')
    .map(p => 'Br. ' + p.name)
    .sort()
})

const readerOptions = computed(() => {
  return publishers.value
    .filter(p => p.gender === 'Male' && p.role !== 'Un-Baptized Publisher')
    .map(p => 'Br. ' + p.name)
    .sort()
})

const toggleAllBrothers = () => {
  if (assignableBrothers.value.length === allBrothersOptions.value.length) {
    assignableBrothers.value = []
  } else {
    assignableBrothers.value = [...allBrothersOptions.value]
  }
}

const customTalkTitles = [
  { keyword: 'Guest Speaker', suggestion: 'Guest Speaker' },
  { keyword: 'Memorial', suggestion: 'நினைவுநாள்' },
  { keyword: 'Convention', suggestion: 'மண்டல மாநாடு' },
  { keyword: 'Co Visit', suggestion: 'வட்டாரக் கண்காணி சந்திப்பு' },
  { keyword: 'CACO', suggestion: 'வட்டார மாநாட்டு — வட்டாரக் கண்காணியுடன்' },
  { keyword: 'CABR', suggestion: 'வட்டார மாநாட்டு — கிளை அலுவலக பிரதிநிதியுடன்' }
]

const handleTitleSelect = (item, val) => {
  if (val && typeof val === 'object' && val.suggestion) {
    item.talkTitle = val.suggestion
  } else if (val !== undefined && val !== null) {
    item.talkTitle = val
  }
  saveDraft()
}

const clearDraft = () => {
  if (confirm('Are you sure you want to clear the draft?')) {
    draftSchedule.value = []
    saveDraft()
  }
}

const lastGivenMap = computed(() => {
  const map = {}
  const sortedTalks = [...publicTalks.value].sort((a, b) => {
    return b.dateObj - a.dateObj
  })
  
  for (const t of sortedTalks) {
    if (t.talkNumber && !map[t.talkNumber]) {
      map[t.talkNumber] = {
        date: t.dateObj.toLocaleDateString(),
        speaker: t.speaker
      }
    }
  }
  return map
})

const loadData = async () => {
  try {
    const s99Snap = await getDocs(collection(db, 's99_talks'))
    s99Talks.value = s99Snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => Number(a.talkNumber) - Number(b.talkNumber))
    
    const ptSnap = await getDocs(collection(db, 'publicTalks'))
    publicTalks.value = ptSnap.docs.map(d => {
      const data = d.data()
      return {
        id: d.id,
        ...data,
        dateObj: data.date?.toDate ? data.date.toDate() : new Date(data.date)
      }
    })
    
    const pubSnap = await getDocs(collection(db, 'publishers'))
    publishers.value = pubSnap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(p => p.role !== 'Inactive Publisher' && p.role !== 'Removed')
    
    if (assignableBrothers.value.length === 0) {
      assignableBrothers.value = [...allBrothersOptions.value]
    }
  } catch (err) {
    console.error('Error loading data:', err)
  }
}

const saveDraft = () => {
  localStorage.setItem('s99_draft_schedule', JSON.stringify(draftSchedule.value))
}

watch(assignableBrothers, (newVal) => {
  localStorage.setItem('s99_assignable_brothers', JSON.stringify(newVal))
})

const formatDateToDDMMMYYYY = (date) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const d = date.getDate().toString().padStart(2, '0')
  const m = months[date.getMonth()]
  const y = date.getFullYear()
  return `${d} ${m} ${y}`
}

const addDraftRow = () => {
  let nextDateStr = ''
  if (draftSchedule.value.length > 0) {
    const lastDateStr = draftSchedule.value[draftSchedule.value.length - 1].dateStr
    if (lastDateStr) {
      const lastDate = new Date(lastDateStr)
      if (!isNaN(lastDate.getTime())) {
        lastDate.setDate(lastDate.getDate() + 7)
        nextDateStr = formatDateToDDMMMYYYY(lastDate)
      }
    }
  } else {
    const d = new Date()
    d.setDate(d.getDate() + (7 - d.getDay()) % 7 || 7)
    nextDateStr = formatDateToDDMMMYYYY(d)
  }

  draftSchedule.value.push({
    dateStr: nextDateStr,
    talkNumber: '',
    talkTitle: '',
    chairman: '',
    watchtowerReading: '',
    speaker: ''
  })
  saveDraft()
}

const removeDraftRow = (index) => {
  draftSchedule.value.splice(index, 1)
  saveDraft()
}

const generateSundays = () => {
  if (!fromDate.value || !toDate.value) {
    snackbar.value = { show: true, text: 'Please select both From and To dates', color: 'error' }
    return
  }
  
  generating.value = true
  try {
    const start = new Date(fromDate.value)
    const end = new Date(toDate.value)
    const sundays = []
    
    let current = new Date(start)
    while (current <= end) {
      if (current.getDay() === 0) {
        sundays.push(new Date(current))
      }
      current.setDate(current.getDate() + 1)
    }
    
    if (sundays.length === 0) {
      snackbar.value = { show: true, text: 'No Sundays found in that date range', color: 'warning' }
      generating.value = false
      return
    }

    let chairs = chairmanOptions.value.filter(c => assignableBrothers.value.includes(c))
    let readers = readerOptions.value.filter(r => assignableBrothers.value.includes(r))
    
    if (chairs.length === 0) chairs = [...chairmanOptions.value]
    if (readers.length === 0) readers = [...readerOptions.value]
    
    const shuffleArray = (array) => {
      const arr = [...array]
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr
    }
    
    chairs = shuffleArray(chairs)
    readers = shuffleArray(readers)
    
    let chairIdx = 0
    let readerIdx = 0
    
    for (const d of sundays) {
      const dStr = formatDateToDDMMMYYYY(d)
      let row = draftSchedule.value.find(r => r.dateStr === dStr)
      if (!row) {
        row = {
          dateStr: dStr,
          talkNumber: '',
          talkTitle: '',
          chairman: '',
          watchtowerReading: '',
          speaker: ''
        }
        draftSchedule.value.push(row)
      }
      
      if (!row.chairman) {
        let selectedChair = chairs[chairIdx % chairs.length] || ''
        let loopBreaker = 0
        while ((selectedChair === row.watchtowerReading || selectedChair === row.speaker) && loopBreaker < chairs.length && chairs.length > 1) {
          chairIdx++
          selectedChair = chairs[chairIdx % chairs.length] || ''
          loopBreaker++
        }
        row.chairman = selectedChair
        chairIdx++
      }
      
      if (!row.watchtowerReading) {
        let selectedReader = readers[readerIdx % readers.length] || ''
        let loopBreaker = 0
        while ((selectedReader === row.chairman || selectedReader === row.speaker) && loopBreaker < readers.length && readers.length > 1) {
          readerIdx++
          selectedReader = readers[readerIdx % readers.length] || ''
          loopBreaker++
        }
        row.watchtowerReading = selectedReader
        readerIdx++
      }
    }
    
    draftSchedule.value.sort((a,b) => new Date(a.dateStr) - new Date(b.dateStr))
    saveDraft()
    snackbar.value = { show: true, text: `Generated ${sundays.length} matching Sundays!`, color: 'success' }
    
  } catch(e) {
    console.error(e)
    snackbar.value = { show: true, text: 'Error generating schedule', color: 'error' }
  } finally {
    generating.value = false
  }
}

const autoFillTitle = (item) => {
  if (!item.talkNumber) return
  const match = s99Talks.value.find(t => t.talkNumber == item.talkNumber)
  if (match) {
    item.talkTitle = match.talkTitle
    saveDraft()
  }
  const history = lastGivenMap.value[item.talkNumber]
  if (history) {
    snackbar.value = { 
      show: true, 
      text: `Talk ${item.talkNumber} was previously given on ${history.date} by ${history.speaker}`, 
      color: 'warning' 
    }
  }
}

const saveSchedule = async () => {
  if (draftSchedule.value.length === 0) return
  saving.value = true
  try {
    const batchData = draftSchedule.value.map(item => {
      const rawDate = new Date(item.dateStr)
      return {
        date: Timestamp.fromDate(rawDate),
        talkNumber: item.talkNumber ? item.talkNumber.toString() : '',
        talkTitle: item.talkTitle || '',
        chairman: item.chairman || '',
        watchtowerReading: item.watchtowerReading || '',
        speaker: item.speaker || ''
      }
    })

    // 1. Save as unified batch in 'schedules' collection (Cleaning Style)
    await addDoc(collection(db, 'schedules'), {
      type: 'public_talks',
      startDate: draftSchedule.value[0].dateStr,
      endDate: draftSchedule.value[draftSchedule.value.length - 1].dateStr,
      schedule: batchData,
      createdAt: serverTimestamp()
    })

    // 2. Also save individual entries to 'publicTalks' for the matrix/overview (Legacy compatibility)
    for (const payload of batchData) {
      await addDoc(collection(db, 'publicTalks'), {
        ...payload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
    }

    draftSchedule.value = []
    saveDraft()
    snackbar.value = { show: true, text: 'Successfully saved Public Talks batch!', color: 'success' }
    await loadData()
    emit('schedule-generated', batchData) // Notify parent with the new batch
  } catch (err) {
    console.error('Save error:', err)
    snackbar.value = { show: true, text: 'Error saving schedule to database', color: 'error' }
  } finally {
    saving.value = false
  }
}

onMounted(loadData)
</script>

<style scoped>
.draft-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: auto;
}

.draft-table th, .draft-table td {
  border: 1px solid rgba(var(--v-border-color), 0.3);
}

.draft-table th {
  background-color: rgba(var(--v-theme-surface-variant), 0.1);
  text-align: left;
  padding: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.draft-table td {
  padding: 0;
  vertical-align: middle;
}

.cell-input :deep(.v-field__input) {
  padding: 10px 12px !important;
  min-height: unset !important;
  font-size: 0.95rem;
}

.cell-input :deep(.v-field__append-inner) {
  padding-top: 5px;
  padding-right: 5px;
}

.border-top {
  border-top: 1px solid rgba(var(--v-border-color), 0.3);
}

.table-responsive {
  overflow-x: auto;
}
</style>
