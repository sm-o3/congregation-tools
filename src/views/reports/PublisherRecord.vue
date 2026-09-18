<template>
  <div class="publisher-record-container">
    <!-- Header Controls (Hidden on Print) -->
    <div class="d-print-none">
      <!-- Row 1: Selectors & Filters -->
      <v-row class="mb-3" justify="center">
        <v-col cols="12" sm="6" md="3">
          <v-select
            v-model="selectedServiceYear"
            :items="serviceYears"
            label="Service Year"
            variant="outlined"
            density="compact"
            hide-details
            @update:model-value="loadPublisherData"
          />
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-select
            v-model="filterMode"
            :items="filterOptions"
            item-title="title"
            item-value="value"
            label="Filter"
            variant="outlined"
            density="compact"
            hide-details
          />
        </v-col>
        <v-col v-if="filterMode === 'By Group'" cols="12" sm="6" md="3">
          <v-select
            v-model="selectedGroupId"
            :items="groups"
            item-title="name"
            item-value="id"
            label="Select Group"
            variant="outlined"
            density="compact"
            hide-details
            clearable
          />
        </v-col>
        <v-col cols="12" sm="6" :md="filterMode === 'By Group' ? 3 : 6">
          <v-select
            v-model="selectedPublisherId"
            :items="filteredPublishers"
            item-title="name"
            item-value="id"
            label="Select Publisher"
            variant="outlined"
            density="compact"
            hide-details
            @update:model-value="loadPublisherData"
          />
        </v-col>
      </v-row>

      <!-- Row 2: Action Buttons -->
      <v-row class="mb-4" justify="center">
        <v-col cols="12" class="d-flex justify-center gap-3">
          <v-btn
            v-if="authStore.isAdmin"
            color="success"
            variant="flat"
            prepend-icon="mdi-folder-zip-outline"
            :loading="bulkDownloading"
            :disabled="filteredPublishers.length === 0"
            @click="downloadBulkPdf"
          >
            Bulk ZIP
          </v-btn>
          <v-btn
            color="secondary"
            variant="flat"
            prepend-icon="mdi-download"
            :loading="downloading"
            :disabled="!selectedPublisher"
            @click="downloadPdf"
          >
            Download PDF
          </v-btn>
        </v-col>
      </v-row>
    </div>

    <!-- Empty State -->
    <v-row v-if="!selectedPublisher" justify="center" class="d-print-none mt-8">
      <v-col cols="12" class="text-center">
        <v-icon size="64" color="grey-lighten-1">mdi-card-account-details-outline</v-icon>
        <p class="text-h6 text-grey mt-4">Select a service year and publisher to view their S-21 record</p>
      </v-col>
    </v-row>

    <!-- S-21 Card Replica (Visible on screen and specifically styled for Print) -->
    <div v-if="selectedPublisher" class="mt-4">
      <!-- Mobile scroll hint -->
      <div class="d-flex align-center justify-center text-caption text-medium-emphasis mb-2 d-md-none d-print-none">
        <v-icon size="16" class="mr-1">mdi-arrow-left-right</v-icon>
        <span>Swipe horizontally to view full record</span>
      </div>

      <div class="s21-card-wrapper">
        <div class="s21-card">

        <!-- Card Header with Edit/Save Button -->
        <div class="s21-header-row d-print-none">
          <div class="s21-header">CONGREGATION'S PUBLISHER RECORD</div>
          <div v-if="authStore.canEditPublisherRecord" class="s21-edit-btn-wrap">
            <v-btn
              v-if="!editMode"
              icon
              size="small"
              color="primary"
              variant="tonal"
              @click="startEdit"
              title="Edit Record"
            >
              <v-icon>mdi-pencil</v-icon>
            </v-btn>
            <template v-else>
              <v-btn
                size="small"
                color="success"
                variant="flat"
                prepend-icon="mdi-content-save"
                :loading="saving"
                @click="saveRecord"
                class="mr-1"
              >
                Save
              </v-btn>
              <v-btn
                size="small"
                color="grey"
                variant="tonal"
                @click="cancelEdit"
              >
                Cancel
              </v-btn>
            </template>
          </div>
        </div>

        <!-- Print-only header (no buttons) -->
        <div class="s21-header d-none d-print-block">CONGREGATION'S PUBLISHER RECORD</div>

        <div class="s21-info-section">
          <!-- Name Row -->
          <div class="s21-info-row">
            <span class="s21-label" style="width: 50px;">Name:</span>
            <span v-if="!editMode" class="s21-value name-value">{{ publisherNameDisplay }}</span>
            <input
              v-else
              type="text"
              v-model="editForm.name"
              class="s21-name-input"
              placeholder="Publisher Name"
            />
          </div>

          <div class="s21-info-row d-flex justify-space-between align-end">
            <!-- Dates -->
            <div class="s21-dates">
              <div class="s21-date-row">
                <span class="s21-label" style="width: 90px;">Date of birth:</span>
                <span v-if="!editMode" class="s21-value date-value">{{ selectedPublisher.dob || '' }}</span>
                <input
                  v-else
                  type="date"
                  v-model="editForm.dob"
                  class="s21-date-input"
                />
              </div>
              <div class="s21-date-row mt-1">
                <span class="s21-label" style="width: 105px;">Date of baptism:</span>
                <span v-if="!editMode" class="s21-value date-value">{{ selectedPublisher.baptismDate || '' }}</span>
                <input
                  v-else
                  type="date"
                  v-model="editForm.baptismDate"
                  class="s21-date-input"
                />
              </div>
            </div>

            <!-- Gender / Hope checkboxes -->
            <div class="s21-checkboxes-right">
              <div v-if="!editMode" class="s21-cb-row">
                <label class="s21-cb-label"><input type="checkbox" :checked="selectedPublisher.gender === 'Male'" disabled> Male</label>
                <label class="s21-cb-label"><input type="checkbox" :checked="selectedPublisher.gender === 'Female'" disabled> Female</label>
              </div>
              <div v-else class="s21-cb-row">
                <label class="s21-cb-label">
                  <input type="checkbox" :checked="editForm.gender === 'Male'" @change="editForm.gender = 'Male'"> Male
                </label>
                <label class="s21-cb-label">
                  <input type="checkbox" :checked="editForm.gender === 'Female'" @change="editForm.gender = 'Female'"> Female
                </label>
              </div>

              <div v-if="!editMode" class="s21-cb-row mt-1">
                <label class="s21-cb-label"><input type="checkbox" :checked="selectedPublisher.hope !== 'Anointed'" disabled> Other sheep</label>
                <label class="s21-cb-label"><input type="checkbox" :checked="selectedPublisher.hope === 'Anointed'" disabled> Anointed</label>
              </div>
              <div v-else class="s21-cb-row mt-1">
                <label class="s21-cb-label">
                  <input type="checkbox" :checked="editForm.hope !== 'Anointed'" @change="editForm.hope = 'Other Sheep'"> Other sheep
                </label>
                <label class="s21-cb-label">
                  <input type="checkbox" :checked="editForm.hope === 'Anointed'" @change="editForm.hope = 'Anointed'"> Anointed
                </label>
              </div>
            </div>
          </div>

          <!-- Roles row -->
          <div v-if="!editMode" class="s21-roles-row mt-2">
            <label class="s21-cb-label"><input type="checkbox" :checked="selectedPublisher.role === 'Elder'" disabled> Elder</label>
            <label class="s21-cb-label"><input type="checkbox" :checked="selectedPublisher.role === 'Ministerial Servant'" disabled> Ministerial servant</label>
            <label class="s21-cb-label"><input type="checkbox" :checked="selectedPublisher.pioneerType === 'RP'" disabled> Regular pioneer</label>
            <label class="s21-cb-label"><input type="checkbox" :checked="selectedPublisher.pioneerType === 'SP'" disabled> Special pioneer</label>
            <label class="s21-cb-label"><input type="checkbox" :checked="selectedPublisher.pioneerType === 'Field Missionary' || selectedPublisher.fieldMissionary" disabled> Field missionary</label>
          </div>
          <div v-else class="s21-roles-row mt-2">
            <label class="s21-cb-label">
              <input type="checkbox" :checked="editForm.role === 'Elder'" @change="editForm.role = editForm.role === 'Elder' ? 'Publisher' : 'Elder'"> Elder
            </label>
            <label class="s21-cb-label">
              <input type="checkbox" :checked="editForm.role === 'Ministerial Servant'" @change="editForm.role = editForm.role === 'Ministerial Servant' ? 'Publisher' : 'Ministerial Servant'"> Ministerial servant
            </label>
            <label class="s21-cb-label">
              <input type="checkbox" :checked="editForm.pioneerType === 'RP'" @change="editForm.pioneerType = editForm.pioneerType === 'RP' ? null : 'RP'"> Regular pioneer
            </label>
            <label class="s21-cb-label">
              <input type="checkbox" :checked="editForm.pioneerType === 'SP'" @change="editForm.pioneerType = editForm.pioneerType === 'SP' ? null : 'SP'"> Special pioneer
            </label>
            <label class="s21-cb-label">
              <input type="checkbox" :checked="editForm.pioneerType === 'Field Missionary'" @change="editForm.pioneerType = editForm.pioneerType === 'Field Missionary' ? null : 'Field Missionary'"> Field missionary
            </label>
          </div>
        </div>

        <!-- Monthly table -->
        <table class="s21-table mt-1">
          <thead>
            <tr>
              <th rowspan="2" class="s-year-col">Service Year<br><span style="font-weight: normal">{{ selectedServiceYear - 1 }}-{{ selectedServiceYear }}</span></th>
              <th class="s-shared-col">Shared in<br>Ministry</th>
              <th class="s-studies-col">Bible<br>Studies</th>
              <th class="s-aux-col">Auxiliary<br>Pioneer</th>
              <th class="s-hours-col">Hours<br><span style="font-size:9px; font-weight:normal;">(If pioneer<br>or field<br>missionary)</span></th>
              <th class="s-remarks-col">Remarks</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="month in serviceYearMonths" :key="month.value">
              <td class="text-left" style="padding-left:4px;">{{ month.name }}</td>

              <!-- Shared in Ministry -->
              <td class="text-center">
                <template v-if="!editMode">
                  <input type="checkbox" :checked="getMonthData(month.value, 'sharedInMinistry')" disabled v-if="hasReport(month.value)">
                </template>
                <template v-else>
                  <input type="checkbox" v-model="editMonthRows[month.value].sharedInMinistry">
                </template>
              </td>

              <!-- Bible Studies -->
              <td class="text-center">
                <template v-if="!editMode">{{ getMonthData(month.value, 'studies') || '' }}</template>
                <template v-else>
                  <input
                    type="number"
                    v-model.number="editMonthRows[month.value].studies"
                    class="s21-inline-input"
                    min="0"
                    style="width: 36px;"
                  >
                </template>
              </td>

              <!-- Auxiliary Pioneer -->
              <td class="text-center">
                <template v-if="!editMode">
                  <input type="checkbox" :checked="getMonthData(month.value, 'auxiliaryPioneer')" disabled v-if="hasReport(month.value) && getMonthData(month.value, 'auxiliaryPioneer')">
                </template>
                <template v-else>
                  <input type="checkbox" v-model="editMonthRows[month.value].auxiliaryPioneer">
                </template>
              </td>

              <!-- Hours -->
              <td class="text-center">
                <template v-if="!editMode">{{ getMonthData(month.value, 'hours') || '' }}</template>
                <template v-else>
                  <input
                    type="number"
                    v-model.number="editMonthRows[month.value].hours"
                    class="s21-inline-input"
                    min="0"
                    style="width: 44px;"
                  >
                </template>
              </td>

              <!-- Remarks -->
              <td class="text-left" style="padding-left:4px;">
                <template v-if="!editMode">{{ getMonthData(month.value, 'comments') || '' }}</template>
                <template v-else>
                  <input
                    type="text"
                    v-model="editMonthRows[month.value].comments"
                    class="s21-inline-input"
                    style="width: 100%; box-sizing: border-box;"
                  >
                </template>
              </td>
            </tr>

            <tr class="s21-total-row">
              <td colspan="4" class="text-right" style="padding-right: 6px;">Total</td>
              <td class="text-center">{{ editMode ? editTotalHours || '' : totals.hours || '' }}</td>
              <td></td>
            </tr>
          </tbody>
        </table>

        <div class="s21-footer mt-1" style="font-size: 8px;">
          S-21-E 11/23
        </div>
      </div>
    </div>
  </div>

    <!-- Save Success Snackbar -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000" location="top">
      {{ snackbar.text }}
    </v-snackbar>

    <!-- Bulk Download Progress Dialog -->
    <v-dialog v-model="bulkDownloading" persistent max-width="400">
      <v-card class="pa-4 rounded-xl text-center">
        <v-card-text>
          <div class="text-h6 mb-4 font-weight-bold text-primary">Generating PDF ZIP Package</div>
          <v-progress-circular
            :model-value="bulkProgress.total ? (bulkProgress.current / bulkProgress.total) * 100 : 0"
            :size="80"
            :width="8"
            color="primary"
            class="mb-4"
          >
            <span class="font-weight-bold">{{ bulkProgress.current }}/{{ bulkProgress.total }}</span>
          </v-progress-circular>
          <div class="text-body-2 text-medium-emphasis">{{ bulkProgress.text }}</div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { collection, getDocs, query, where, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/config/firebase'
import { useAuthStore } from '@/stores/auth'
import { PDFDocument } from 'pdf-lib'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'

const authStore = useAuthStore()

const selectedServiceYear = ref(new Date().getFullYear())
const selectedPublisherId = ref(null)
const selectedPublisher = ref(null)
const publishers = ref([])
const reports = ref([])
const groups = ref([])
const loading = ref(false)
const downloading = ref(false)
const bulkDownloading = ref(false)
const bulkProgress = ref({ current: 0, total: 0, text: '' })
const saving = ref(false)

// Filter selector state
const filterMode = ref('ALL') // 'ALL', 'RP Only', 'By Group'
const selectedGroupId = ref(null)

const filterOptions = [
  { title: 'ALL', value: 'ALL' },
  { title: 'RP Only', value: 'RP Only' },
  { title: 'By Group', value: 'By Group' }
]

// Edit mode state
const editMode = ref(false)
const editForm = ref({})
const editMonthRows = ref({})

// Snackbar
const snackbar = ref({ show: false, text: '', color: 'success' })

// Service years from 2024 to 2035
const serviceYears = Array.from({ length: 12 }, (_, i) => 2024 + i)

// Month configuration for S-21 (September -> August)
const serviceYearMonths = [
  { name: 'September', value: 8 },
  { name: 'October', value: 9 },
  { name: 'November', value: 10 },
  { name: 'December', value: 11 },
  { name: 'January', value: 0 },
  { name: 'February', value: 1 },
  { name: 'March', value: 2 },
  { name: 'April', value: 3 },
  { name: 'May', value: 4 },
  { name: 'June', value: 5 },
  { name: 'July', value: 6 },
  { name: 'August', value: 7 }
]

const publisherNameDisplay = computed(() => {
  if (!selectedPublisher.value) return ''
  const p = selectedPublisher.value
  
  let result = p.name || ''
  
  if (p.address && p.address.trim() !== '') {
    result += ` (${p.address.trim()})`
  }
  
  const phones = []
  if (p.mobile && p.mobile.trim() !== '') phones.push(p.mobile.trim())
  if (p.alternateMobile && p.alternateMobile.trim() !== '') phones.push(p.alternateMobile.trim())
  
  if (phones.length > 0) {
    result += ` (Mob: ${phones.join(',')})`
  }
  
  return result
})

// Helper for PDF file name formatting: Suffixes ' (RP)' for Regular Pioneers
const getPublisherPdfFileName = (pub) => {
  if (!pub) return ''
  const roles = []
  if (pub.role === 'Elder') roles.push('Elder')
  if (pub.role === 'Ministerial Servant') roles.push('MS')
  if (pub.pioneerType === 'RP') roles.push('RP')
  else if (pub.pioneerType === 'SP') roles.push('SP')
  else if (pub.pioneerType === 'Field Missionary') roles.push('FM')
  
  const roleStr = roles.length > 0 ? ` (${roles.join(', ')})` : ''
  return `${pub.name}${roleStr}`
}

// Filtered publishers array applying Editor restrictions & Filter Mode
const filteredPublishers = computed(() => {
  let list = publishers.value
  if (authStore.isEditor && authStore.userGroupId) {
    list = list.filter(p => p.groupId === authStore.userGroupId)
  }
  if (filterMode.value === 'RP Only') {
    list = list.filter(p => p.pioneerType === 'RP')
  } else if (filterMode.value === 'By Group' && selectedGroupId.value) {
    list = list.filter(p => p.groupId === selectedGroupId.value)
  }
  return list
})

watch(filteredPublishers, (newList) => {
  if (selectedPublisherId.value && !newList.some(p => p.id === selectedPublisherId.value)) {
    selectedPublisherId.value = null
    selectedPublisher.value = null
  }
})

watch(filterMode, (newVal) => {
  if (newVal !== 'By Group') {
    selectedGroupId.value = null
  }
})

const getMonthData = (monthIndex, field) => {
  const monthReport = reports.value.find(r => Number(r.month) === Number(monthIndex))
  if (!monthReport) return null
  if (field === 'sharedInMinistry' || field === 'auxiliaryPioneer') {
    const val = monthReport[field]
    return val === true || val === 'YES' || val === 'true'
  }
  return monthReport[field]
}

const hasReport = (monthIndex) => {
  return reports.value.some(r => Number(r.month) === Number(monthIndex))
}

const totals = computed(() => {
  return {
    hours: reports.value.reduce((sum, r) => sum + (Number(r.hours) || 0), 0)
  }
})

const editTotalHours = computed(() => {
  return serviceYearMonths.reduce((sum, m) => {
    const h = editMonthRows.value[m.value]?.hours
    return sum + (Number(h) || 0)
  }, 0)
})

const loadPublishers = async () => {
  try {
    const snapshot = await getDocs(collection(db, 'publishers'))
    publishers.value = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(p => p.role !== 'Removed')
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
  } catch (error) {
    console.error('Error loading publishers:', error)
  }
}

const loadGroups = async () => {
  try {
    const snapshot = await getDocs(collection(db, 'groups'))
    groups.value = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
  } catch (error) {
    console.error('Error loading groups:', error)
  }
}

const loadPublisherData = async () => {
  if (!selectedPublisherId.value) return
  
  loading.value = true
  editMode.value = false
  try {
    selectedPublisher.value = publishers.value.find(p => p.id === selectedPublisherId.value)
    
    const sy = Number(selectedServiceYear.value)
    const startYear = sy - 1
    const endYear = sy
    
    const reportsSnapshot = await getDocs(query(collection(db, 'reports'), where('publisherId', '==', selectedPublisherId.value)))
    
    reports.value = reportsSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(r => {
        const rYear = Number(r.year)
        const rMonth = Number(r.month)
        return (rYear === startYear && rMonth >= 8) || (rYear === endYear && rMonth <= 7)
      })
  } catch (error) {
    console.error('Error loading publisher data:', error)
  } finally {
    loading.value = false
  }
}

// --- Edit Mode ---
const startEdit = () => {
  if (!authStore.canEditPublisherRecord) return
  if (!selectedPublisher.value) return
  const p = selectedPublisher.value
  editForm.value = {
    name: p.name || '',
    dob: p.dob || '',
    baptismDate: p.baptismDate || '',
    gender: p.gender || 'Male',
    hope: p.hope || 'Other Sheep',
    role: p.role || 'Publisher',
    pioneerType: p.pioneerType || null
  }

  // Build per-month edit rows from existing report data
  const rows = {}
  serviceYearMonths.forEach(m => {
    const r = reports.value.find(x => Number(x.month) === Number(m.value))
    rows[m.value] = {
      reportId: r?.id || null,
      sharedInMinistry: Boolean(r?.sharedInMinistry === true || r?.sharedInMinistry === 'YES' || r?.sharedInMinistry === 'true'),
      studies: r?.studies !== undefined && r?.studies !== null ? r.studies : '',
      auxiliaryPioneer: Boolean(r?.auxiliaryPioneer === true || r?.auxiliaryPioneer === 'YES' || r?.auxiliaryPioneer === 'true'),
      hours: r?.hours !== undefined && r?.hours !== null ? r.hours : '',
      comments: r?.comments || ''
    }
  })
  editMonthRows.value = rows
  editMode.value = true
}

const cancelEdit = () => {
  editMode.value = false
}

const saveRecord = async () => {
  if (!authStore.canEditPublisherRecord) return
  saving.value = true
  try {
    const pubId = selectedPublisherId.value
    const startYear = selectedServiceYear.value - 1
    const endYear = selectedServiceYear.value

    // 1. Update publisher document
    const { name, dob, baptismDate, gender, hope, role, pioneerType } = editForm.value
    await updateDoc(doc(db, 'publishers', pubId), {
      name,
      dob,
      baptismDate,
      gender,
      hope,
      role,
      pioneerType: pioneerType || null,
      updatedAt: serverTimestamp()
    })

    // 2. Upsert monthly reports
    for (const monthObj of serviceYearMonths) {
      const mIdx = monthObj.value
      const row = editMonthRows.value[mIdx]

      // Determine which calendar year this month belongs to in this service year
      const calYear = mIdx >= 8 ? startYear : endYear

      const reportData = {
        publisherId: pubId,
        month: mIdx,
        year: calYear,
        sharedInMinistry: row.sharedInMinistry ? 'YES' : 'NO',
        studies: Number(row.studies) || 0,
        auxiliaryPioneer: row.auxiliaryPioneer ? 'YES' : 'NO',
        hours: Number(row.hours) || 0,
        comments: row.comments || ''
      }

      if (row.reportId) {
        // Update existing
        await updateDoc(doc(db, 'reports', row.reportId), reportData)
      } else {
        // Only create if there's any meaningful data
        const hasData = row.sharedInMinistry || row.auxiliaryPioneer ||
          Number(row.studies) > 0 || Number(row.hours) > 0 || row.comments.trim()
        if (hasData) {
          await addDoc(collection(db, 'reports'), {
            ...reportData,
            createdAt: serverTimestamp()
          })
        }
      }
    }

    // 3. Refresh data
    await loadPublishers()
    await loadPublisherData()

    editMode.value = false
    snackbar.value = { show: true, text: 'Record saved successfully!', color: 'success' }
  } catch (err) {
    console.error('Error saving record:', err)
    snackbar.value = { show: true, text: 'Failed to save. Please try again.', color: 'error' }
  } finally {
    saving.value = false
  }
}

const printCard = () => {
  window.print()
}

// Map logical month index to S-21 AcroForm Row Number.
// S-21 rows go from 20 (top) to 31 (bottom), matching Sep to Aug.
const acroFormRowMap = {
  8: 20, 9: 21, 10: 22, 11: 23, 
  0: 24, 1: 25, 2: 26, 3: 27, 
  4: 28, 5: 29, 6: 30, 7: 31
}

const fillS21Pdf = async (publisher, publisherReports, templateBytes) => {
  const pdfDoc = await PDFDocument.load(templateBytes)
  const form = pdfDoc.getForm()
  
  const startYear = selectedServiceYear.value - 1
  const endYear = selectedServiceYear.value
  
  // Name formatter
  let nameDisplay = publisher.name || ''
  if (publisher.address && publisher.address.trim() !== '') nameDisplay += ` (${publisher.address.trim()})`
  const phones = []
  if (publisher.mobile && publisher.mobile.trim() !== '') phones.push(publisher.mobile.trim())
  if (publisher.alternateMobile && publisher.alternateMobile.trim() !== '') phones.push(publisher.alternateMobile.trim())
  if (phones.length > 0) nameDisplay += ` (Mob: ${phones.join(',')})`

  // Fill Publisher Info fields
  try { form.getTextField('name').setText(nameDisplay) } catch(e){}
  try { form.getTextField('dob').setText(publisher.dob || '') } catch(e){}
  try { form.getTextField('dobp').setText(publisher.baptismDate || '') } catch(e){}
  try { form.getTextField('service_year').setText(`${startYear}-${endYear}`) } catch(e){}
  
  // Fill Checkboxes
  if (publisher.gender === 'Male') { try { form.getCheckBox('male').check() } catch(e){} }
  if (publisher.gender === 'Female') { try { form.getCheckBox('female').check() } catch(e){} }
  if (publisher.hope !== 'Anointed') { try { form.getCheckBox('os').check() } catch(e){} }
  if (publisher.hope === 'Anointed') { try { form.getCheckBox('a').check() } catch(e){} }
  
  if (publisher.role === 'Elder') { try { form.getCheckBox('elder').check() } catch(e){} }
  if (publisher.role === 'Ministerial Servant') { try { form.getCheckBox('ms').check() } catch(e){} }
  if (publisher.pioneerType === 'RP') { try { form.getCheckBox('rp').check() } catch(e){} }
  if (publisher.pioneerType === 'SP') { try { form.getCheckBox('sp').check() } catch(e){} }
  if (publisher.pioneerType === 'Field Missionary') { try { form.getCheckBox('fm').check() } catch(e){} }
  
  // Fill Month Rows
  serviceYearMonths.forEach(monthObj => {
    const monthIdx = monthObj.value
    // Find report for this specific month within the service year boundaries
    const r = publisherReports.find(x => x.month === monthIdx && 
              ( (x.year === startYear && monthIdx >= 8) || (x.year === endYear && monthIdx <= 7) ) )
    
    if (r) {
      const row = acroFormRowMap[monthIdx]
      if (r.sharedInMinistry) { try { form.getCheckBox(`901_${row}_CheckBox`).check() } catch(e){} }
      if (r.studies) { try { form.getTextField(`902_${row}_Text_C_SanSerif`).setText(r.studies.toString()) } catch(e){} }
      if (r.auxiliaryPioneer) { try { form.getCheckBox(`903_${row}_CheckBox`).check() } catch(e){} }
      if (r.hours) { try { form.getTextField(`904_${row}_S21_Value`).setText(r.hours.toString()) } catch(e){} }
      if (r.comments) { try { form.getTextField(`905_${row}_Text_SanSerif`).setText(r.comments) } catch(e){} }
    }
  })
  
  // Save and return bytes
  return await pdfDoc.save()
}

const downloadPdf = async () => {
  if (!selectedPublisher.value) return
  downloading.value = true
  try {
    const response = await fetch('/S-21-E.pdf')
    if (!response.ok) throw new Error('Failed to fetch the PDF template: ' + response.statusText)
    const existingPdfBytes = await response.arrayBuffer()
    
    const pdfBytes = await fillS21Pdf(selectedPublisher.value, reports.value, existingPdfBytes)
    
    const blob = new Blob([pdfBytes], { type: 'application/pdf' })
    const fileName = getPublisherPdfFileName(selectedPublisher.value)
    saveAs(blob, `${fileName}.pdf`)
  } catch (err) {
    console.error('Download error:', err)
    alert('Could not generate PDF download. Make sure S-21-E.pdf is available.')
  } finally {
    downloading.value = false
  }
}

const downloadBulkPdf = async () => {
  const targetPublishers = filteredPublishers.value
  if (targetPublishers.length === 0) {
    alert('No publishers match the selected filter.')
    return
  }

  bulkDownloading.value = true
  bulkProgress.value = { current: 0, total: 0, text: 'Fetching template and data...' }

  try {
    const response = await fetch('/S-21-E.pdf')
    if (!response.ok) throw new Error('Failed to fetch the PDF template: ' + response.statusText)
    const templateBytes = await response.arrayBuffer()

    const startYear = selectedServiceYear.value - 1
    const endYear = selectedServiceYear.value

    bulkProgress.value.text = 'Fetching reports...'
    const startSnap = await getDocs(query(collection(db, 'reports'), where('year', '==', startYear)))
    const endSnap = await getDocs(query(collection(db, 'reports'), where('year', '==', endYear)))
    const allReports = [...startSnap.docs, ...endSnap.docs].map(d => ({id: d.id, ...d.data()}))

    bulkProgress.value.text = 'Fetching groups...'
    let groupsMap = {}
    if (groups.value.length > 0) {
      groups.value.forEach(g => { groupsMap[g.id] = g.name || 'Unassigned' })
    } else {
      const groupsSnap = await getDocs(collection(db, 'groups'))
      groupsSnap.docs.forEach(doc => { groupsMap[doc.id] = doc.data().name || 'Unassigned' })
    }

    bulkProgress.value.total = targetPublishers.length
    bulkProgress.value.text = 'Generating PDFs...'

    const zip = new JSZip()

    for (let i = 0; i < targetPublishers.length; i++) {
        const pub = targetPublishers[i]
        bulkProgress.value.current = i + 1
        bulkProgress.value.text = `Processing ${pub.name}...`

        const pubReports = allReports.filter(r => r.publisherId === pub.id)
        const pdfBytes = await fillS21Pdf(pub, pubReports, templateBytes)

        const groupName = groupsMap[pub.groupId] || 'Unassigned'
        const fileName = `${getPublisherPdfFileName(pub)}.pdf`

        // Add to zip structure
        zip.folder(groupName).file(fileName, pdfBytes)
    }

    bulkProgress.value.text = 'Zipping files...'
    const zipBlob = await zip.generateAsync({ type: 'blob' })
    
    let zipNameSuffix = 'ALL'
    if (filterMode.value === 'RP Only') zipNameSuffix = 'RP_Only'
    else if (filterMode.value === 'By Group' && selectedGroupId.value) {
      const gName = groupsMap[selectedGroupId.value] || 'Group'
      zipNameSuffix = gName.replace(/[^a-zA-Z0-9_-]/g, '_')
    }

    saveAs(zipBlob, `S-21_Publisher_Records_${zipNameSuffix}_${startYear}-${endYear}.zip`)

  } catch (error) {
    console.error('Bulk download error:', error)
    alert('Failed to generate bulk PDF ZIP package.')
  } finally {
    bulkDownloading.value = false
    bulkProgress.value = { current: 0, total: 0, text: '' }
  }
}

onMounted(() => {
  loadPublishers()
  loadGroups()
})
</script>

<style scoped>
.publisher-record-container {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

@media (max-width: 600px) {
  .publisher-record-container {
    padding: 12px 6px;
  }
}

.gap-2 { gap: 8px; }

/* S-21 Card Styles */
.s21-card-wrapper {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 16px;
}

/* Custom scrollbar for horizontal scroll */
.s21-card-wrapper::-webkit-scrollbar {
  height: 8px;
}

.s21-card-wrapper::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.s21-card-wrapper::-webkit-scrollbar-thumb {
  background: #bbb;
  border-radius: 4px;
}

.s21-card-wrapper::-webkit-scrollbar-thumb:hover {
  background: #888;
}

.s21-card {
  width: 800px;
  min-width: 800px;
  margin: 0 auto;
  background: white !important;
  padding: 24px 32px;
  color: black !important;
  font-family: Arial, sans-serif;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-sizing: border-box;
}

/* Force black text for all S-21 card elements regardless of app theme (Light or Dark) */
.s21-card,
.s21-card *,
.s21-card .s21-header,
.s21-card .s21-label,
.s21-card .s21-value,
.s21-card .s21-cb-label,
.s21-card .s21-table,
.s21-card .s21-table th,
.s21-card .s21-table td,
.s21-card .s21-footer {
  color: #000000 !important;
}

/* Header row with title + edit button */
.s21-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.s21-header-row .s21-header {
  margin-bottom: 0;
}

.s21-edit-btn-wrap {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.s21-header {
  text-align: center;
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 16px;
  flex: 1;
}

.s21-info-section {
  font-size: 14px;
}

.s21-info-row {
  margin-bottom: 6px;
}

.s21-label {
  font-weight: bold;
  display: inline-block;
  margin-right: 4px;
}

.s21-value.name-value {
  display: inline-block;
  width: calc(100% - 60px);
}

.s21-value.date-value {
  display: inline-block;
  width: 120px;
}

.s21-dates {
  display: flex;
  flex-direction: column;
}

.s21-checkboxes-right {
  display: flex;
  flex-direction: column;
  margin-left: auto;
  align-items: flex-end;
}

.s21-cb-row {
  display: flex;
  gap: 16px;
}

.s21-roles-row {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
  font-size: 13px;
}

.s21-cb-label {
  display: flex;
  align-items: center;
  gap: 4px;
}
.s21-cb-label input {
  margin: 0;
}

/* Force all checkboxes inside S-21 card to render with a crisp black border, white background, and black checkmark */
.s21-card input[type="checkbox"] {
  appearance: none;
  -webkit-appearance: none;
  width: 14px;
  height: 14px;
  border: 1.5px solid #000000 !important;
  background-color: #ffffff !important;
  border-radius: 2px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin: 0 4px 0 0;
  cursor: pointer;
  vertical-align: middle;
  position: relative;
  box-sizing: border-box;
}

.s21-card input[type="checkbox"]:checked {
  background-color: #ffffff !important;
  border-color: #000000 !important;
}

.s21-card input[type="checkbox"]:checked::after {
  content: "";
  position: absolute;
  width: 4px;
  height: 7px;
  border: solid #000000;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
  top: 0px;
}

.s21-card input[type="checkbox"]:disabled {
  opacity: 1 !important;
  cursor: default;
  border-color: #000000 !important;
  background-color: #ffffff !important;
}

/* Inline edit inputs inside table cells */
.s21-inline-input {
  border: 1px solid #aaa;
  border-radius: 3px;
  padding: 1px 3px;
  font-size: 11px;
  font-family: Arial, sans-serif;
  background: #ffffff !important;
  color: #000000 !important;
  outline: none;
}
.s21-inline-input:focus {
  border-color: #1976d2;
  background: #ffffff !important;
  color: #000000 !important;
}

/* Edit fields inside info section */
.s21-name-input {
  width: calc(100% - 60px);
  border: 1px solid #1976d2;
  border-radius: 4px;
  padding: 3px 8px;
  font-size: 14px;
  font-weight: bold;
  font-family: Arial, sans-serif;
  background: #ffffff !important;
  color: #000000 !important;
  outline: none;
  box-sizing: border-box;
}
.s21-name-input:focus {
  border-color: #1565c0;
  box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.25);
}

.s21-date-input {
  width: 135px;
  border: 1px solid #aaa;
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 12px;
  font-family: Arial, sans-serif;
  background: #ffffff !important;
  color: #000000 !important;
  outline: none;
  box-sizing: border-box;
}
.s21-date-input:focus {
  border-color: #1976d2;
  box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.25);
}

.s21-edit-field {
  display: inline-flex !important;
}

.s21-card :deep(.v-field__input),
.s21-card :deep(.v-field),
.s21-card :deep(.v-label),
.s21-card :deep(input) {
  color: #000000 !important;
  -webkit-text-fill-color: #000000 !important;
}

.s21-card :deep(.v-field) {
  background: #f9f9ff !important;
}

/* S-21 Table */
.s21-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 12px;
  font-size: 12px;
}

.s21-table th, .s21-table td {
  border: 1px solid black;
  padding: 4px;
}

.s21-table th {
  font-weight: bold;
  text-align: center;
  vertical-align: top;
}

.s-year-col { width: 15%; }
.s-shared-col { width: 10%; }
.s-studies-col { width: 10%; }
.s-aux-col { width: 10%; }
.s-hours-col { width: 15%; }
.s-remarks-col { width: 40%; }

.text-center { text-align: center; }
.text-left { text-align: left; }
.text-right { text-align: right; }

.s21-total-row {
  font-weight: bold;
}

/* Printing logic */
@media print {
  /* Hide standard web layouts */
  .v-application, .v-navigation-drawer, .v-app-bar, .d-print-none {
    display: none !important;
  }
  
  html, body {
    margin: 0 !important;
    padding: 0 !important;
    background: white !important;
  }
  
  .s21-card-wrapper {
    overflow: visible !important;
    padding: 0 !important;
    margin: 0 !important;
    width: 100% !important;
  }

  .s21-card {
    box-shadow: none !important;
    border: none !important;
    padding: 0 !important;
    max-width: none !important;
    min-width: 0 !important;
    width: 100% !important;
    margin: 0 !important;
    /* Force rendering to look identical on paper */
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
}
</style>
