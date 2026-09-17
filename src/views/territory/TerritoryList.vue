<template>
  <div class="territory-list-view">
    <!-- Header -->
    <v-row class="mb-2">
      <v-col cols="12" class="d-flex align-center justify-space-between flex-wrap ga-3">
        <div>
          <h1 class="text-h4 font-weight-bold">Territory List</h1>
          <p class="text-subtitle-1 text-medium-emphasis mt-1">
            Congregation territory registry, boundary details, and map images.
          </p>
        </div>

        <div class="d-flex align-center ga-2 flex-wrap">
          <v-chip size="small" variant="tonal" color="primary">
            Total: {{ loading ? '...' : filteredTerritories.length }}
          </v-chip>
        </div>
      </v-col>
    </v-row>

    <!-- Main Card -->
    <v-card class="elevation-1 rounded-xl mb-4">
      <v-card-text class="pa-4">
        <!-- Search & Actions Top Bar -->
        <div class="d-flex align-center justify-space-between flex-wrap ga-3 mb-4">
          <v-text-field
            v-model="territorySearch"
            prepend-inner-icon="mdi-magnify"
            label="Search Territory (No, Name, Group, Borders...)"
            density="compact"
            variant="outlined"
            hide-details
            clearable
            style="max-width: 400px; min-width: 250px;"
          />

          <div class="d-flex align-center ga-2 flex-wrap">
            <!-- Hidden Excel file input for Territory import -->
            <input
              type="file"
              ref="territoryImportInput"
              accept=".xlsx, .xls, .csv"
              style="display: none;"
              @change="handleTerritoryImport"
            />

            <v-btn
              v-if="canManage"
              color="success"
              variant="tonal"
              prepend-icon="mdi-file-import"
              :loading="importingTerritories"
              @click="triggerTerritoryImport"
            >
              Import
            </v-btn>

            <v-btn
              color="info"
              variant="tonal"
              prepend-icon="mdi-file-export"
              @click="exportTerritoryTemplate"
            >
              Export
            </v-btn>

            <v-btn
              v-if="canManage"
              color="primary"
              prepend-icon="mdi-plus"
              variant="flat"
              @click="openAddTerritoryDialog"
            >
              Add Territory
            </v-btn>
          </div>
        </div>

        <!-- Loading State (Circle loading) -->
        <div v-if="loading" class="text-center pa-12 my-6">
          <v-progress-circular
            indeterminate
            color="primary"
            size="64"
            width="5"
            class="mb-3"
          />
          <div class="text-subtitle-1 font-weight-medium text-medium-emphasis">
            Loading territories...
          </div>
        </div>

        <!-- Expandable List of Territories -->
        <v-expansion-panels v-else-if="filteredTerritories.length > 0" multiple class="territory-panels">
          <v-expansion-panel
            v-for="terr in filteredTerritories"
            :key="terr.id"
            class="rounded-xl mb-3 border"
          >
            <!-- Title: eg: Terr No #10 Annanagar Group Name -->
            <v-expansion-panel-title class="py-3">
              <div class="d-flex align-center justify-space-between w-100 flex-wrap ga-2 mr-2">
                <div class="d-flex align-center flex-wrap ga-2">
                  <span class="text-subtitle-1 font-weight-bold">
                    Terr No #{{ terr.number }} {{ terr.name }}
                  </span>

                  <v-chip
                    size="small"
                    color="primary"
                    variant="tonal"
                    class="font-weight-medium"
                  >
                    {{ terr.groupName || 'Unassigned Group' }}
                  </v-chip>

                  <v-chip
                    size="x-small"
                    :color="getTerritoryStatusColor(terr.status)"
                    variant="flat"
                  >
                    {{ terr.status || 'Available' }}
                  </v-chip>
                </div>

                <div class="d-flex align-center ga-3 text-caption text-medium-emphasis">
                  <span v-if="terr.lastCompleted">
                    <v-icon size="x-small" class="mr-1">mdi-check-all</v-icon>
                    Last Completed: <strong>{{ terr.lastCompleted }}</strong>
                  </span>
                  <span v-else>
                    <v-icon size="x-small" class="mr-1">mdi-clock-outline</v-icon>
                    Not yet completed
                  </span>
                </div>
              </div>
            </v-expansion-panel-title>

            <!-- Expanded Content: Left Edit/Details + Right Image & Download/Upload -->
            <v-expansion-panel-text class="pt-2">
              <v-row>
                <!-- Left Column: Edit fields (Border, Do not call, Remarks) -->
                <v-col cols="12" md="7">
                  <div class="text-subtitle-2 font-weight-bold text-primary mb-3 d-flex align-center justify-space-between">
                    <span>Territory Details & Instructions</span>
                    <v-chip v-if="!canManage" size="x-small" color="grey" variant="tonal">
                      Read Only
                    </v-chip>
                  </div>

                  <v-row dense class="mb-2">
                    <v-col cols="12" sm="4">
                      <v-text-field
                        v-model="terr.number"
                        label="Territory No."
                        density="compact"
                        variant="outlined"
                        :disabled="!canManage"
                      />
                    </v-col>
                    <v-col cols="12" sm="4">
                      <v-text-field
                        v-model="terr.name"
                        label="Territory Name"
                        density="compact"
                        variant="outlined"
                        :disabled="!canManage"
                      />
                    </v-col>
                    <v-col cols="12" sm="4">
                      <v-select
                        v-model="terr.groupId"
                        :items="groups"
                        item-title="name"
                        item-value="id"
                        label="Assigned Group"
                        density="compact"
                        variant="outlined"
                        clearable
                        :disabled="!canManage"
                        @update:model-value="onTerrGroupChange(terr)"
                      />
                    </v-col>
                  </v-row>

                  <!-- Border -->
                  <v-textarea
                    v-model="terr.border"
                    label="Border"
                    placeholder="e.g. North: Main Road, South: Rail line, East: 1st Cross, West: Canal"
                    density="compact"
                    variant="outlined"
                    rows="2"
                    auto-grow
                    class="mb-3"
                    :disabled="!canManage"
                    prepend-inner-icon="mdi-map-marker-path"
                  />

                  <!-- Do not call -->
                  <v-textarea
                    v-model="terr.doNotCall"
                    label="Do not call"
                    placeholder="Addresses or individuals who requested no visits..."
                    density="compact"
                    variant="outlined"
                    rows="2"
                    auto-grow
                    class="mb-3"
                    :disabled="!canManage"
                    prepend-inner-icon="mdi-cancel"
                    color="error"
                  />

                  <!-- Remarks -->
                  <v-textarea
                    v-model="terr.remarks"
                    label="Remarks"
                    placeholder="Key insights, best time to preach, apartment security codes, etc."
                    density="compact"
                    variant="outlined"
                    rows="2"
                    auto-grow
                    class="mb-3"
                    :disabled="!canManage"
                    prepend-inner-icon="mdi-comment-text-outline"
                  />

                  <!-- Action Button: Save & Delete -->
                  <div class="d-flex align-center justify-space-between flex-wrap ga-2 pt-2 border-t">
                    <div class="text-caption text-medium-emphasis">
                      <span v-if="canManage">Authorized to edit (Service Overseer / Territory Servant)</span>
                      <span v-else>Editing restricted to Service Overseer & Territory Servant</span>
                    </div>

                    <div v-if="canManage" class="d-flex ga-2">
                      <v-btn
                        color="error"
                        variant="text"
                        size="small"
                        prepend-icon="mdi-delete"
                        @click="deleteTerritory(terr)"
                      >
                        Delete
                      </v-btn>

                      <v-btn
                        color="primary"
                        variant="flat"
                        prepend-icon="mdi-content-save"
                        :loading="terr.saving"
                        @click="saveTerritory(terr)"
                      >
                        Save
                      </v-btn>
                    </div>
                  </div>
                </v-col>

                <!-- Right Column: Territory Image & Download/Upload -->
                <v-col cols="12" md="5" class="d-flex flex-column">
                  <div class="text-subtitle-2 font-weight-bold text-primary mb-3 d-flex align-center justify-space-between">
                    <span>Territory Map Image</span>
                    <v-chip v-if="terr.imageUrl" size="x-small" color="success" variant="flat">
                      Map Available
                    </v-chip>
                  </div>

                  <div class="territory-image-container pa-3 border rounded-xl d-flex flex-column align-center justify-center flex-grow-1 bg-grey-lighten-4">
                    <template v-if="terr.imageUrl">
                      <div class="map-preview-box position-relative w-100 mb-3" @click="openImageLightbox(terr)">
                        <v-img
                          :src="terr.imageUrl"
                          height="220"
                          cover
                          class="rounded-lg elevation-1 cursor-pointer"
                        >
                          <template v-slot:placeholder>
                            <div class="d-flex align-center justify-center fill-height">
                              <v-progress-circular indeterminate color="primary" />
                            </div>
                          </template>
                        </v-img>
                        <div class="image-overlay-hint">
                          <v-icon color="white">mdi-magnify-plus-outline</v-icon>
                        </div>
                      </div>

                      <div class="d-flex align-center justify-center ga-2 flex-wrap w-100">
                        <!-- Download Button (Available for all) -->
                        <v-btn
                          color="primary"
                          variant="outlined"
                          size="small"
                          prepend-icon="mdi-download"
                          @click="downloadTerritoryMap(terr)"
                        >
                          Download Image
                        </v-btn>

                        <!-- Upload Button (Only for Service Overseer / Territory Servant) -->
                        <template v-if="canManage">
                          <input
                            type="file"
                            :ref="el => fileInputs[terr.id] = el"
                            accept="image/*"
                            style="display: none;"
                            @change="onImageFileSelected($event, terr)"
                          />
                          <v-btn
                            color="secondary"
                            variant="tonal"
                            size="small"
                            prepend-icon="mdi-upload"
                            :loading="terr.uploading"
                            @click="triggerUpload(terr.id)"
                          >
                            Replace
                          </v-btn>
                          <v-btn
                            color="error"
                            variant="text"
                            size="small"
                            icon="mdi-delete-outline"
                            title="Remove Image"
                            @click="removeTerritoryMap(terr)"
                          />
                        </template>
                      </div>
                    </template>

                    <template v-else>
                      <div class="text-center pa-6">
                        <v-avatar color="primary" variant="tonal" size="64" class="mb-3">
                          <v-icon size="36">mdi-map-marker-radius-outline</v-icon>
                        </v-avatar>
                        <div class="text-body-2 font-weight-bold mb-1">No Map Image Uploaded</div>
                        <div class="text-caption text-medium-emphasis mb-4">
                          Upload a street map, aerial image, or boundary photo for this territory.
                        </div>

                        <!-- Upload Button (Only for Service Overseer / Territory Servant) -->
                        <div v-if="canManage">
                          <input
                            type="file"
                            :ref="el => fileInputs[terr.id] = el"
                            accept="image/*"
                            style="display: none;"
                            @change="onImageFileSelected($event, terr)"
                          />
                          <v-btn
                            color="primary"
                            variant="flat"
                            size="small"
                            prepend-icon="mdi-upload"
                            :loading="terr.uploading"
                            @click="triggerUpload(terr.id)"
                          >
                            Upload Image
                          </v-btn>
                        </div>
                        <div v-else class="text-caption text-grey">
                          Image upload requires Service Overseer or Territory Servant authorization.
                        </div>
                      </div>
                    </template>
                  </div>
                </v-col>
              </v-row>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>

        <!-- Empty State -->
        <div v-else class="text-center pa-12 text-medium-emphasis border rounded-xl bg-grey-lighten-4">
          <v-icon size="64" color="grey" class="mb-3">mdi-map-search-outline</v-icon>
          <div class="text-h6 font-weight-bold mb-1">No Territories Found</div>
          <p class="text-body-2 mb-4">
            {{ territorySearch ? 'No territories match your search query.' : 'No territories have been registered yet.' }}
          </p>
          <v-btn
            v-if="canManage && !territorySearch"
            color="primary"
            prepend-icon="mdi-plus"
            @click="openAddTerritoryDialog"
          >
            Create First Territory
          </v-btn>
        </div>
      </v-card-text>
    </v-card>

    <!-- Add Territory Dialog -->
    <v-dialog v-model="showTerritoryDialog" max-width="600px">
      <v-card class="rounded-xl">
        <v-card-title class="bg-primary text-white pa-4">
          Add New Territory
        </v-card-title>
        <v-card-text class="pa-4">
          <v-form ref="newTerrForm">
            <v-row dense>
              <v-col cols="12" sm="4">
                <v-text-field
                  v-model="newTerritory.number"
                  label="Territory No.*"
                  variant="outlined"
                  class="mb-2"
                  :rules="[v => (v !== null && v !== undefined && v !== '') || 'Number is required']"
                />
              </v-col>
              <v-col cols="12" sm="8">
                <v-text-field
                  v-model="newTerritory.name"
                  label="Territory Name*"
                  variant="outlined"
                  class="mb-2"
                  :rules="[v => !!v || 'Name is required']"
                />
              </v-col>
              <v-col cols="12">
                <v-select
                  v-model="newTerritory.groupId"
                  :items="groups"
                  item-title="name"
                  item-value="id"
                  label="Assigned Group"
                  variant="outlined"
                  class="mb-2"
                  clearable
                />
              </v-col>
              <v-col cols="12">
                <v-textarea
                  v-model="newTerritory.border"
                  label="Border"
                  variant="outlined"
                  rows="2"
                  class="mb-2"
                  placeholder="e.g. North: Highway, South: River, East: 1st Ave, West: Ring Road"
                />
              </v-col>
              <v-col cols="12">
                <v-textarea
                  v-model="newTerritory.doNotCall"
                  label="Do not call"
                  variant="outlined"
                  rows="2"
                  class="mb-2"
                  placeholder="Addresses requesting no visits..."
                />
              </v-col>
              <v-col cols="12">
                <v-textarea
                  v-model="newTerritory.remarks"
                  label="Remarks"
                  variant="outlined"
                  rows="2"
                  class="mb-2"
                  placeholder="General notes, accessibility, safety tips..."
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions class="pa-4 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="showTerritoryDialog = false">Cancel</v-btn>
          <v-btn color="primary" variant="flat" :loading="savingNewTerritory" @click="saveNewTerritory">
            Save Territory
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Lightbox Modal for Map Image -->
    <v-dialog v-model="showLightbox" max-width="900px">
      <v-card v-if="selectedMapTerritory" class="rounded-xl overflow-hidden">
        <v-card-title class="bg-primary text-white pa-3 d-flex align-center justify-space-between">
          <span class="font-weight-bold">
            Territory #{{ selectedMapTerritory.number }} - {{ selectedMapTerritory.name }} Map
          </span>
          <v-btn icon="mdi-close" variant="text" size="small" color="white" @click="showLightbox = false" />
        </v-card-title>
        <v-card-text class="pa-4 text-center bg-grey-darken-4">
          <img
            :src="selectedMapTerritory.imageUrl"
            alt="Territory Map"
            class="lightbox-img"
          />
        </v-card-text>
        <v-card-actions class="pa-3 bg-surface d-flex justify-space-between">
          <span class="text-caption text-medium-emphasis">
            Group: {{ selectedMapTerritory.groupName || 'Unassigned' }}
          </span>
          <v-btn
            color="primary"
            variant="flat"
            prepend-icon="mdi-download"
            size="small"
            @click="downloadTerritoryMap(selectedMapTerritory)"
          >
            Download High-Res Map
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar for notifications -->
    <v-snackbar v-model="snackbar" :color="snackbarColor" timeout="4500" location="bottom end">
      {{ snackbarText }}
      <template v-slot:actions>
        <v-btn variant="text" size="small" @click="snackbar = false">Close</v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { collection, getDocs, doc, setDoc, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/config/firebase'
import { useAuthStore } from '@/stores/auth'
import { saveAs } from 'file-saver'
import * as XLSX from 'xlsx'

const authStore = useAuthStore()

// State
const loading = ref(true)
const territorySearch = ref('')
const territories = ref([])
const groups = ref([])

// Permissions:
const canManage = computed(() => {
  return authStore.canManageTerritory
})

// Input refs
const fileInputs = ref({})
const territoryImportInput = ref(null)
const importingTerritories = ref(false)

// Dialogs & lightbox
const showTerritoryDialog = ref(false)
const savingNewTerritory = ref(false)
const showLightbox = ref(false)
const selectedMapTerritory = ref(null)

// Feedback snackbar
const snackbar = ref(false)
const snackbarColor = ref('success')
const snackbarText = ref('')

const newTerritory = ref({
  number: '',
  name: '',
  groupId: null,
  groupName: '',
  border: '',
  doNotCall: '',
  remarks: '',
  imageUrl: ''
})

// Sorted Territories numerically by Terr.No (0 to ...)
const sortedTerritories = computed(() => {
  return [...territories.value].sort((a, b) => {
    const numA = parseInt(String(a.number).replace(/\D/g, ''), 10)
    const numB = parseInt(String(b.number).replace(/\D/g, ''), 10)
    const validA = !isNaN(numA) ? numA : Infinity
    const validB = !isNaN(numB) ? numB : Infinity
    if (validA !== validB) return validA - validB
    return String(a.number).localeCompare(String(b.number), undefined, { numeric: true })
  })
})

// Filtered Territories
const filteredTerritories = computed(() => {
  let list = [...sortedTerritories.value]
  if (territorySearch.value) {
    const q = territorySearch.value.toLowerCase().trim()
    list = list.filter(t => 
      String(t.number).toLowerCase().includes(q) ||
      (t.name && t.name.toLowerCase().includes(q)) ||
      (t.groupName && t.groupName.toLowerCase().includes(q)) ||
      (t.border && t.border.toLowerCase().includes(q)) ||
      (t.doNotCall && t.doNotCall.toLowerCase().includes(q)) ||
      (t.remarks && t.remarks.toLowerCase().includes(q))
    )
  }
  return list
})

// --- LIFECYCLE & DATA LOADING ---
onMounted(async () => {
  await Promise.all([
    loadTerritories(),
    loadGroups()
  ])
})

async function loadTerritories() {
  loading.value = true
  try {
    const snap = await getDocs(collection(db, 'territories'))
    territories.value = snap.docs.map(doc => ({
      id: doc.id,
      saving: false,
      uploading: false,
      ...doc.data()
    }))
  } catch (err) {
    console.error('Error loading territories:', err)
  } finally {
    loading.value = false
  }
}

async function loadGroups() {
  try {
    const snap = await getDocs(collection(db, 'groups'))
    groups.value = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  } catch (err) {
    console.error('Error loading groups:', err)
  }
}

// --- TERRITORY ACTIONS ---
function getTerritoryStatusColor(status) {
  if (status === 'Assigned') return 'warning'
  if (status === 'Completed') return 'success'
  return 'primary'
}

function onTerrGroupChange(terr) {
  const g = groups.value.find(item => item.id === terr.groupId)
  terr.groupName = g ? g.name : ''
}

function openAddTerritoryDialog() {
  newTerritory.value = {
    number: (territories.value.length + 1).toString(),
    name: '',
    groupId: null,
    groupName: '',
    border: '',
    doNotCall: '',
    remarks: '',
    imageUrl: '',
    status: 'Available',
    lastCompleted: ''
  }
  showTerritoryDialog.value = true
}

async function saveNewTerritory() {
  if (!newTerritory.value.number || !newTerritory.value.name) return
  savingNewTerritory.value = true
  try {
    const g = groups.value.find(item => item.id === newTerritory.value.groupId)
    const payload = {
      ...newTerritory.value,
      groupName: g ? g.name : '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }
    const docRef = await addDoc(collection(db, 'territories'), payload)
    territories.value.push({ id: docRef.id, saving: false, uploading: false, ...payload })
    showTerritoryDialog.value = false
    snackbarText.value = `Territory #${payload.number} added successfully.`
    snackbarColor.value = 'success'
    snackbar.value = true
  } catch (err) {
    console.error('Error adding territory:', err)
    snackbarText.value = 'Failed to add territory.'
    snackbarColor.value = 'error'
    snackbar.value = true
  } finally {
    savingNewTerritory.value = false
  }
}

async function saveTerritory(terr) {
  terr.saving = true
  try {
    const { saving, uploading, id, ...payload } = terr
    payload.updatedAt = serverTimestamp()
    await setDoc(doc(db, 'territories', id), payload, { merge: true })
    snackbarText.value = `Territory #${terr.number} saved successfully.`
    snackbarColor.value = 'success'
    snackbar.value = true
  } catch (err) {
    console.error('Error updating territory:', err)
    snackbarText.value = 'Failed to save territory.'
    snackbarColor.value = 'error'
    snackbar.value = true
  } finally {
    terr.saving = false
  }
}

async function deleteTerritory(terr) {
  if (!confirm(`Are you sure you want to delete Territory #${terr.number} (${terr.name})?`)) return
  try {
    await deleteDoc(doc(db, 'territories', terr.id))
    territories.value = territories.value.filter(t => t.id !== terr.id)
    snackbarText.value = `Territory #${terr.number} deleted.`
    snackbarColor.value = 'info'
    snackbar.value = true
  } catch (err) {
    console.error('Error deleting territory:', err)
    snackbarText.value = 'Failed to delete territory.'
    snackbarColor.value = 'error'
    snackbar.value = true
  }
}

// --- TERRITORY TEMPLATE EXPORT & IMPORT ---
function exportTerritoryTemplate() {
  const headers = [
    'Terr.No',
    'Territory Name',
    'Group Name',
    'Border',
    'Do Not Call',
    'Remarks',
    'Last Completed',
    'Status'
  ]

  let rowsToExport = []
  if (territories.value.length > 0) {
    rowsToExport = sortedTerritories.value.map(t => ({
      'Terr.No': t.number || '',
      'Territory Name': t.name || '',
      'Group Name': t.groupName || '',
      'Border': t.border || '',
      'Do Not Call': t.doNotCall || '',
      'Remarks': t.remarks || '',
      'Last Completed': t.lastCompleted || '',
      'Status': t.status || 'Available'
    }))
  } else {
    rowsToExport = [
      {
        'Terr.No': '1',
        'Territory Name': 'Anna Nagar North',
        'Group Name': groups.value[0]?.name || 'Group 1',
        'Border': 'North: Main Rd, South: 2nd Cross, East: Canal, West: Ring Rd',
        'Do Not Call': 'Door 12B, Flat 301',
        'Remarks': 'Best to preach on weekend mornings',
        'Last Completed': '2025-11-20',
        'Status': 'Available'
      }
    ]
  }

  const ws = XLSX.utils.json_to_sheet(rowsToExport, { header: headers })
  ws['!cols'] = [
    { wch: 10 },
    { wch: 24 },
    { wch: 18 },
    { wch: 35 },
    { wch: 30 },
    { wch: 30 },
    { wch: 16 },
    { wch: 14 }
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Territory Template')
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  saveAs(new Blob([wbout], { type: 'application/octet-stream' }), 'Territory_Import_Template.xlsx')
}

function triggerTerritoryImport() {
  if (territoryImportInput.value) {
    territoryImportInput.value.click()
  }
}

async function handleTerritoryImport(e) {
  const file = e.target.files?.[0]
  if (!file) return

  importingTerritories.value = true
  try {
    const buffer = await file.arrayBuffer()
    const wb = XLSX.read(buffer, { type: 'array' })
    const ws = wb.Sheets[wb.SheetNames[0]]
    const jsonData = XLSX.utils.sheet_to_json(ws)

    if (!jsonData || jsonData.length === 0) {
      snackbarText.value = 'The uploaded template contains no territory rows.'
      snackbarColor.value = 'warning'
      snackbar.value = true
      return
    }

    let addedCount = 0
    let updatedCount = 0

    for (const row of jsonData) {
      const rawNo = row['Terr.No'] ?? row['TerrNo'] ?? row['Territory No'] ?? row['Number'] ?? row['number']
      if (rawNo === undefined || rawNo === null || String(rawNo).trim() === '') continue

      const terrNo = String(rawNo).replace(/^#/, '').trim()
      const terrName = String(row['Territory Name'] || row['Name'] || row['name'] || `Territory ${terrNo}`).trim()
      const groupName = String(row['Group Name'] || row['Group'] || row['groupName'] || '').trim()
      const border = String(row['Border'] || row['border'] || '').trim()
      const doNotCall = String(row['Do Not Call'] || row['DoNotCall'] || row['doNotCall'] || '').trim()
      const remarks = String(row['Remarks'] || row['remarks'] || row['Comments'] || '').trim()
      const lastCompleted = String(row['Last Completed'] || row['lastCompleted'] || '').trim()
      const status = String(row['Status'] || row['status'] || 'Available').trim()

      let groupId = null
      if (groupName) {
        const matchedGroup = groups.value.find(g => g.name?.toLowerCase() === groupName.toLowerCase())
        if (matchedGroup) {
          groupId = matchedGroup.id
        }
      }

      const existingTerr = territories.value.find(t => String(t.number).trim() === terrNo)

      if (existingTerr) {
        const updateData = {
          name: terrName || existingTerr.name,
          border: border !== undefined && border !== '' ? border : (existingTerr.border || ''),
          doNotCall: doNotCall !== undefined && doNotCall !== '' ? doNotCall : (existingTerr.doNotCall || ''),
          remarks: remarks !== undefined && remarks !== '' ? remarks : (existingTerr.remarks || ''),
          updatedAt: serverTimestamp()
        }
        if (groupId) updateData.groupId = groupId
        if (groupName) updateData.groupName = groupName
        if (lastCompleted) updateData.lastCompleted = lastCompleted
        if (status) updateData.status = status

        await updateDoc(doc(db, 'territories', existingTerr.id), updateData)
        Object.assign(existingTerr, updateData)
        updatedCount++
      } else {
        const newTerr = {
          number: terrNo,
          name: terrName,
          groupId: groupId,
          groupName: groupName,
          border: border,
          doNotCall: doNotCall,
          remarks: remarks,
          lastCompleted: lastCompleted,
          status: status || 'Available',
          imageUrl: '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }
        const docRef = await addDoc(collection(db, 'territories'), newTerr)
        territories.value.push({ id: docRef.id, saving: false, uploading: false, ...newTerr })
        addedCount++
      }
    }

    await loadTerritories()

    snackbarText.value = `Territory import completed: ${addedCount} added, ${updatedCount} updated.`
    snackbarColor.value = 'success'
    snackbar.value = true
  } catch (err) {
    console.error('Error importing territory template:', err)
    snackbarText.value = 'Failed to import territory template: ' + err.message
    snackbarColor.value = 'error'
    snackbar.value = true
  } finally {
    importingTerritories.value = false
    e.target.value = ''
  }
}

// --- IMAGE UPLOAD & DOWNLOAD ---
function triggerUpload(terrId) {
  const input = fileInputs.value[terrId]
  if (input) input.click()
}

async function onImageFileSelected(event, terr) {
  const file = event.target.files?.[0]
  if (!file) return

  terr.uploading = true
  try {
    const base64Data = await compressImageToDataUrl(file, 1600, 1600, 0.82)
    terr.imageUrl = base64Data
    await updateDoc(doc(db, 'territories', terr.id), {
      imageUrl: base64Data,
      updatedAt: serverTimestamp()
    })
    snackbarText.value = `Map image updated for Territory #${terr.number}.`
    snackbarColor.value = 'success'
    snackbar.value = true
  } catch (err) {
    console.error('Error processing image:', err)
    snackbarText.value = 'Failed to upload image. Please try a smaller file.'
    snackbarColor.value = 'error'
    snackbar.value = true
  } finally {
    terr.uploading = false
    event.target.value = ''
  }
}

function compressImageToDataUrl(file, maxWidth, maxHeight, quality) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        let w = img.width
        let h = img.height
        if (w > maxWidth || h > maxHeight) {
          if (w / h > maxWidth / maxHeight) {
            h = Math.round((h * maxWidth) / w)
            w = maxWidth
          } else {
            w = Math.round((w * maxHeight) / h)
            h = maxHeight
          }
        }
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.onerror = reject
      img.src = e.target.result
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function downloadTerritoryMap(terr) {
  if (!terr.imageUrl) return
  saveAs(terr.imageUrl, `Territory_${terr.number}_${(terr.name || '').replace(/\s+/g, '_')}_Map.jpg`)
}

async function removeTerritoryMap(terr) {
  if (!confirm('Remove the map image for this territory?')) return
  try {
    terr.imageUrl = ''
    await updateDoc(doc(db, 'territories', terr.id), {
      imageUrl: '',
      updatedAt: serverTimestamp()
    })
    snackbarText.value = 'Map image removed.'
    snackbarColor.value = 'info'
    snackbar.value = true
  } catch (err) {
    console.error('Error removing image:', err)
  }
}

function openImageLightbox(terr) {
  selectedMapTerritory.value = terr
  showLightbox.value = true
}
</script>

<style scoped>
.territory-image-container {
  min-height: 250px;
}

.map-preview-box {
  border-radius: 8px;
  overflow: hidden;
}

.map-preview-box:hover .image-overlay-hint {
  opacity: 1;
}

.image-overlay-hint {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
  pointer-events: none;
}

.lightbox-img {
  max-width: 100%;
  max-height: 80vh;
  object-fit: contain;
  border-radius: 8px;
}
</style>
