<template>
  <div>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-4">Meeting Attendance List</h1>
      </v-col>
    </v-row>

    <!-- Filter Section -->
    <v-row>
      <v-col cols="12">
        <v-card class="mb-4">
          <v-card-title class="d-flex align-center">
            Filter Attendance
            <v-spacer />
            <v-btn
              v-if="selected.length > 0 && authStore.canDelete"
              color="error"
              @click="deleteSelected"
              prepend-icon="mdi-delete"
            >
              Delete Selected ({{ selected.length }})
            </v-btn>
          </v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12" md="4">
                <v-select
                  v-model="selectedMonth"
                  :items="months"
                  label="Month"
                  clearable
                />
              </v-col>
              
              <v-col cols="12" md="4">
                <v-select
                  v-model="selectedYear"
                  :items="years"
                  label="Year"
                  clearable
                />
              </v-col>

              <v-col cols="12" md="4">
                <v-select
                  v-model="selectedMeetingType"
                  :items="['All', 'Midweek Meeting', 'Weekend Meeting']"
                  label="Meeting Type"
                  clearable
                />
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Table Card -->
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex align-center flex-wrap ga-2 py-3">
            <v-text-field
              v-model="search"
              prepend-inner-icon="mdi-magnify"
              label="Search by Month, Year, Week, Type, Remarks..."
              single-line
              hide-details
              density="compact"
              variant="outlined"
              style="max-width: 380px; min-width: 220px;"
              clearable
            />
            
            <v-spacer />
            
            <!-- Desktop Action Buttons -->
            <div class="d-none d-md-flex align-center ga-2">
              <v-btn
                color="primary"
                to="/reports/add-meeting-attendance"
                prepend-icon="mdi-plus"
              >
                Add Attendance
              </v-btn>
              
              <input 
                type="file" 
                ref="fileInput" 
                accept=".xlsx, .xls" 
                style="display: none" 
                @change="handleFileUpload"
              />
              
              <v-btn 
                v-if="authStore.isAdmin"
                color="success" 
                variant="tonal"
                @click="triggerFileInput"
                prepend-icon="mdi-import"
                :loading="importing"
              >
                Import
              </v-btn>
              
              <v-btn 
                color="info" 
                variant="tonal"
                @click="exportData"
                prepend-icon="mdi-export"
              >
                Export
              </v-btn>
              
              <v-btn 
                icon 
                variant="tonal"
                @click="showColumnSelector = !showColumnSelector"
                title="Toggle Columns"
              >
                <v-icon>mdi-view-column</v-icon>
              </v-btn>
              
              <v-btn 
                icon 
                variant="tonal"
                @click="printTable"
                title="Print Table"
              >
                <v-icon>mdi-printer</v-icon>
              </v-btn>
            </div>

            <!-- Mobile Actions Menu -->
            <div class="d-flex d-md-none align-center ga-1">
              <v-menu offset-y>
                <template v-slot:activator="{ props }">
                  <v-btn icon v-bind="props" size="small">
                    <v-icon>mdi-dots-vertical</v-icon>
                  </v-btn>
                </template>
                <v-list>
                  <v-list-item to="/reports/add-meeting-attendance" prepend-icon="mdi-plus">
                    <v-list-item-title>Add Attendance</v-list-item-title>
                  </v-list-item>
                  <v-list-item v-if="authStore.isAdmin" @click="triggerFileInput" prepend-icon="mdi-import">
                    <v-list-item-title>Import Excel</v-list-item-title>
                  </v-list-item>
                  <v-list-item @click="exportData" prepend-icon="mdi-export">
                    <v-list-item-title>Export Excel</v-list-item-title>
                  </v-list-item>
                  <v-list-item @click="showColumnSelector = !showColumnSelector" prepend-icon="mdi-view-column">
                    <v-list-item-title>Toggle Columns</v-list-item-title>
                  </v-list-item>
                  <v-list-item @click="printTable" prepend-icon="mdi-printer">
                    <v-list-item-title>Print Table</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
            </div>
          </v-card-title>
          
          <!-- Column Visibility Selector -->
          <v-card-text v-if="showColumnSelector" class="pt-0">
            <div class="mb-2 text-subtitle-2 font-weight-medium">Toggle Column Visibility:</div>
            <v-chip-group multiple column>
              <v-chip
                v-for="col in allColumns"
                :key="col.key"
                :color="isColumnVisible(col.key) ? 'primary' : 'grey'"
                :variant="isColumnVisible(col.key) ? 'flat' : 'outlined'"
                size="small"
                @click="toggleColumn(col.key)"
              >
                <v-icon start size="small" :icon="isColumnVisible(col.key) ? 'mdi-eye' : 'mdi-eye-off'" />
                {{ col.title }}
              </v-chip>
            </v-chip-group>
          </v-card-text>
          
          <!-- Data Table -->
          <v-data-table
            v-model="selected"
            :headers="visibleHeaders"
            :items="filteredAttendance"
            :search="search"
            :loading="loading"
            item-value="id"
            :show-select="authStore.canDelete"
            hover
            class="elevation-0"
            @click:row="handleRowClick"
          >
            <template v-slot:item.no="{ index }">
              <span class="text-caption text-medium-emphasis">{{ index + 1 }}</span>
            </template>

            <template v-slot:item.meetingType="{ item }">
              <v-chip
                size="x-small"
                variant="tonal"
                :color="item.meetingType === 'Midweek Meeting' ? 'primary' : 'purple'"
              >
                {{ item.meetingType }}
              </v-chip>
            </template>

            <template v-slot:item.isMemorial="{ item }">
              <v-chip
                v-if="item.isMemorial"
                size="x-small"
                color="purple"
                variant="flat"
              >
                Memorial
              </v-chip>
              <span v-else class="text-caption text-medium-emphasis">-</span>
            </template>

            <template v-slot:item.month="{ item }">
              {{ months[item.month] || '-' }}
            </template>

            <template v-slot:item.inPerson="{ item }">
              <span class="font-weight-medium text-primary">{{ item.inPerson || 0 }}</span>
            </template>

            <template v-slot:item.zoom="{ item }">
              <span class="font-weight-medium text-info">{{ item.zoom || 0 }}</span>
            </template>

            <template v-slot:item.total="{ item }">
              <span class="font-weight-bold text-success">{{ item.total || (item.inPerson || 0) + (item.zoom || 0) }}</span>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>

    <!-- Edit Dialog -->
    <v-dialog v-model="dialog" max-width="650px" persistent scrollable>
      <v-card>
        <v-card-title class="d-flex align-center bg-surface py-3 px-4">
          <v-icon class="mr-2" color="primary">mdi-pencil</v-icon>
          <span>Edit Meeting Attendance</span>
          <v-spacer />
          <v-btn icon="mdi-close" variant="text" size="small" @click="closeDialog" />
        </v-card-title>
        
        <v-divider />
        
        <v-card-text style="max-height: 70vh;" class="pa-4">
          <v-form ref="form" @submit.prevent="saveAttendance">
            <v-row>
              <v-col cols="12" md="6">
                <v-select
                  v-model="editedItem.meetingType"
                  :items="['Midweek Meeting', 'Weekend Meeting']"
                  label="Meeting Type *"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editedItem.date"
                  label="Date *"
                  type="date"
                  variant="outlined"
                  density="comfortable"
                  @update:model-value="updateEditedItemTiming"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model.number="editedItem.inPerson"
                  label="In-Person Count"
                  type="number"
                  min="0"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model.number="editedItem.zoom"
                  label="Zoom Count"
                  type="number"
                  min="0"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>

              <v-col cols="12">
                <v-text-field
                  :model-value="editedTotal"
                  label="Total (In-Person + Zoom)"
                  variant="filled"
                  density="comfortable"
                  readonly
                  disabled
                />
              </v-col>

              <v-col cols="12">
                <v-checkbox
                  v-model="editedItem.isMemorial"
                  label="Memorial Attendance"
                  color="purple-darken-1"
                  hide-details
                  density="comfortable"
                />
              </v-col>

              <v-col cols="12">
                <v-textarea
                  v-model="editedItem.remarks"
                  label="Remarks"
                  variant="outlined"
                  density="comfortable"
                  rows="2"
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        
        <v-divider />

        <v-card-actions class="pa-3">
          <v-btn v-if="authStore.canDelete" color="error" variant="text" @click="deleteItem(editedItem)">Delete</v-btn>
          <v-spacer />
          <v-btn variant="outlined" @click="closeDialog">Cancel</v-btn>
          <v-btn color="primary" variant="flat" :loading="saving" @click="saveAttendance">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { collection, getDocs, doc, updateDoc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/config/firebase'
import { useAuthStore } from '@/stores/auth'
import { exportToExcel, importFromExcel } from '@/utils/excel'
import { logActivity } from '@/utils/logging'

const authStore = useAuthStore()

const attendance = ref([])
const loading = ref(false)
const saving = ref(false)
const importing = ref(false)
const search = ref('')
const selected = ref([])
const showColumnSelector = ref(false)

const dialog = ref(false)
const editedItem = ref({})
const fileInput = ref(null)

const currentDate = new Date()
let defaultYear = currentDate.getFullYear()
let defaultMonth = currentDate.getMonth()

const selectedMonth = ref(monthsList()[defaultMonth])
const selectedYear = ref(defaultYear)
const selectedMeetingType = ref('All')

function monthsList() {
  return [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
}

const months = monthsList()
const years = Array.from({ length: 12 }, (_, i) => 2024 + i)

const allColumns = [
  { key: 'no', title: "No's" },
  { key: 'date', title: 'Date' },
  { key: 'meetingType', title: 'Meeting Type' },
  { key: 'isMemorial', title: 'Memorial' },
  { key: 'month', title: 'Month' },
  { key: 'year', title: 'Year' },
  { key: 'inPerson', title: 'In-Person' },
  { key: 'zoom', title: 'Zoom' },
  { key: 'total', title: 'Total' },
  { key: 'remarks', title: 'Remarks' }
]

const visibleColumns = ref([
  'no', 'date', 'meetingType', 'isMemorial', 'month', 'year', 'inPerson', 'zoom', 'total', 'remarks'
])

const visibleHeaders = computed(() => {
  return allColumns
    .filter(col => visibleColumns.value.includes(col.key))
    .map(col => ({ ...col, value: col.key, sortable: col.key !== 'actions' && col.key !== 'no' }))
})

const isColumnVisible = (key) => visibleColumns.value.includes(key)

const toggleColumn = (key) => {
  const index = visibleColumns.value.indexOf(key)
  if (index > -1) visibleColumns.value.splice(index, 1)
  else visibleColumns.value.push(key)
}

const loadData = async () => {
  loading.value = true
  try {
    const snap = await getDocs(collection(db, 'meetingAttendance'))
    attendance.value = snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    })).sort((a, b) => (b.date || '').localeCompare(a.date || ''))
  } catch (error) {
    console.error('Error loading meeting attendance:', error)
  } finally {
    loading.value = false
  }
}

const filteredAttendance = computed(() => {
  let list = attendance.value

  if (selectedMonth.value) {
    const mIdx = months.indexOf(selectedMonth.value)
    if (mIdx !== -1) {
      list = list.filter(a => a.month === mIdx)
    }
  }

  if (selectedYear.value) {
    list = list.filter(a => a.year === selectedYear.value)
  }

  if (selectedMeetingType.value && selectedMeetingType.value !== 'All') {
    list = list.filter(a => a.meetingType === selectedMeetingType.value)
  }

  return list
})

const editedTotal = computed(() => {
  const p = Number(editedItem.value.inPerson) || 0
  const z = Number(editedItem.value.zoom) || 0
  return Math.max(0, p + z)
})

const updateEditedItemTiming = (newDateStr) => {
  if (!newDateStr) return
  const parts = newDateStr.split('-')
  const y = parseInt(parts[0])
  const m = parseInt(parts[1]) - 1
  const d = parseInt(parts[2])

  const weekNumber = Math.min(5, Math.ceil(d / 7))
  const suffixes = ['1st', '2nd', '3rd', '4th', '5th']

  editedItem.value.year = y
  editedItem.value.month = m
  editedItem.value.weekNumber = weekNumber
  editedItem.value.weekLabel = `${suffixes[weekNumber - 1]} week`
}

const handleRowClick = (event, { item }) => {
  openEditDialog(item)
}

const originalItem = ref(null)

const openEditDialog = (item) => {
  originalItem.value = { ...item }
  editedItem.value = { ...item, isMemorial: Boolean(item.isMemorial) }
  dialog.value = true
}

const closeDialog = () => {
  dialog.value = false
  editedItem.value = {}
  originalItem.value = null
}

const saveAttendance = async () => {
  saving.value = true
  try {
    const { id, ...data } = editedItem.value
    data.total = editedTotal.value
    data.isMemorial = Boolean(data.isMemorial)

    if (id) {
      await updateDoc(doc(db, 'meetingAttendance', id), data)
      await logActivity(
        authStore,
        'Meeting Attendance Updated',
        `Updated attendance for ${data.meetingType} on ${data.date}`,
        data.month,
        data.year,
        originalItem.value,
        data
      )
    }
    await loadData()
    closeDialog()
  } catch (error) {
    console.error('Error saving attendance:', error)
    alert('Failed to save attendance: ' + error.message)
  } finally {
    saving.value = false
  }
}

const deleteItem = async (item) => {
  if (!authStore.canDelete) return
  if (confirm(`Are you sure you want to delete attendance record for ${item.meetingType} on ${item.date}?`)) {
    try {
      loading.value = true
      await deleteDoc(doc(db, 'meetingAttendance', item.id))
      await logActivity(
        authStore,
        'Meeting Attendance Deleted',
        `Deleted attendance for ${item.meetingType} on ${item.date}`,
        item.month,
        item.year,
        item,
        null
      )
      await loadData()
      if (dialog.value) closeDialog()
    } catch (error) {
      console.error('Error deleting attendance:', error)
      alert('Failed to delete attendance: ' + error.message)
    } finally {
      loading.value = false
    }
  }
}

const deleteSelected = async () => {
  if (!authStore.canDelete) return
  if (confirm(`Delete ${selected.value.length} selected attendance records?`)) {
    try {
      loading.value = true
      const promises = selected.value.map(id => deleteDoc(doc(db, 'meetingAttendance', id)))
      await Promise.all(promises)
      selected.value = []
      await loadData()
    } catch (error) {
      console.error('Error deleting records:', error)
      alert('Failed to delete some records')
    } finally {
      loading.value = false
    }
  }
}

const exportData = () => {
  const excelCols = [
    { title: "No's", key: 'no' },
    { title: 'Date', key: 'date' },
    { title: 'Meeting Type', key: 'meetingType' },
    { title: 'Memorial', key: 'isMemorial' },
    { title: 'Week', key: 'weekLabel' },
    { title: 'Month', key: 'monthName' },
    { title: 'Year', key: 'year' },
    { title: 'In-Person', key: 'inPerson' },
    { title: 'Zoom', key: 'zoom' },
    { title: 'Total', key: 'total' },
    { title: 'Remarks', key: 'remarks' }
  ]

  const dataToExport = filteredAttendance.value.map((a, i) => ({
    no: i + 1,
    date: a.date || '',
    meetingType: a.meetingType || '',
    isMemorial: a.isMemorial ? 'Yes' : 'No',
    weekLabel: a.weekLabel || '',
    monthName: months[a.month] || '',
    year: a.year || '',
    inPerson: a.inPerson || 0,
    zoom: a.zoom || 0,
    total: a.total || (a.inPerson || 0) + (a.zoom || 0),
    remarks: a.remarks || ''
  }))

  exportToExcel(dataToExport, excelCols, 'Meeting_Attendance_List')
}

const triggerFileInput = () => {
  if (!authStore.isAdmin) return
  if (fileInput.value) fileInput.value.click()
}

const handleFileUpload = async (event) => {
  if (!authStore.isAdmin) return
  const file = event.target.files[0]
  if (!file) return

  importing.value = true
  try {
    const excelCols = [
      { title: 'Date', key: 'date' },
      { title: 'Meeting Type', key: 'meetingType' },
      { title: 'In-Person', key: 'inPerson' },
      { title: 'Zoom', key: 'zoom' },
      { title: 'Remarks', key: 'remarks' }
    ]

    const rows = await importFromExcel(file, excelCols)
    let created = 0

    for (const r of rows) {
      if (!r.date) continue
      const dateStr = String(r.date).trim()
      const parts = dateStr.split('-')
      if (parts.length < 3) continue

      const y = parseInt(parts[0])
      const m = parseInt(parts[1]) - 1
      const d = parseInt(parts[2])

      const weekNumber = Math.min(5, Math.ceil(d / 7))
      const suffixes = ['1st', '2nd', '3rd', '4th', '5th']

      const pCount = Number(r.inPerson) || 0
      const zCount = Number(r.zoom) || 0

      await addDoc(collection(db, 'meetingAttendance'), {
        date: dateStr,
        meetingType: r.meetingType || 'Midweek Meeting',
        month: m,
        year: y,
        weekNumber,
        weekLabel: `${suffixes[weekNumber - 1]} week`,
        inPerson: pCount,
        zoom: zCount,
        total: pCount + zCount,
        remarks: r.remarks || '',
        createdAt: serverTimestamp()
      })
      created++
    }

    alert(`Import complete: ${created} attendance records created.`)
    await loadData()
  } catch (error) {
    console.error('Error importing:', error)
    alert('Import failed: ' + error.message)
  } finally {
    importing.value = false
    if (fileInput.value) fileInput.value.value = ''
  }
}

const printTable = () => {
  window.print()
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
@media print {
  .v-btn, .v-text-field, .v-select, .v-chip-group {
    display: none !important;
  }
}
</style>
