<template>
  <div>
    <v-row class="mb-2">
      <v-col cols="12">
        <h1 class="text-h4 font-weight-bold">Add Meeting Attendance</h1>
        <p class="text-body-2 text-medium-emphasis mt-1">Record In-Person and Zoom attendance for congregation meetings.</p>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" md="10" lg="8" class="mx-auto">
        <v-card class="elevation-2 rounded-xl">
          <v-card-title class="d-flex align-center bg-primary text-white py-4 px-6">
            <v-icon class="mr-3" color="white">mdi-calendar-plus</v-icon>
            <span class="text-h6 font-weight-bold">Meeting Attendance Form</span>
          </v-card-title>
          
          <v-card-text class="pa-6">
            <v-form ref="form" v-model="isValid" @submit.prevent="submitAttendance">
              <v-row>
                <!-- Meeting Type -->
                <v-col cols="12">
                  <div class="text-subtitle-2 font-weight-bold mb-2">Meeting Type *</div>
                  <v-btn-toggle
                    v-model="meetingType"
                    color="primary"
                    mandatory
                    group
                    class="w-100 d-flex"
                  >
                    <v-btn
                      value="Midweek Meeting"
                      variant="outlined"
                      class="flex-grow-1 py-3"
                      prepend-icon="mdi-book-open-variant"
                    >
                      Midweek Meeting
                    </v-btn>
                    <v-btn
                      value="Weekend Meeting"
                      variant="outlined"
                      class="flex-grow-1 py-3"
                      prepend-icon="mdi-account-group"
                    >
                      Weekend Meeting
                    </v-btn>
                  </v-btn-toggle>
                </v-col>

                <!-- Date Selector -->
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="selectedDate"
                    label="Meeting Date *"
                    type="date"
                    variant="outlined"
                    density="comfortable"
                    :rules="[v => !!v || 'Date is required']"
                    prepend-inner-icon="mdi-calendar"
                    @update:model-value="onDateChanged"
                  />
                </v-col>

                <!-- Week & Month Calculation Display -->
                <v-col cols="12" sm="6" class="d-flex align-center">
                  <v-card variant="tonal" color="info" class="w-100 pa-3 rounded-lg">
                    <div class="text-caption font-weight-bold text-info mb-1">Calculated Timing:</div>
                    <div class="d-flex align-center ga-2 flex-wrap text-body-2 font-weight-medium">
                      <v-chip size="small" color="info" variant="flat">{{ weekLabel }}</v-chip>
                      <v-chip size="small" color="primary" variant="flat">{{ monthName }} {{ year }}</v-chip>
                    </div>
                  </v-card>
                </v-col>

                <!-- In-Person Count -->
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model.number="inPerson"
                    label="In-Person Count *"
                    type="number"
                    min="0"
                    variant="outlined"
                    density="comfortable"
                    :rules="[v => v !== null && v !== '' && v >= 0 || 'Valid in-person count required']"
                    prepend-inner-icon="mdi-account"
                  />
                </v-col>

                <!-- Zoom Count -->
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model.number="zoom"
                    label="Zoom Count *"
                    type="number"
                    min="0"
                    variant="outlined"
                    density="comfortable"
                    :rules="[v => v !== null && v !== '' && v >= 0 || 'Valid zoom count required']"
                    prepend-inner-icon="mdi-video"
                  />
                </v-col>

                <!-- Total Count (Auto-calculated) -->
                <v-col cols="12">
                  <v-text-field
                    :model-value="totalCount"
                    label="Total Attendance (In-Person + Zoom)"
                    variant="filled"
                    density="comfortable"
                    readonly
                    disabled
                    prepend-inner-icon="mdi-sigma"
                    class="font-weight-bold"
                  >
                    <template v-slot:append-inner>
                      <v-chip color="primary" size="small" variant="flat" class="font-weight-bold">
                        Total: {{ totalCount }}
                      </v-chip>
                    </template>
                  </v-text-field>
                </v-col>

                <!-- Memorial Checkbox -->
                <v-col cols="12">
                  <v-checkbox
                    v-model="isMemorial"
                    color="purple-darken-1"
                    hide-details
                    density="comfortable"
                  >
                    <template v-slot:label>
                      <span class="font-weight-medium text-body-1">
                        Memorial Attendance
                      </span>
                      <v-chip color="purple" size="x-small" class="ml-2">Special Event</v-chip>
                    </template>
                  </v-checkbox>
                </v-col>

                <!-- Remarks -->
                <v-col cols="12">
                  <v-textarea
                    v-model="remarks"
                    label="Remarks (Optional)"
                    variant="outlined"
                    density="comfortable"
                    rows="2"
                    prepend-inner-icon="mdi-note-text"
                  />
                </v-col>
              </v-row>

              <v-divider class="my-4" />

              <div class="d-flex justify-center">
                <v-btn
                  type="submit"
                  color="primary"
                  size="large"
                  :loading="submitting"
                  prepend-icon="mdi-check"
                  class="px-8"
                  min-width="200"
                >
                  Submit Attendance
                </v-btn>
              </div>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Snackbar Notification -->
    <v-snackbar v-model="snackbar" :color="snackbarColor" timeout="4000" location="top">
      {{ snackbarText }}
      <template v-slot:actions>
        <v-btn color="white" variant="text" @click="snackbar = false">Close</v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/config/firebase'
import { useAuthStore } from '@/stores/auth'
import { logActivity } from '@/utils/logging'

const authStore = useAuthStore()

const todayStr = new Date().toISOString().split('T')[0]
const selectedDate = ref(todayStr)
const meetingType = ref('Midweek Meeting')
const isMemorial = ref(false)
const inPerson = ref(0)
const zoom = ref(0)
const remarks = ref('')

const form = ref(null)
const isValid = ref(false)
const submitting = ref(false)

const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

const monthsList = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

// Auto-calculate Week of Month (1st, 2nd, 3rd, 4th, 5th week)
const calculatedTiming = computed(() => {
  if (!selectedDate.value) return { weekNumber: 1, weekLabel: '1st week', month: 0, monthName: 'January', year: new Date().getFullYear() }
  const parts = selectedDate.value.split('-')
  const y = parseInt(parts[0])
  const m = parseInt(parts[1]) - 1
  const d = parseInt(parts[2])

  const weekNumber = Math.min(5, Math.ceil(d / 7))
  const suffixes = ['1st', '2nd', '3rd', '4th', '5th']
  const weekLabel = `${suffixes[weekNumber - 1]} week`

  return {
    weekNumber,
    weekLabel,
    month: m,
    monthName: monthsList[m] || 'January',
    year: y
  }
})

const weekLabel = computed(() => calculatedTiming.value.weekLabel)
const monthName = computed(() => calculatedTiming.value.monthName)
const year = computed(() => calculatedTiming.value.year)

// Total Attendance (In-Person + Zoom)
const totalCount = computed(() => {
  const p = typeof inPerson.value === 'number' ? inPerson.value : 0
  const z = typeof zoom.value === 'number' ? zoom.value : 0
  return Math.max(0, p + z)
})

const onDateChanged = () => {
  if (selectedDate.value) {
    const d = new Date(selectedDate.value)
    const day = d.getDay() // 0 = Sun, 6 = Sat
    if (day === 0 || day === 6) {
      meetingType.value = 'Weekend Meeting'
    } else {
      meetingType.value = 'Midweek Meeting'
    }
  }
}

const submitAttendance = async () => {
  if (form.value) {
    const { valid } = await form.value.validate()
    if (!valid) return
  }

  submitting.value = true
  try {
    const timing = calculatedTiming.value
    const payload = {
      date: selectedDate.value,
      meetingType: meetingType.value,
      month: timing.month,
      year: timing.year,
      weekNumber: timing.weekNumber,
      weekLabel: timing.weekLabel,
      isMemorial: Boolean(isMemorial.value),
      inPerson: Number(inPerson.value) || 0,
      zoom: Number(zoom.value) || 0,
      total: totalCount.value,
      remarks: remarks.value || '',
      createdAt: serverTimestamp()
    }

    await addDoc(collection(db, 'meetingAttendance'), payload)
    await logActivity(
      authStore,
      'Meeting Attendance Added',
      `${meetingType.value}${isMemorial.value ? ' (Memorial)' : ''} (${timing.weekLabel}, ${timing.monthName} ${timing.year}) - Total: ${totalCount.value}`,
      timing.month,
      timing.year,
      null,
      payload
    )

    snackbarText.value = `Meeting Attendance saved successfully! Total: ${totalCount.value}`
    snackbarColor.value = 'success'
    snackbar.value = true

    // Reset numeric inputs
    isMemorial.value = false
    inPerson.value = 0
    zoom.value = 0
    remarks.value = ''
  } catch (error) {
    console.error('Error saving meeting attendance:', error)
    snackbarText.value = 'Failed to save meeting attendance: ' + error.message
    snackbarColor.value = 'error'
    snackbar.value = true
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
</style>
