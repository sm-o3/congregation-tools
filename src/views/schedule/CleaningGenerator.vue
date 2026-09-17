<template>
  <v-card>
    <v-card-title>Generate Cleaning Schedule</v-card-title>
    <v-card-text>
      <v-row align="center">
        <v-col cols="12" sm="6" md="3">
          <v-text-field v-model="startDate" label="Start Date" type="date" hide-details density="comfortable" />
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-text-field v-model="endDate" label="End Date" type="date" hide-details density="comfortable" />
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-checkbox
            v-model="includeRestrooms"
            label="Include Gents/Ladies Restroom"
            color="primary"
            hide-details
            density="comfortable"
          />
        </v-col>
        <v-col cols="12" sm="6" md="3" class="d-flex align-center">
          <v-btn color="primary" @click="generate" :loading="generating" block size="large">Assign</v-btn>
        </v-col>
      </v-row>
    </v-card-text>
    
    <v-divider v-if="previewSchedule.length > 0" />
    
    <v-card-text v-if="previewSchedule.length > 0">
      <div class="d-flex align-center mb-4">
        <h3 class="text-h6">Preview ({{ previewSchedule.length }} Assignments)</h3>
        <v-spacer />
        <v-btn color="success" @click="save" :loading="saving" prepend-icon="mdi-content-save">Save Schedule</v-btn>
      </div>
      
      <v-table density="compact" class="border rounded draft-table">
        <thead>
          <tr>
            <th style="width: 140px;">Date</th>
            <th style="width: 100px;">Day</th>
            <th style="width: 150px;">Group</th>
            <th v-if="includeRestrooms">Gents Restroom</th>
            <th v-if="includeRestrooms">Ladies Restroom</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in previewSchedule" :key="row.id">
            <td>
              <v-text-field v-model="row.date" hide-details density="compact" variant="plain" class="cell-input px-2" type="date" />
            </td>
            <td class="px-4 text-body-2">{{ getDayName(row.date) }}</td>
            <td>
              <v-combobox
                v-model="row.group"
                :items="groups.map(g => g.name)"
                hide-details
                density="compact"
                variant="plain"
                class="cell-input"
              />
            </td>
            <td v-if="includeRestrooms">
              <v-combobox
                v-model="row.gentsRestroom"
                :items="getPublisherOptions(row.group, 'males')"
                hide-details
                density="compact"
                variant="plain"
                class="cell-input"
                multiple
                chips
                closable-chips
              />
            </td>
            <td v-if="includeRestrooms">
              <v-combobox
                v-model="row.ladiesRestroom"
                :items="getPublisherOptions(row.group, 'females')"
                hide-details
                density="compact"
                variant="plain"
                class="cell-input"
                multiple
                chips
                closable-chips
              />
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { collection, addDoc, getDoc, doc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/config/firebase'

const props = defineProps({
  groups: Array,
  publishers: Array,
  midweekDay: String
})

const emit = defineEmits(['schedule-generated'])

const today = new Date()
const startDate = ref(new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0])
const endDate = ref(new Date(today.getFullYear(), today.getMonth() + 3, 0).toISOString().split('T')[0])
const includeRestrooms = ref(true)
const generating = ref(false)
const saving = ref(false)
const previewSchedule = ref([])
const localMidweekDay = ref(props.midweekDay || 'Thursday')

const loadMidweekDay = async () => {
  try {
    const snap = await getDoc(doc(db, 'settings', 'meetings'))
    if (snap.exists() && snap.data().midweekMeetingDay) {
      localMidweekDay.value = snap.data().midweekMeetingDay
    }
  } catch (err) {
    console.error('Error loading midweek day in generator:', err)
  }
}

onMounted(loadMidweekDay)

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

const getDayName = (dateStr) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long' })
}

const getPublisherOptions = (groupName, genderKey) => {
  const group = props.groups.find(g => g.name === groupName)
  if (!group) return []
  
  const saved = localStorage.getItem('cleaningScheduleSelections')
  const selections = saved ? JSON.parse(saved) : {}
  const selectedIds = selections[group.id]?.[genderKey] || []
  
  return props.publishers
    .filter(p => selectedIds.includes(p.id))
    .map(p => p.name)
}

const shuffleArray = (array) => {
  const newArray = [...array]
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]]
  }
  return newArray
}

const generate = () => {
  generating.value = true
  try {
    const saved = localStorage.getItem('cleaningScheduleSelections')
    const selections = saved ? JSON.parse(saved) : {}
    
    const groupsData = {}
    props.groups.forEach(group => {
      const selectedMales = selections[group.id]?.males || []
      const selectedFemales = selections[group.id]?.females || []
      
      const maleNames = props.publishers.filter(p => selectedMales.includes(p.id)).map(p => p.name)
      const femaleNames = props.publishers.filter(p => selectedFemales.includes(p.id)).map(p => p.name)
      
      if (maleNames.length > 0 || femaleNames.length > 0) {
        groupsData[group.name] = {
          males: shuffleArray(maleNames),
          females: shuffleArray(femaleNames),
          mIdx: 0,
          fIdx: 0
        }
      }
    })

    if (Object.keys(groupsData).length === 0 && includeRestrooms.value) {
      alert('Please select publishers in the "Select Publishers" tab first.')
      return
    }

    const groupNames = Object.keys(groupsData).length > 0 ? Object.keys(groupsData) : props.groups.map(g => g.name)
    if (groupNames.length === 0) {
      alert('No groups available to generate schedule.')
      return
    }

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const midweekIdx = days.indexOf(localMidweekDay.value)
    const midweekCleaningIdx = midweekIdx
    const weekendCleaningIdx = 0 // Sunday

    const cleaningDates = []
    let current = new Date(startDate.value)
    const end = new Date(endDate.value)
    while (current <= end) {
      if (current.getDay() === midweekCleaningIdx || current.getDay() === weekendCleaningIdx) {
        cleaningDates.push(new Date(current))
      }
      current.setDate(current.getDate() + 1)
    }

    previewSchedule.value = cleaningDates.map((date, i) => {
      const gName = groupNames[i % groupNames.length]
      const gData = groupsData[gName]
      
      let gents = []
      let ladies = []

      if (includeRestrooms.value && gData) {
        if (gData.males.length >= 2) {
          gents = [gData.males[gData.mIdx % gData.males.length], gData.males[(gData.mIdx + 1) % gData.males.length]]
          gData.mIdx += 2
        } else if (gData.males.length === 1) {
          gents = [gData.males[0]]
        }

        if (gData.females.length >= 2) {
          ladies = [gData.females[gData.fIdx % gData.females.length], gData.females[(gData.fIdx + 1) % gData.females.length]]
          gData.fIdx += 2
        } else if (gData.females.length === 1) {
          ladies = [gData.females[0]]
        }
      }

      return {
        id: i,
        date: date.toISOString().split('T')[0],
        group: gName,
        gentsRestroom: gents,
        ladiesRestroom: ladies
      }
    })
  } finally {
    generating.value = false
  }
}

const save = async () => {
  saving.value = true
  try {
    const formattedSchedule = previewSchedule.value.map(row => {
      const gentsStr = Array.isArray(row.gentsRestroom) ? row.gentsRestroom.join(', ') : (row.gentsRestroom || '')
      const ladiesStr = Array.isArray(row.ladiesRestroom) ? row.ladiesRestroom.join(', ') : (row.ladiesRestroom || '')
      
      return {
        ...row,
        gentsRestroom: includeRestrooms.value ? gentsStr : '',
        ladiesRestroom: includeRestrooms.value ? ladiesStr : ''
      }
    })

    emit('schedule-generated', formattedSchedule)
    alert('Schedule generated and pushed to view.')
  } catch (error) {
    console.error('Error generating schedule:', error)
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.draft-table th {
  background-color: rgba(var(--v-theme-surface-variant), 0.1);
  text-align: left;
  padding: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.cell-input :deep(.v-field__input) {
  padding: 8px 12px !important;
  min-height: unset !important;
  font-size: 0.9rem;
}

.cell-input :deep(.v-chip) {
  margin: 2px !important;
}
</style>
