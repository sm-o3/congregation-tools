<template>
  <v-card>
    <v-card-title class="d-flex align-center justify-space-between flex-wrap py-3 px-4">
      <span>Generate Sound Schedule</span>
      <v-chip color="primary" variant="tonal" prepend-icon="mdi-calendar-check" size="small">
        Midweek Meeting: {{ localMidweekDay }}
      </v-chip>
    </v-card-title>
    <v-card-text>
      <v-alert
        type="info"
        variant="tonal"
        density="compact"
        class="mb-4"
        icon="mdi-information-outline"
      >
        Generating schedule for <strong>Midweek Meeting ({{ localMidweekDay }})</strong> and <strong>Weekend Meeting (Sunday)</strong> based on Congregation Settings.
      </v-alert>
      <v-row>
        <v-col cols="12" md="4">
          <v-text-field v-model="startDate" label="Start Date" type="date" />
        </v-col>
        <v-col cols="12" md="4">
          <v-text-field v-model="endDate" label="End Date" type="date" />
        </v-col>
        <v-col cols="12" md="4" class="d-flex align-center">
          <v-btn color="primary" @click="generate" :loading="generating" block>Assign</v-btn>
        </v-col>
      </v-row>
    </v-card-text>
    
    <v-divider v-if="previewSchedule.length > 0" />
    
    <v-card-text v-if="previewSchedule.length > 0">
      <div class="d-flex align-center mb-4">
        <h3 class="text-h6">Preview ({{ previewSchedule.length }} Assignments)</h3>
        <v-spacer />
        <v-btn color="success" @click="save" :loading="saving" prepend-icon="mdi-check">Push to Schedule</v-btn>
      </div>
      
      <v-table density="compact" class="border rounded draft-table">
        <thead>
          <tr>
            <th style="width: 140px;">Date</th>
            <th style="width: 100px;">Day</th>
            <th>Stage</th>
            <th>PC</th>
            <th>Amplifier</th>
            <th>Rowing A</th>
            <th>Rowing B</th>
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
                v-model="row.stage"
                :items="getRoleOptions('stage')"
                hide-details
                density="compact"
                variant="plain"
                class="cell-input"
              />
            </td>
            <td>
              <v-combobox
                v-model="row.pc"
                :items="getRoleOptions('pc')"
                hide-details
                density="compact"
                variant="plain"
                class="cell-input"
              />
            </td>
            <td>
              <v-combobox
                v-model="row.amplifier"
                :items="getRoleOptions('amplifier')"
                hide-details
                density="compact"
                variant="plain"
                class="cell-input"
              />
            </td>
            <td>
              <v-combobox
                v-model="row.rowingA"
                :items="getRoleOptions('rowing')"
                hide-details
                density="compact"
                variant="plain"
                class="cell-input"
              />
            </td>
            <td>
              <v-combobox
                v-model="row.rowingB"
                :items="getRoleOptions('rowing')"
                hide-details
                density="compact"
                variant="plain"
                class="cell-input"
              />
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/config/firebase'

const props = defineProps({
  publishers: Array,
  midweekDay: String
})

const emit = defineEmits(['schedule-generated'])

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
    console.error('Error loading midweek day in SoundGenerator:', err)
  }
}

onMounted(loadMidweekDay)

const today = new Date()
const startDate = ref(new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0])
const endDate = ref(new Date(today.getFullYear(), today.getMonth() + 2, 0).toISOString().split('T')[0])
const generating = ref(false)
const saving = ref(false)
const previewSchedule = ref([])

const getDayName = (dateStr) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long' })
}

const getRoleOptions = (roleKey) => {
  const saved = localStorage.getItem('soundScheduleSelections')
  if (!saved) return []
  const selections = JSON.parse(saved)
  const selectedIds = selections[roleKey] || []
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

const getNextName = (names, index) => names[index % names.length]

const generate = () => {
  const saved = localStorage.getItem('soundScheduleSelections')
  if (!saved) {
    alert('Please select publishers in the "Select Publishers" tab first.')
    return
  }
  
  const selections = JSON.parse(saved)
  const roleData = {}
  let hasSelection = false

  Object.keys(selections).forEach(role => {
    const names = props.publishers
      .filter(p => selections[role]?.includes(p.id))
      .map(p => p.name)
    
    if (names.length > 0) {
      roleData[role] = {
        names: shuffleArray(names),
        idx: 0
      }
      hasSelection = true
    }
  })

  if (!hasSelection) {
    alert('Please select publishers for each role.')
    return
  }

  generating.value = true
  try {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const midweekIdx = days.indexOf(localMidweekDay.value)
    const midweekMeetingIdx = midweekIdx !== -1 ? midweekIdx : 4
    const weekendMeetingIdx = 0 // Sunday

    const start = new Date(startDate.value)
    const end = new Date(endDate.value)
    const scheduleDates = []
    let current = new Date(start)

    while (current <= end) {
      if (current.getDay() === midweekMeetingIdx || current.getDay() === weekendMeetingIdx) {
        scheduleDates.push(new Date(current))
      }
      current.setDate(current.getDate() + 1)
    }

    previewSchedule.value = scheduleDates.map((date, i) => {
      const isSunday = date.getDay() === weekendMeetingIdx
      const assignedToday = new Set()

      const getSafeName = (roleKey) => {
        const data = roleData[roleKey]
        if (!data) return 'N/A'
        
        let attempts = 0
        while (attempts < data.names.length) {
          const name = data.names[data.idx % data.names.length]
          data.idx++
          if (!assignedToday.has(name)) {
            assignedToday.add(name)
            return name
          }
          attempts++
        }
        return 'N/A'
      }

      const stage = getSafeName('stage')
      const pc = getSafeName('pc')
      const amplifier = getSafeName('amplifier')
      
      const r1 = getSafeName('rowing')
      const r2 = getSafeName('rowing')
      const rowingA = `${r1}, ${r2}`

      let rowingB = '-'
      if (isSunday) {
        const r3 = getSafeName('rowing')
        const r4 = getSafeName('rowing')
        rowingB = `${r3}, ${r4}`
      }

      return {
        id: Date.now() + i,
        date: date.toISOString().split('T')[0],
        stage,
        pc,
        amplifier,
        rowingA,
        rowingB
      }
    })
  } finally {
    generating.value = false
  }
}

const save = () => {
  saving.value = true
  try {
    emit('schedule-generated', [...previewSchedule.value])
    alert('Schedule generated and pushed to view.')
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
</style>
