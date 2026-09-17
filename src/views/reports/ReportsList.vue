<template>
  <div>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-4">Reports List</h1>
      </v-col>
    </v-row>
    
    <!-- Filter Section -->
    <v-row>
      <v-col cols="12">
        <v-card class="mb-4">
          <v-card-title class="d-flex align-center">
            Filter Reports
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
              <v-col cols="12" md="6">
                <v-select
                  v-model="selectedMonth"
                  :items="months"
                  label="Month"
                  clearable
                />
              </v-col>
              
              <v-col cols="12" md="6">
                <v-select
                  v-model="selectedYear"
                  :items="years"
                  label="Year"
                  clearable
                />
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    
    <!-- Reports Table -->
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex align-center flex-wrap">
            <v-text-field
              v-model="search"
              prepend-inner-icon="mdi-magnify"
              label="Search"
              single-line
              hide-details
              density="compact"
              class="mr-2"
              style="max-width: 300px; min-width: 200px;"
            />
            
            <v-spacer />
            
            <!-- Desktop Actions -->
            <div class="d-none d-md-flex align-center">
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
                class="mr-2"
                :loading="importing"
                :disabled="monthStatus === 'closed'"
              >
                Import
              </v-btn>
              
              <v-btn 
                v-if="authStore.isAdmin"
                color="info" 
                variant="tonal"
                @click="exportData"
                prepend-icon="mdi-export"
                class="mr-2"
              >
                Export
              </v-btn>
              
              <v-btn 
                icon 
                @click="showColumnSelector = !showColumnSelector"
                class="mr-2"
              >
                <v-icon>mdi-view-column</v-icon>
              </v-btn>
              
              <v-btn 
                icon 
                @click="printTable"
              >
                <v-icon>mdi-printer</v-icon>
              </v-btn>
            </div>

            <!-- Mobile Actions Menu -->
            <div class="d-flex d-md-none align-center">
              <v-menu offset-y>
                <template v-slot:activator="{ props }">
                  <v-btn icon v-bind="props" size="small">
                    <v-icon>mdi-dots-vertical</v-icon>
                  </v-btn>
                </template>
                <v-list>
                  <v-list-item v-if="authStore.isAdmin" @click="triggerFileInput" prepend-icon="mdi-import" :disabled="monthStatus === 'closed'">
                    <v-list-item-title>Import</v-list-item-title>
                  </v-list-item>
                  <v-list-item v-if="authStore.isAdmin" @click="exportData" prepend-icon="mdi-export">
                    <v-list-item-title>Export</v-list-item-title>
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

          <v-alert
            v-if="monthStatus === 'closed'"
            type="error"
            variant="tonal"
            density="compact"
            class="mx-4 mb-2 rounded-lg"
            prepend-icon="mdi-lock"
          >
            This month is closed. Editing and importing are disabled.
          </v-alert>
          
          <v-card-text v-if="showColumnSelector">
            <div class="mb-2 text-subtitle-2">Click to toggle column visibility:</div>
            <v-chip-group multiple column>
              <v-chip
                v-for="col in allColumns"
                :key="col.key"
                :color="isColumnVisible(col.key) ? 'primary' : 'grey'"
                :variant="isColumnVisible(col.key) ? 'flat' : 'outlined'"
                @click="toggleColumn(col.key)"
              >
                <v-icon start :icon="isColumnVisible(col.key) ? 'mdi-eye' : 'mdi-eye-off'" />
                {{ col.title }}
              </v-chip>
            </v-chip-group>
          </v-card-text>
          
          <v-data-table
            v-model="selected"
            :headers="visibleHeaders"
            :items="filteredReports"
            :search="search"
            :loading="loading"
            item-value="id"
            :show-select="authStore.canDelete"
            @click:row="handleRowClick"
          >
            <template v-slot:item.no="{ index }">
              {{ index + 1 }}
            </template>
            
            <template v-slot:item.month="{ item }">
              {{ months[item.month] || '-' }}
            </template>
            
            <template v-slot:item.year="{ item }">
              {{ item.year }}
            </template>
            
            <template v-slot:item.sharedInMinistry="{ item }">
              {{ item.sharedInMinistry ? 'Yes' : 'No' }}
            </template>
            
            <template v-slot:item.auxiliaryPioneer="{ item }">
              {{ item.auxiliaryPioneer ? 'Yes' : 'No' }}
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>


    <!-- Edit Dialog -->
    <v-dialog v-model="dialog" max-width="800px">
      <v-card>
        <v-card-title>Edit Report</v-card-title>
        <v-card-text>
          <v-form ref="form" @submit.prevent="saveReport">
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editedItem.publisher"
                  label="Publisher"
                  disabled
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editedItem.group"
                  label="Group"
                  disabled
                />
              </v-col>
              
              <v-col cols="12" md="6">
                <v-checkbox
                  v-model="editedItem.sharedInMinistry"
                  label="Shared in Ministry"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-checkbox
                  v-model="editedItem.auxiliaryPioneer"
                  label="Auxiliary Pioneer"
                  :disabled="editedItem.pioneer === 'Regular Pioneer' || editedItem.pioneer === 'Special Pioneer' || editedItem.pioneer === 'Temporary Special Pioneer'"
                />
              </v-col>
              
              <v-col cols="12" md="6">
                <v-text-field
                  v-model.number="editedItem.hours"
                  label="Hours"
                  type="number"
                  min="0"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model.number="editedItem.studies"
                  label="Studies"
                  type="number"
                  min="0"
                />
              </v-col>
              
              <v-col cols="12">
                <v-textarea
                  v-model="editedItem.comments"
                  label="Comments"
                  rows="3"
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-btn v-if="authStore.canDelete" color="error" @click="deleteReport(editedItem)" :disabled="monthStatus === 'closed'">Delete</v-btn>
          <v-spacer />
          <v-btn @click="closeDialog">Cancel</v-btn>
          <v-btn color="primary" @click="saveReport" :disabled="monthStatus === 'closed'">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { collection, getDocs, doc, getDoc, updateDoc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/config/firebase'
import { useAuthStore } from '@/stores/auth'
import { exportToExcel, importFromExcel } from '@/utils/excel'
import { logActivity } from '@/utils/logging'

const authStore = useAuthStore()

const route = useRoute()
const reports = ref([])
const publishers = ref([])
const groups = ref([])
const loading = ref(false)
const importing = ref(false)
const search = ref('')
const showColumnSelector = ref(false)
const selected = ref([])
const dialog = ref(false)
const editedItem = ref({})
const fileInput = ref(null)

// Default to previous month
const currentDate = new Date()
let defaultYear = currentDate.getFullYear()
let defaultMonth = currentDate.getMonth() - 1 // 0-11 index

// Handle January roll-back
if (defaultMonth < 0) {
  defaultMonth = 11
  defaultYear--
}

// Set initial values - months array is 0-indexed strings, but we store the string name in selectedMonth
// However, the v-select items are strings, so selectedMonth should be the string name
// Wait, the `months` array in this file is just strings ['January', ...].
// If v-select value is the string, we need to pick the name.
const selectedMonth = ref(null) 
const selectedYear = ref(defaultYear)
const monthStatus = ref('open')

// Month options
const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

// Generate year options (2024 to 2035)
const years = Array.from({ length: 12 }, (_, i) => 2024 + i)

// Column configuration
// Column configuration
const allColumns = [
  { key: 'no', title: "No's" },
  { key: 'month', title: 'Month' },
  { key: 'year', title: 'Year' },
  { key: 'publisher', title: 'Publisher' },
  { key: 'group', title: 'Group' },
  { key: 'pioneer', title: 'Pioneer' },
  { key: 'sharedInMinistry', title: 'Shared in Ministry' },
  { key: 'auxiliaryPioneer', title: 'Auxiliary Pioneer' },
  { key: 'hours', title: 'Hours' },
  { key: 'studies', title: 'Studies' },
  { key: 'comments', title: 'Comments' }
]

const visibleColumns = ref(['no', 'month', 'year', 'publisher', 'group', 'pioneer', 'sharedInMinistry', 'auxiliaryPioneer', 'hours', 'studies', 'comments'])

const visibleHeaders = computed(() => {
  return allColumns
    .filter(col => visibleColumns.value.includes(col.key))
    .map(col => ({ ...col, value: col.key }))
})

const isColumnVisible = (key) => visibleColumns.value.includes(key)

const toggleColumn = (key) => {
  const index = visibleColumns.value.indexOf(key)
  if (index > -1) {
    visibleColumns.value.splice(index, 1)
  } else {
    visibleColumns.value.push(key)
  }
}

// Format month display - No longer used for combined display but keeping helper if needed
/* const formatMonth = (month, year) => {
  if (!month || !year) return '-'
  return `${months[month - 1]}-${year}`
} */

// Load data
const loadData = async () => {
  loading.value = true
  try {
    // Load reports
    const reportsSnapshot = await getDocs(collection(db, 'reports'))
    const reportsData = reportsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    
    // Load publishers
    const publishersSnapshot = await getDocs(collection(db, 'publishers'))
    publishers.value = publishersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    
    // Load groups
    const groupsSnapshot = await getDocs(collection(db, 'groups'))
    groups.value = groupsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    
    // Enrich reports with publisher and group names
    reports.value = reportsData.reduce((acc, report) => {
      const publisher = publishers.value.find(p => p.id === report.publisherId)
      const group = groups.value.find(g => g.id === publisher?.groupId)
      
      if (authStore.isEditor && authStore.userSpiritualRole !== 'Elder') {
        if (!authStore.userGroupId || publisher?.groupId !== authStore.userGroupId) {
          return acc
        }
      }
      
      // Determine pioneer type
      let pioneer = 'None'
      if (publisher?.pioneerType === 'RP') pioneer = 'Regular Pioneer'
      else if (publisher?.pioneerType === 'SP') pioneer = 'Special Pioneer'
      else if (publisher?.pioneerType === 'TSP') pioneer = 'Temporary Special Pioneer'
      
      acc.push({
        ...report,
        publisher: publisher?.name || 'Unknown',
        group: group?.name || 'No Group',
        pioneer
      })
      return acc
    }, [])

    await loadMonthStatus()
  } catch (error) {
    console.error('Error loading data:', error)
  } finally {
    loading.value = false
  }
}

const loadMonthStatus = async () => {
  if (!selectedMonth.value || !selectedYear.value) return
  const monthIdx = months.indexOf(selectedMonth.value)
  const statusId = `${selectedYear.value}-${String(monthIdx + 1).padStart(2, '0')}`
  try {
    const docRef = doc(db, 'monthStatus', statusId)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      monthStatus.value = docSnap.data().status
    } else {
      monthStatus.value = 'open'
    }
  } catch (error) {
    console.error('Error loading month status:', error)
  }
}

// Filtered reports based on month/year selection and route query
const filteredReports = computed(() => {
  let filtered = reports.value
  
  // Apply month filter
  if (selectedMonth.value) {
    const monthIndex = months.indexOf(selectedMonth.value) // 0-based index to match Firestore
    filtered = filtered.filter(r => r.month === monthIndex)
  }
  
  // Apply year filter
  if (selectedYear.value) {
    filtered = filtered.filter(r => r.year === selectedYear.value)
  }
  
  // Apply route query filters (from Reports Overview clicks)
  if (route.query.pioneer) {
    filtered = filtered.filter(r => r.pioneer === route.query.pioneer)
  }
  
  if (route.query.auxiliaryPioneer === 'true') {
    filtered = filtered.filter(r => r.auxiliaryPioneer === true)
  }
  
  if (route.query.category === 'publisher') {
    // Show only publishers who are NOT regular pioneers
    filtered = filtered.filter(r => {
      const publisher = publishers.value.find(p => p.id === r.publisherId)
      if (!publisher) return false
      if (publisher.pioneerType === 'RP') return false
      if (r.auxiliaryPioneer) return false
      return true
    })
  }
  
  // Shared in Ministry filter
  if (route.query.shared === 'true') {
    filtered = filtered.filter(r => {
      const publisher = publishers.value.find(p => p.id === r.publisherId)
      if (!publisher) return false
      if (publisher.pioneerType === 'RP') return false
      if (r.auxiliaryPioneer) return false
      return r.sharedInMinistry === true
    })
  } else if (route.query.shared === 'false') {
    filtered = filtered.filter(r => {
      const publisher = publishers.value.find(p => p.id === r.publisherId)
      if (!publisher) return false
      if (publisher.pioneerType === 'RP') return false
      if (r.auxiliaryPioneer) return false
      return !r.sharedInMinistry
    })
  }
  
  // Has Studies filter (studies > 0)
  if (route.query.hasStudies === 'true') {
    filtered = filtered.filter(r => (r.studies || 0) > 0)
  }
  
  return filtered
})

const handleRowClick = (event, { item }) => {
  if (authStore.isAdmin) {
    editedItem.value = { ...item }
    dialog.value = true
    openEditDialog(item)
  }
}

const closeDialog = () => {
  dialog.value = false
  editedItem.value = {}
  originalReportItem.value = null
}

const saveReport = async () => {
  if (monthStatus.value === 'closed') {
    alert('This month is closed and cannot be edited.')
    return
  }
  try {
    loading.value = true
    const { id, publisher, group, pioneer, no, ...data } = editedItem.value
    await updateDoc(doc(db, 'reports', id), data)
    await logActivity(
      authStore,
      'Report Updated',
      `Updated report for ${publisher} (${months[editedItem.value.month]} ${editedItem.value.year}) via List`,
      editedItem.value.month,
      editedItem.value.year,
      originalReportItem.value,
      editedItem.value
    )
    await loadData()
    closeDialog()
  } catch (error) {
    console.error('Error saving report:', error)
    alert('Failed to save report')
  } finally {
    loading.value = false
  }
}

const deleteReport = async (item) => {
  if (!authStore.canDelete) return
  if (monthStatus.value === 'closed') {
    alert('This month is closed and cannot be edited.')
    return
  }
  if (confirm('Are you sure you want to delete this report?')) {
    try {
      loading.value = true
      await deleteDoc(doc(db, 'reports', item.id))
      await logActivity(
        authStore,
        'Report Deleted',
        `Deleted report for ${item.publisher} (${months[item.month]} ${item.year})`,
        item.month,
        item.year,
        item,
        null
      )
      await loadData()
      closeDialog()
    } catch (error) {
      console.error('Error deleting report:', error)
      alert('Failed to delete report')
    } finally {
      loading.value = false
    }
  }
}

const deleteSelected = async () => {
  if (!authStore.canDelete) return
  if (confirm(`Delete ${selected.value.length} selected reports?`)) {
    try {
      loading.value = true
      const promises = selected.value.map(id => deleteDoc(doc(db, 'reports', id)))
      await Promise.all(promises)
      selected.value = []
      await loadData()
    } catch (error) {
      console.error('Error deleting reports:', error)
      alert('Failed to delete some reports')
    } finally {
      loading.value = false
    }
  }
}

const triggerFileInput = () => {
  fileInput.value.click()
}

const exportData = () => {
  const data = filteredReports.value.map((r, i) => ({
    'No': i + 1,
    'Month': months[r.month] || r.month,
    'Year': r.year,
    'Publisher': r.publisher,
    'Group': r.group,
    'Pioneer': r.pioneer,
    'Shared in Ministry': r.sharedInMinistry ? 'Yes' : 'No',
    'Auxiliary Pioneer': r.auxiliaryPioneer ? 'Yes' : 'No',
    'Hours': r.hours || 0,
    'Studies': r.studies || 0,
    'Comments': r.comments || ''
  }))
  
  const monthName = selectedMonth.value || 'All'
  const yearLabel = selectedYear.value || 'All'
  exportToExcel(data, `Reports_${monthName}_${yearLabel}`)
}

const handleFileUpload = async (event) => {
  if (monthStatus.value === 'closed') {
    alert('This month is closed and cannot be imported to.')
    return
  }
  const file = event.target.files[0]
  if (!file) return
  
  importing.value = true
  try {
    const data = await importFromExcel(file)
    let created = 0
    let updated = 0
    
    for (const row of data) {
      const publisherName = row['Publisher']?.trim()
      if (!publisherName) continue
      
      const publisher = publishers.value.find(p => 
        p.name?.toLowerCase() === publisherName.toLowerCase()
      )
      if (!publisher) continue
      
      // Parse month
      let monthIndex = null
      const monthStr = String(row['Month'] || '').trim()
      const monthNum = parseInt(monthStr)
      if (!isNaN(monthNum) && monthNum >= 1 && monthNum <= 12) {
        monthIndex = monthNum - 1
      } else {
        monthIndex = months.findIndex(m => m.toLowerCase() === monthStr.toLowerCase())
      }
      if (monthIndex < 0) continue
      
      const year = parseInt(row['Year'])
      if (!year) continue
      
      const reportData = {
        publisherId: publisher.id,
        month: monthIndex,
        year: year,
        sharedInMinistry: String(row['Shared in Ministry'] || '').toLowerCase() === 'yes',
        auxiliaryPioneer: String(row['Auxiliary Pioneer'] || '').toLowerCase() === 'yes',
        hours: parseFloat(row['Hours']) || 0,
        studies: parseInt(row['Studies']) || 0,
        comments: row['Comments'] || ''
      }
      
      // Check for existing report
      const existing = reports.value.find(r => 
        r.publisherId === publisher.id && r.month === monthIndex && r.year === year
      )
      
      if (existing) {
        await updateDoc(doc(db, 'reports', existing.id), reportData)
        updated++
      } else {
        await addDoc(collection(db, 'reports'), {
          ...reportData,
          createdAt: serverTimestamp()
        })
        created++
      }
    }
    
    alert(`Import complete: ${created} created, ${updated} updated`)
    await logActivity(authStore, 'Reports Imported', `Imported ${created} new and ${updated} updated reports via Excel`, months.indexOf(selectedMonth.value), selectedYear.value)
    await loadData()
  } catch (error) {
    console.error('Error importing:', error)
    alert('Import failed: ' + error.message)
  } finally {
    importing.value = false
    fileInput.value.value = ''
  }
}

const printTable = () => {
  window.print()
}

onMounted(() => {
  loadData()
  
  // Set filters from route query if present
  // Set filters from route query if present, otherwise default
  if (route.query.month) {
    selectedMonth.value = months[parseInt(route.query.month) - 1]
  } else {
    selectedMonth.value = months[defaultMonth]
  }
  
  if (route.query.year) {
    selectedYear.value = parseInt(route.query.year)
  } else {
    selectedYear.value = defaultYear
  }
})

// Watch for filter changes to update month lock status
watch([selectedMonth, selectedYear], () => {
  loadMonthStatus()
})
</script>

<style scoped>
@media print {
  .v-btn, .v-text-field, .v-chip-group, .v-select {
    display: none !important;
  }
}
</style>
