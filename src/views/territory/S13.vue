<template>
  <div class="s13-view">
    <!-- Header -->
    <v-row class="mb-2">
      <v-col cols="12" class="d-flex align-center justify-space-between flex-wrap ga-3">
        <div>
          <h1 class="text-h4 font-weight-bold">Territory & S-13</h1>
          <p class="text-subtitle-1 text-medium-emphasis mt-1">
            Assignment tracking and official S-13 records.
          </p>
        </div>

        <div class="d-flex align-center ga-2">
          <span class="text-caption font-weight-bold text-medium-emphasis">SERVICE YEAR:</span>
          <v-select
            v-model="selectedServiceYear"
            :items="serviceYearOptions"
            density="compact"
            variant="outlined"
            hide-details
            style="min-width: 145px;"
            class="font-weight-bold"
          />
        </div>
      </v-col>
    </v-row>

    <!-- Navigation Tabs -->
    <v-tabs v-model="activeTab" color="primary" class="mb-6" show-arrows>
      <v-tab value="assigned" prepend-icon="mdi-account-clock-outline">
        Assigned List
      </v-tab>
      <v-tab value="s13" prepend-icon="mdi-file-document-outline">
        S-13
      </v-tab>
    </v-tabs>

    <v-window v-model="activeTab">
      <!-- ========================================== -->
      <!-- TAB 1: ASSIGNED LIST                       -->
      <!-- ========================================== -->
      <v-window-item value="assigned">
        <v-card class="elevation-1 rounded-xl mb-4">
          <v-card-title class="pa-4 d-flex align-center flex-wrap ga-3">
            <!-- Search on Top Left -->
            <v-text-field
              v-model="assignedSearch"
              prepend-inner-icon="mdi-magnify"
              label="Search Terr.No, Publisher..."
              single-line
              hide-details
              density="compact"
              variant="outlined"
              clearable
              style="max-width: 320px; min-width: 200px;"
            />

            <v-spacer />

            <!-- Action Buttons: Add, Import, Export, Toggle Columns -->
            <div class="d-flex align-center ga-2 flex-wrap">
              <v-btn
                v-if="selectedAssignments.length > 0 && canManage"
                color="error"
                variant="flat"
                size="small"
                prepend-icon="mdi-delete"
                @click="deleteSelectedAssignments"
              >
                Delete ({{ selectedAssignments.length }})
              </v-btn>

              <v-btn
                v-if="canManage"
                color="primary"
                variant="flat"
                size="small"
                prepend-icon="mdi-plus"
                @click="openAddAssignmentDialog"
              >
                Add
              </v-btn>

              <!-- Import S-13 (.docx) -->
              <input
                type="file"
                ref="docxImportInput"
                accept=".docx"
                style="display: none;"
                @change="handleDocxImport"
              />
              <v-btn
                v-if="canManage"
                color="success"
                variant="tonal"
                size="small"
                prepend-icon="mdi-file-word-outline"
                :loading="importingDocx"
                @click="triggerDocxImportInput"
              >
                Import S-13 (.docx)
              </v-btn>

              <!-- Export -->
              <v-btn
                color="info"
                variant="tonal"
                size="small"
                prepend-icon="mdi-file-export"
                @click="exportAssignmentsExcel"
              >
                Export
              </v-btn>

              <!-- Toggle Columns -->
              <v-btn
                icon
                size="small"
                variant="text"
                title="Toggle Columns"
                @click="showColumnSelector = !showColumnSelector"
              >
                <v-icon>mdi-view-column</v-icon>
              </v-btn>
            </div>
          </v-card-title>

          <!-- Column Visibility Selector (Matching Publishers List) -->
          <v-card-text v-if="showColumnSelector" class="pt-0 pb-3 px-4">
            <div class="mb-2 text-subtitle-2 font-weight-medium">Click to toggle column visibility:</div>
            <v-chip-group multiple column>
              <v-chip
                v-for="col in allAssignedColumns"
                :key="col.key"
                :color="isColumnVisible(col.key) ? 'primary' : 'grey'"
                :variant="isColumnVisible(col.key) ? 'flat' : 'outlined'"
                size="small"
                @click="toggleColumn(col.key)"
              >
                <v-icon start :icon="isColumnVisible(col.key) ? 'mdi-eye' : 'mdi-eye-off'" />
                {{ col.title }}
              </v-chip>
            </v-chip-group>
          </v-card-text>

          <!-- Table of Assigned Territories -->
          <v-data-table
            v-model="selectedAssignments"
            :headers="visibleAssignedHeaders"
            :items="filteredAssignments"
            :search="assignedSearch"
            :loading="loadingAssignments"
            hover
            show-select
            class="elevation-0"
            item-value="id"
          >
            <!-- Terr.No Slot -->
            <template v-slot:item.terrNo="{ item }">
              <span class="font-weight-bold text-primary">#{{ item.terrNo }}</span>
              <span v-if="item.terrName" class="text-caption text-medium-emphasis ml-1">({{ item.terrName }})</span>
            </template>

            <!-- Seq Slot -->
            <template v-slot:item.seq="{ item }">
              <v-chip size="x-small" variant="outlined" color="primary" class="font-weight-bold">
                {{ item.seq || 1 }}
              </v-chip>
            </template>

            <!-- Assigned To Slot -->
            <template v-slot:item.assignedTo="{ item }">
              <div class="d-flex align-center ga-2">
                <v-avatar size="26" color="primary" variant="tonal">
                  <span class="text-caption font-weight-bold">
                    {{ (item.assignedTo || '?')[0].toUpperCase() }}
                  </span>
                </v-avatar>
                <span class="font-weight-medium">{{ item.assignedTo || 'Unassigned' }}</span>
              </div>
            </template>

            <!-- Date Assigned Slot -->
            <template v-slot:item.dateAssigned="{ item }">
              <span>{{ item.dateAssigned || '-' }}</span>
            </template>

            <!-- Date Completed Slot -->
            <template v-slot:item.dateCompleted="{ item }">
              <span :class="item.dateCompleted ? 'text-success font-weight-medium' : 'text-medium-emphasis'">
                {{ item.dateCompleted || 'In progress' }}
              </span>
            </template>

            <!-- Status Slot -->
            <template v-slot:item.status="{ item }">
              <v-chip
                size="small"
                :color="item.status === 'Completed' || item.dateCompleted ? 'success' : 'warning'"
                variant="flat"
                class="font-weight-bold"
              >
                {{ item.dateCompleted ? 'Completed' : (item.status || 'Assigned') }}
              </v-chip>
            </template>

            <!-- Last Completed Before Slot -->
            <template v-slot:item.lastCompletedBefore="{ item }">
              <span class="text-caption text-medium-emphasis">
                {{ item.lastCompletedBefore || '-' }}
              </span>
            </template>

            <!-- Notes Slot -->
            <template v-slot:item.notes="{ item }">
              <span class="text-caption text-truncate d-inline-block" style="max-width: 160px;" :title="item.notes">
                {{ item.notes || '-' }}
              </span>
            </template>

            <!-- Actions Slot -->
            <template v-slot:item.actions="{ item }">
              <div class="d-flex align-center ga-1">
                <v-btn
                  icon="mdi-pencil-outline"
                  size="x-small"
                  variant="text"
                  color="primary"
                  title="Edit Assignment"
                  @click="openEditAssignmentDialog(item)"
                />
                <v-btn
                  v-if="canManage"
                  icon="mdi-delete-outline"
                  size="x-small"
                  variant="text"
                  color="error"
                  title="Delete"
                  @click="deleteAssignment(item)"
                />
              </div>
            </template>
          </v-data-table>
        </v-card>
      </v-window-item>

      <!-- ========================================== -->
      <!-- TAB 3: S-13 OFFICIAL DOCUMENT VIEW         -->
      <!-- ========================================== -->
      <v-window-item value="s13">
        <!-- Top Toolbar for S-13 -->
        <v-card class="elevation-1 rounded-xl mb-4">
          <v-card-text class="pa-4 d-flex align-center justify-space-between flex-wrap ga-3">
            <div class="d-flex align-center ga-3 flex-wrap">
              <v-avatar color="primary" variant="tonal" size="40">
                <v-icon>mdi-file-table-box-outline</v-icon>
              </v-avatar>
              <div>
                <div class="text-subtitle-1 font-weight-bold">S-13 Territory Assignment Record Sheet</div>
                <div class="text-caption text-medium-emphasis">
                  Populated from active territory assignments for Service Year {{ selectedServiceYear }}.
                </div>
              </div>
            </div>

            <!-- Download Buttons -->
            <div class="d-flex align-center ga-2 flex-wrap">
              <v-btn
                color="info"
                variant="tonal"
                prepend-icon="mdi-file-excel-outline"
                size="small"
                @click="exportS13Excel"
              >
                Export Excel
              </v-btn>

              <v-btn
                color="primary"
                variant="flat"
                prepend-icon="mdi-download"
                size="small"
                :loading="generatingDocx"
                @click="downloadS13DocxFile"
              >
                Download DOCX
              </v-btn>
            </div>
          </v-card-text>
        </v-card>

        <!-- Mobile scroll hint -->
        <div class="d-flex align-center justify-center text-caption text-medium-emphasis mb-2 d-md-none d-print-none">
          <v-icon size="16" class="mr-1">mdi-arrow-left-right</v-icon>
          <span>Swipe horizontally to view full record</span>
        </div>

        <!-- S-13 Authentic Sheet Visual Layout -->
        <div class="s13-document-wrapper pa-2 mb-4">
          <div id="s13-printable-area" class="s13-sheet elevation-3 rounded-lg mx-auto">
            <!-- Sheet Header -->
            <div class="s13-header d-flex align-center justify-space-between pb-2 mb-2 border-b-2">
              <h2 class="text-h6 font-weight-black letter-spacing-wide">
                TERRITORY ASSIGNMENT RECORD
              </h2>
              <div class="d-flex align-center ga-2">
                <span class="font-weight-bold text-subtitle-2">Service Year:</span>
                <span class="text-subtitle-1 font-weight-black text-decoration-underline px-2">
                  {{ selectedServiceYear }}
                </span>
              </div>
            </div>

            <!-- Official S-13 Grid Table -->
            <table class="s13-grid-table">
              <thead>
                <!-- Header Row 1 -->
                <tr class="header-row-1">
                  <th rowspan="2" class="col-terr-no">Terr.<br/>no.</th>
                  <th rowspan="2" class="col-last-date">Last date<br/>completed*</th>
                  <th colspan="2" class="col-assigned-slot">Assigned to</th>
                  <th colspan="2" class="col-assigned-slot">Assigned to</th>
                  <th colspan="2" class="col-assigned-slot">Assigned to</th>
                  <th colspan="2" class="col-assigned-slot">Assigned to</th>
                </tr>
                <!-- Header Row 2 -->
                <tr class="header-row-2">
                  <th class="col-sub-date">Date assigned</th>
                  <th class="col-sub-date">Date completed</th>
                  <th class="col-sub-date">Date assigned</th>
                  <th class="col-sub-date">Date completed</th>
                  <th class="col-sub-date">Date assigned</th>
                  <th class="col-sub-date">Date completed</th>
                  <th class="col-sub-date">Date assigned</th>
                  <th class="col-sub-date">Date completed</th>
                </tr>
              </thead>
              <tbody>
                <template v-for="row in s13TableRows" :key="row.number">
                  <!-- Row A: Terr No, Last Completed, Publisher Names for slots 1-4 -->
                  <tr class="data-row-top">
                    <td rowspan="2" class="cell-terr-no font-weight-black">
                      {{ row.number }}
                    </td>
                    <td rowspan="2" class="cell-last-completed">
                      {{ row.lastCompleted || '' }}
                    </td>
                    <td colspan="2" class="cell-publisher-name font-weight-bold">
                      {{ row.slot1?.assignedTo || '' }}
                    </td>
                    <td colspan="2" class="cell-publisher-name font-weight-bold">
                      {{ row.slot2?.assignedTo || '' }}
                    </td>
                    <td colspan="2" class="cell-publisher-name font-weight-bold">
                      {{ row.slot3?.assignedTo || '' }}
                    </td>
                    <td colspan="2" class="cell-publisher-name font-weight-bold">
                      {{ row.slot4?.assignedTo || '' }}
                    </td>
                  </tr>
                  <!-- Row B: Dates for slots 1-4 -->
                  <tr class="data-row-bottom">
                    <td class="cell-date">{{ row.slot1?.dateAssigned || '' }}</td>
                    <td class="cell-date">{{ row.slot1?.dateCompleted || '' }}</td>
                    <td class="cell-date">{{ row.slot2?.dateAssigned || '' }}</td>
                    <td class="cell-date">{{ row.slot2?.dateCompleted || '' }}</td>
                    <td class="cell-date">{{ row.slot3?.dateAssigned || '' }}</td>
                    <td class="cell-date">{{ row.slot3?.dateCompleted || '' }}</td>
                    <td class="cell-date">{{ row.slot4?.dateAssigned || '' }}</td>
                    <td class="cell-date">{{ row.slot4?.dateCompleted || '' }}</td>
                  </tr>
                </template>
              </tbody>
            </table>

            <!-- Footnote and Form Code -->
            <div class="s13-footer pt-3 mt-2 d-flex align-center justify-space-between text-caption">
              <div class="text-caption font-italic">
                *When beginning a new sheet, use this column to record the date on which each territory was last completed.
              </div>
              <div class="font-weight-bold">
                S-13-E 11/16
              </div>
            </div>
          </div>
        </div>
      </v-window-item>
    </v-window>

    <!-- ========================================== -->
    <!-- DIALOGS                                    -->
    <!-- ========================================== -->

    <!-- Add/Edit Assignment Dialog -->
    <v-dialog v-model="showAssignmentDialog" max-width="600px">
      <v-card class="rounded-xl">
        <v-card-title class="bg-primary text-white pa-4">
          {{ isEditingAssignment ? 'Edit Assignment' : 'Assign Territory' }}
        </v-card-title>
        <v-card-text class="pa-4">
          <v-form ref="assignmentFormRef" @submit.prevent="saveAssignment">
            <v-row dense>
              <!-- Territory Dropdown (sorted 0 to ...) -->
              <v-col cols="12" sm="8">
                <v-select
                  v-model="assignmentForm.terrNo"
                  :items="sortedTerritories"
                  item-title="number"
                  item-value="number"
                  label="Territory No."
                  variant="outlined"
                  class="mb-3"
                  :rules="[v => (v !== null && v !== undefined && v !== '') || 'Territory is required']"
                  @update:model-value="onAssignmentTerritoryChange"
                >
                  <template v-slot:item="{ props, item }">
                    <v-list-item v-bind="props" :title="'#' + item.raw.number + (item.raw.name ? ' - ' + item.raw.name : '')" />
                  </template>
                  <template v-slot:selection="{ item }">
                    #{{ item.raw.number }}{{ item.raw.name ? ' - ' + item.raw.name : '' }}
                  </template>
                </v-select>
              </v-col>

              <!-- Sequence Number (auto-calculated & editable) -->
              <v-col cols="12" sm="4">
                <v-text-field
                  v-model.number="assignmentForm.seq"
                  label="Seq (Round)"
                  type="number"
                  min="1"
                  variant="outlined"
                  class="mb-3"
                  hint="Assignment round in year (auto-calculated, editable)"
                  persistent-hint
                  append-inner-icon="mdi-refresh"
                  @click:append-inner="recalculateSeqManually"
                />
              </v-col>

              <!-- Publisher Dropdown (from Publishers List) -->
              <v-col cols="12">
                <v-autocomplete
                  v-model="assignmentForm.assignedTo"
                  :items="publishers"
                  item-title="name"
                  item-value="name"
                  label="Assigned To (Publisher)"
                  variant="outlined"
                  class="mb-3"
                  clearable
                  :rules="[v => !!v || 'Publisher is required']"
                  @update:model-value="onPublisherSelect"
                >
                  <template v-slot:item="{ props, item }">
                    <v-list-item
                      v-bind="props"
                      :title="item.raw.name"
                      :subtitle="item.raw.role || item.raw.spiritualRole"
                    />
                  </template>
                </v-autocomplete>
              </v-col>

              <!-- Date Assigned -->
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="assignmentForm.dateAssigned"
                  label="Date Assigned"
                  type="date"
                  variant="outlined"
                  class="mb-3"
                  :rules="[v => !!v || 'Date Assigned is required']"
                  @update:model-value="onDateAssignedChange"
                />
              </v-col>

              <!-- Date Completed -->
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="assignmentForm.dateCompleted"
                  label="Date Completed"
                  type="date"
                  variant="outlined"
                  class="mb-3"
                  clearable
                  @update:model-value="onDateCompletedChange"
                />
              </v-col>

              <!-- Status -->
              <v-col cols="12" sm="6">
                <v-select
                  v-model="assignmentForm.status"
                  :items="['Assigned', 'Completed']"
                  label="Status"
                  variant="outlined"
                  class="mb-3"
                />
              </v-col>

              <!-- Last Completed Before -->
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="assignmentForm.lastCompletedBefore"
                  label="Last Completed Before"
                  type="date"
                  variant="outlined"
                  class="mb-3"
                  hint="Previous completion date"
                  persistent-hint
                />
              </v-col>

              <!-- Notes -->
              <v-col cols="12">
                <v-textarea
                  v-model="assignmentForm.notes"
                  label="Notes"
                  variant="outlined"
                  rows="2"
                  placeholder="Additional observations or handover notes..."
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions class="pa-4 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="showAssignmentDialog = false">Cancel</v-btn>
          <v-btn color="primary" variant="flat" :loading="savingAssignment" @click="saveAssignment">
            {{ isEditingAssignment ? 'Update' : 'Assign' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- DOCX S-13 Import Preview Modal -->
    <v-dialog v-model="docxPreviewDialog" max-width="560px">
      <v-card class="rounded-xl">
        <v-card-title class="pa-4 bg-primary text-white d-flex align-center justify-space-between">
          <div class="d-flex align-center ga-2">
            <v-icon color="white">mdi-file-word-outline</v-icon>
            <span class="font-weight-bold">Import S-13 Record</span>
          </div>
          <v-btn icon="mdi-close" variant="text" size="small" color="white" @click="docxPreviewDialog = false" />
        </v-card-title>

        <v-card-text class="pa-5" v-if="parsedDocxData">
          <p class="text-body-2 mb-4">
            Successfully parsed the filled <strong>S-13_E.docx</strong> file. Review the extracted summary before importing into the congregation database:
          </p>

          <v-list density="compact" class="border rounded-lg mb-4 bg-grey-lighten-4">
            <v-list-item prepend-icon="mdi-calendar-range">
              <v-list-item-title class="font-weight-bold">Detected Service Year</v-list-item-title>
              <template v-slot:append>
                <v-chip color="primary" size="small" variant="flat" class="font-weight-bold">
                  {{ parsedDocxData.serviceYear }}
                </v-chip>
              </template>
            </v-list-item>

            <v-divider />

            <v-list-item prepend-icon="mdi-map-marker-multiple">
              <v-list-item-title class="font-weight-bold">Territories Found</v-list-item-title>
              <template v-slot:append>
                <v-chip color="info" size="small" variant="tonal" class="font-weight-bold">
                  {{ parsedDocxData.territories.length }} territories
                </v-chip>
              </template>
            </v-list-item>

            <v-divider />

            <v-list-item prepend-icon="mdi-account-check">
              <v-list-item-title class="font-weight-bold">Assignment Records Found</v-list-item-title>
              <template v-slot:append>
                <v-chip color="success" size="small" variant="tonal" class="font-weight-bold">
                  {{ parsedDocxData.assignments.length }} assignments
                </v-chip>
              </template>
            </v-list-item>
          </v-list>

          <v-alert
            type="info"
            variant="tonal"
            density="compact"
            class="text-caption"
          >
            New territories will be registered automatically if they do not exist. Any publisher names matching records in your Publishers list will be linked. Existing records will not be overwritten.
          </v-alert>
        </v-card-text>

        <v-card-actions class="pa-4 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="docxPreviewDialog = false" :disabled="importingDocx">Cancel</v-btn>
          <v-btn
            color="success"
            variant="flat"
            prepend-icon="mdi-check"
            :loading="importingDocx"
            @click="confirmDocxImport"
          >
            Import Now
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
import { ref, computed, onMounted, watch } from 'vue'
import { collection, getDocs, doc, setDoc, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/config/firebase'
import { useAuthStore } from '@/stores/auth'
import { saveAs } from 'file-saver'
import * as XLSX from 'xlsx'
import { downloadPopulatedS13Docx, parseFilledS13Docx } from '@/utils/s13Docx'

const authStore = useAuthStore()

// State
const activeTab = ref('assigned')
const assignedSearch = ref('')
const selectedServiceYear = ref(getCurrentServiceYear())

// Permissions:
// "only for service overseer role elder and territory servent elder/MS"
const canManage = computed(() => {
  return authStore.canManageTerritory
})

// Service Year calculation:
// Service Year runs Sept 1 to Aug 31, formatted as YYYY-YYYY (e.g. 2026-2027)
function getCurrentServiceYear() {
  const d = new Date()
  const year = d.getFullYear()
  const month = d.getMonth() + 1 // 1-12
  const startYear = month >= 9 ? year : year - 1
  return `${startYear}-${startYear + 1}`
}

function calculateServiceYear(dateStr) {
  if (!dateStr) return getCurrentServiceYear()
  const str = String(dateStr).trim()
  if (/^\d{4}-\d{4}$/.test(str)) {
    return str
  }
  const parts = str.split('-')
  let year, month
  if (parts.length >= 2) {
    year = parseInt(parts[0], 10)
    month = parseInt(parts[1], 10)
  } else {
    const d = new Date(str)
    year = d.getFullYear()
    month = d.getMonth() + 1
  }
  if (isNaN(year) || isNaN(month)) return getCurrentServiceYear()

  const startYear = month >= 9 ? year : year - 1
  return `${startYear}-${startYear + 1}`
}

// Helper to check if an assignment's serviceYear or dateAssigned matches the selected service year (e.g. 2026-2027)
function matchesServiceYear(assignmentSY, dateAssigned, targetSY) {
  if (!targetSY) return true
  const targetStr = String(targetSY).trim()
  const targetParts = targetStr.split('-')
  const targetStart = targetParts[0]
  const targetEnd = targetParts[1]

  if (assignmentSY) {
    const assignStr = String(assignmentSY).trim()
    if (assignStr === targetStr) return true
    if (targetParts.length === 2) {
      if (assignStr === targetStart || assignStr === targetEnd) return true
    }
  }

  if (dateAssigned) {
    const calcSY = calculateServiceYear(dateAssigned)
    if (calcSY === targetStr) return true
  }

  return false
}

// Generate options for Service Years from 2020 up until 2035 (2035-2036)
const serviceYearOptions = computed(() => {
  const list = []
  for (let y = 2020; y <= 2035; y++) {
    list.push(`${y}-${y + 1}`)
  }
  return list
})

// Data collections
const territories = ref([])
const assignments = ref([])
const publishers = ref([])
const groups = ref([])
const loadingAssignments = ref(false)
const importing = ref(false)
const generatingDocx = ref(false)

// Input refs
const importFileInput = ref(null)
const docxImportInput = ref(null)
const importingDocx = ref(false)
const docxPreviewDialog = ref(false)
const parsedDocxData = ref(null)

// Feedback snackbar
const snackbar = ref(false)
const snackbarColor = ref('success')
const snackbarText = ref('')

// Dialogs
const showAssignmentDialog = ref(false)
const isEditingAssignment = ref(false)
const savingAssignment = ref(false)
const assignmentForm = ref({
  id: null,
  territoryId: null,
  terrNo: '',
  terrName: '',
  seq: 1,
  publisherId: null,
  assignedTo: '',
  dateAssigned: '',
  dateCompleted: '',
  status: 'Assigned',
  lastCompletedBefore: '',
  notes: ''
})

const selectedAssignments = ref([])

// Columns for Assigned List (Matching Publishers List pattern)
const showColumnSelector = ref(false)
const allAssignedColumns = [
  { key: 'terrNo', title: 'Terr.No', sortable: true },
  { key: 'seq', title: 'Seq', sortable: true },
  { key: 'assignedTo', title: 'Assigned To', sortable: true },
  { key: 'dateAssigned', title: 'Date Assigned', sortable: true },
  { key: 'dateCompleted', title: 'Date Completed', sortable: true },
  { key: 'status', title: 'Status', sortable: true },
  { key: 'lastCompletedBefore', title: 'Last Completed Before', sortable: true },
  { key: 'notes', title: 'Notes', sortable: false },
  { key: 'actions', title: 'Actions', sortable: false }
]

const visibleColumns = ref([
  'terrNo', 'seq', 'assignedTo', 'dateAssigned', 'dateCompleted', 'status', 'lastCompletedBefore', 'notes', 'actions'
])

const isColumnVisible = (key) => visibleColumns.value.includes(key)

const toggleColumn = (key) => {
  const index = visibleColumns.value.indexOf(key)
  if (index > -1) {
    visibleColumns.value.splice(index, 1)
  } else {
    visibleColumns.value.push(key)
  }
}

const visibleAssignedHeaders = computed(() => {
  return allAssignedColumns
    .filter(col => visibleColumns.value.includes(col.key))
    .map(col => ({ ...col, value: col.key }))
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

// Filtered Assignments for current Service Year
const filteredAssignments = computed(() => {
  let list = assignments.value.filter(a => matchesServiceYear(a.serviceYear, a.dateAssigned, selectedServiceYear.value))
  return list.sort((a, b) => {
    const numA = parseInt(a.terrNo, 10) || 0
    const numB = parseInt(b.terrNo, 10) || 0
    if (numA !== numB) return numA - numB
    return (a.seq || 1) - (b.seq || 1)
  })
})

// S-13 Table Rows (populates all territories with up to 4 slots in the selected Service Year)
const s13TableRows = computed(() => {
  const currentSYAssignments = assignments.value.filter(a => matchesServiceYear(a.serviceYear, a.dateAssigned, selectedServiceYear.value))
  
  // Sort all registered territories
  const sortedTerritories = [...territories.value].sort((a, b) => {
    return (parseInt(a.number, 10) || 0) - (parseInt(b.number, 10) || 0)
  })

  return sortedTerritories.map(t => {
    // Find all assignments for this territory in current service year, ordered by seq or date
    const terrAssignments = currentSYAssignments
      .filter(a => String(a.terrNo) === String(t.number))
      .sort((a, b) => (a.seq || 1) - (b.seq || 1))

    // Determine last completed date (either from previous completed assignment or territory record)
    let lastComp = t.lastCompleted || ''
    if (terrAssignments.length > 0 && terrAssignments[0].lastCompletedBefore) {
      lastComp = terrAssignments[0].lastCompletedBefore
    }

    return {
      number: t.number,
      name: t.name,
      lastCompleted: lastComp,
      slot1: terrAssignments[0] || null,
      slot2: terrAssignments[1] || null,
      slot3: terrAssignments[2] || null,
      slot4: terrAssignments[3] || null
    }
  })
})

// --- LIFECYCLE & DATA LOADING ---
onMounted(async () => {
  await Promise.all([
    loadTerritories(),
    loadAssignments(),
    loadPublishers(),
    loadGroups()
  ])
})

async function loadTerritories() {
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
  }
}

async function loadAssignments() {
  loadingAssignments.value = true
  try {
    const snap = await getDocs(collection(db, 'territoryAssignments'))
    assignments.value = snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  } catch (err) {
    console.error('Error loading assignments:', err)
  } finally {
    loadingAssignments.value = false
  }
}

async function loadPublishers() {
  try {
    const snap = await getDocs(collection(db, 'publishers'))
    publishers.value = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
  } catch (err) {
    console.error('Error loading publishers:', err)
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

// --- ASSIGNED LIST TAB ACTIONS ---
function openAddAssignmentDialog() {
  isEditingAssignment.value = false
  const defaultDate = new Date().toISOString().substring(0, 10)
  const defaultSY = calculateServiceYear(defaultDate)

  const firstTerr = sortedTerritories.value[0]
  assignmentForm.value = {
    id: null,
    territoryId: firstTerr?.id || null,
    terrNo: firstTerr?.number || '0',
    terrName: firstTerr?.name || '',
    seq: 1,
    publisherId: null,
    assignedTo: '',
    dateAssigned: defaultDate,
    dateCompleted: '',
    status: 'Assigned',
    lastCompletedBefore: firstTerr?.lastCompleted || '',
    notes: '',
    serviceYear: defaultSY
  }

  // Auto calculate seq for this territory in this service year
  autoCalculateSeq(assignmentForm.value.terrNo, defaultSY)
  showAssignmentDialog.value = true
}

function openEditAssignmentDialog(item) {
  isEditingAssignment.value = true
  assignmentForm.value = {
    ...item,
    seq: parseInt(item.seq, 10) || 1
  }
  showAssignmentDialog.value = true
}

function recalculateSeqManually() {
  const terrNo = assignmentForm.value.terrNo
  const sy = assignmentForm.value.serviceYear || calculateServiceYear(assignmentForm.value.dateAssigned)
  autoCalculateSeq(terrNo, sy)
}

function onAssignmentTerritoryChange(terrNo) {
  const t = territories.value.find(item => String(item.number).trim() === String(terrNo).trim())
  if (t) {
    assignmentForm.value.territoryId = t.id
    assignmentForm.value.terrName = t.name
    if (!assignmentForm.value.lastCompletedBefore && t.lastCompleted) {
      assignmentForm.value.lastCompletedBefore = t.lastCompleted
    }
  }
  autoCalculateSeq(terrNo, assignmentForm.value.serviceYear)
}

function onDateAssignedChange(val) {
  assignmentForm.value.serviceYear = calculateServiceYear(val)
  autoCalculateSeq(assignmentForm.value.terrNo, assignmentForm.value.serviceYear)
}

function onDateCompletedChange(val) {
  if (val) {
    assignmentForm.value.status = 'Completed'
  }
}

function onPublisherSelect(pubName) {
  const p = publishers.value.find(item => item.name === pubName)
  if (p) {
    assignmentForm.value.publisherId = p.id
  }
}

function autoCalculateSeq(terrNo, sy) {
  if (isEditingAssignment.value) return
  const count = assignments.value.filter(a => 
    String(a.terrNo) === String(terrNo) && matchesServiceYear(a.serviceYear, a.dateAssigned, sy)
  ).length
  assignmentForm.value.seq = count + 1
}

async function saveAssignment() {
  if (!assignmentForm.value.terrNo || !assignmentForm.value.assignedTo || !assignmentForm.value.dateAssigned) {
    alert('Please fill in Territory, Publisher, and Date Assigned.')
    return
  }

  savingAssignment.value = true
  try {
    const sy = calculateServiceYear(assignmentForm.value.dateAssigned)
    const payload = {
      ...assignmentForm.value,
      seq: parseInt(assignmentForm.value.seq, 10) || 1,
      serviceYear: sy,
      updatedAt: serverTimestamp()
    }

    if (isEditingAssignment.value && assignmentForm.value.id) {
      const { id, ...data } = payload
      await updateDoc(doc(db, 'territoryAssignments', id), data)
      const idx = assignments.value.findIndex(a => a.id === id)
      if (idx !== -1) assignments.value[idx] = { id, ...data }
    } else {
      payload.createdAt = serverTimestamp()
      const docRef = await addDoc(collection(db, 'territoryAssignments'), payload)
      assignments.value.push({ id: docRef.id, ...payload })
    }

    // If dateCompleted is filled, optionally update territory's lastCompleted
    if (payload.dateCompleted && payload.terrNo) {
      const t = territories.value.find(item => item.number === payload.terrNo)
      if (t) {
        t.lastCompleted = payload.dateCompleted
        await updateDoc(doc(db, 'territories', t.id), {
          lastCompleted: payload.dateCompleted,
          status: 'Completed'
        })
      }
    }

    showAssignmentDialog.value = false
  } catch (err) {
    console.error('Error saving assignment:', err)
    alert('Failed to save assignment.')
  } finally {
    savingAssignment.value = false
  }
}

async function deleteAssignment(item) {
  if (!confirm(`Delete assignment of Territory #${item.terrNo} to ${item.assignedTo}?`)) return
  try {
    await deleteDoc(doc(db, 'territoryAssignments', item.id))
    assignments.value = assignments.value.filter(a => a.id !== item.id)
  } catch (err) {
    console.error('Error deleting assignment:', err)
    alert('Failed to delete assignment.')
  }
}

async function deleteSelectedAssignments() {
  if (!confirm(`Delete ${selectedAssignments.value.length} selected assignments?`)) return
  try {
    const promises = selectedAssignments.value.map(id => deleteDoc(doc(db, 'territoryAssignments', id)))
    await Promise.all(promises)
    assignments.value = assignments.value.filter(a => !selectedAssignments.value.includes(a.id))
    selectedAssignments.value = []
  } catch (err) {
    console.error('Error deleting assignments:', err)
    alert('Failed to delete selected assignments.')
  }
}

// --- EXPORT & IMPORT ASSIGNMENTS (EXCEL) ---
function exportAssignmentsExcel() {
  const data = filteredAssignments.value.map(a => ({
    'Terr.No': a.terrNo,
    'Territory Name': a.terrName || '',
    'Seq': a.seq || 1,
    'Assigned To': a.assignedTo || '',
    'Date Assigned': a.dateAssigned || '',
    'Date Completed': a.dateCompleted || '',
    'Status': a.status || '',
    'Last Completed Before': a.lastCompletedBefore || '',
    'Service Year': a.serviceYear || '',
    'Notes': a.notes || ''
  }))

  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, `Assignments_SY${selectedServiceYear.value}`)
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  saveAs(new Blob([wbout], { type: 'application/octet-stream' }), `Territory_Assignments_SY${selectedServiceYear.value}.xlsx`)
}

function triggerImportFileInput() {
  if (importFileInput.value) importFileInput.value.click()
}

async function handleImportFile(e) {
  const file = e.target.files?.[0]
  if (!file) return

  importing.value = true
  try {
    const buffer = await file.arrayBuffer()
    const wb = XLSX.read(buffer, { type: 'array' })
    const ws = wb.Sheets[wb.SheetNames[0]]
    const jsonData = XLSX.utils.sheet_to_json(ws)

    let createdCount = 0
    for (const row of jsonData) {
      const terrNo = String(row['Terr.No'] || row['TerrNo'] || row['Terr. no.'] || '').trim()
      const assignedTo = String(row['Assigned To'] || row['Publisher'] || row['Name'] || '').trim()
      const dateAssigned = String(row['Date Assigned'] || row['DateAssigned'] || '').trim()
      const dateCompleted = String(row['Date Completed'] || row['DateCompleted'] || '').trim()
      const notes = String(row['Notes'] || '').trim()

      if (terrNo && assignedTo) {
        const sy = dateAssigned ? calculateServiceYear(dateAssigned) : selectedServiceYear.value
        const payload = {
          terrNo,
          terrName: row['Territory Name'] || '',
          assignedTo,
          dateAssigned: dateAssigned || new Date().toISOString().substring(0, 10),
          dateCompleted: dateCompleted || '',
          status: dateCompleted ? 'Completed' : 'Assigned',
          seq: parseInt(row['Seq'], 10) || 1,
          lastCompletedBefore: String(row['Last Completed Before'] || '').trim(),
          notes,
          serviceYear: sy,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }
        const docRef = await addDoc(collection(db, 'territoryAssignments'), payload)
        assignments.value.push({ id: docRef.id, ...payload })
        createdCount++
      }
    }
    alert(`Successfully imported ${createdCount} assignments.`)
  } catch (err) {
    console.error('Error importing assignments:', err)
    alert('Failed to import file. Please ensure columns match standard format.')
  } finally {
    importing.value = false
    e.target.value = ''
  }
}

// --- S-13 DOCX IMPORT (TAB 1) ---
function triggerDocxImportInput() {
  if (docxImportInput.value) {
    docxImportInput.value.click()
  }
}

async function handleDocxImport(event) {
  const file = event.target.files?.[0]
  if (!file) return

  importingDocx.value = true
  try {
    const parsed = await parseFilledS13Docx(file)

    if (!parsed.territories || parsed.territories.length === 0) {
      snackbarText.value = 'No territory entries found in the uploaded S-13 document.'
      snackbarColor.value = 'warning'
      snackbar.value = true
      return
    }

    parsedDocxData.value = parsed
    docxPreviewDialog.value = true
  } catch (err) {
    console.error('Error importing S-13 DOCX:', err)
    snackbarText.value = 'Failed to parse S-13 DOCX file: ' + err.message
    snackbarColor.value = 'error'
    snackbar.value = true
  } finally {
    importingDocx.value = false
    if (event.target) event.target.value = ''
  }
}

async function confirmDocxImport() {
  if (!parsedDocxData.value) return

  importingDocx.value = true
  try {
    const { serviceYear, territories: parsedTerrs, assignments: parsedAssignments } = parsedDocxData.value

    let addedTerritoriesCount = 0
    let updatedTerritoriesCount = 0
    let addedAssignmentsCount = 0

    // 1. Process Territories
    for (const pTerr of parsedTerrs) {
      const existingTerr = territories.value.find(
        t => String(t.number).trim() === String(pTerr.number).trim()
      )

      if (existingTerr) {
        if (pTerr.lastCompleted && !existingTerr.lastCompleted) {
          await updateDoc(doc(db, 'territories', existingTerr.id), {
            lastCompleted: pTerr.lastCompleted,
            updatedAt: serverTimestamp()
          })
          existingTerr.lastCompleted = pTerr.lastCompleted
          updatedTerritoriesCount++
        }
      } else {
        const newTerrPayload = {
          number: pTerr.number,
          name: `Territory ${pTerr.number}`,
          groupId: null,
          groupName: '',
          border: '',
          doNotCall: '',
          remarks: '',
          lastCompleted: pTerr.lastCompleted || '',
          status: 'Available',
          imageUrl: '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }
        const docRef = await addDoc(collection(db, 'territories'), newTerrPayload)
        territories.value.push({ id: docRef.id, saving: false, uploading: false, ...newTerrPayload })
        addedTerritoriesCount++
      }
    }

    // 2. Process Assignments
    for (const pAssign of parsedAssignments) {
      const assignYear = pAssign.serviceYear || serviceYear || selectedServiceYear.value

      const pubMatch = publishers.value.find(
        p => (p.name || '').trim().toLowerCase() === (pAssign.assignedTo || '').trim().toLowerCase()
      )

      const existingAssign = assignments.value.find(
        a => String(a.terrNo).trim() === String(pAssign.terrNo).trim() &&
             matchesServiceYear(a.serviceYear, a.dateAssigned, assignYear) &&
             Number(a.seq) === Number(pAssign.seq)
      )

      if (!existingAssign) {
        const newAssignPayload = {
          terrNo: pAssign.terrNo,
          terrName: `Territory ${pAssign.terrNo}`,
          seq: pAssign.seq,
          assignedTo: pAssign.assignedTo,
          publisherId: pubMatch ? pubMatch.id : null,
          dateAssigned: pAssign.dateAssigned || '',
          dateCompleted: pAssign.dateCompleted || '',
          status: pAssign.dateCompleted ? 'Completed' : 'Assigned',
          lastCompletedBefore: pAssign.lastCompletedBefore || '',
          notes: '',
          serviceYear: assignYear,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }
        const docRef = await addDoc(collection(db, 'territoryAssignments'), newAssignPayload)
        assignments.value.push({ id: docRef.id, ...newAssignPayload })
        addedAssignmentsCount++
      }
    }

    docxPreviewDialog.value = false
    parsedDocxData.value = null

    snackbarText.value = `Imported: ${addedTerritoriesCount} new territories, ${updatedTerritoriesCount} updated, and ${addedAssignmentsCount} assignments for Service Year ${serviceYear}.`
    snackbarColor.value = 'success'
    snackbar.value = true
  } catch (err) {
    console.error('Error confirming S-13 import:', err)
    snackbarText.value = 'Error saving imported S-13 data: ' + err.message
    snackbarColor.value = 'error'
    snackbar.value = true
  } finally {
    importingDocx.value = false
  }
}

// --- TAB 3: S-13 OFFICIAL EXPORT ---
async function downloadS13DocxFile() {
  generatingDocx.value = true
  try {
    await downloadPopulatedS13Docx(selectedServiceYear.value, s13TableRows.value)
  } catch (err) {
    console.error('Failed to generate S-13 DOCX:', err)
    alert('Error generating DOCX. Falling back to Excel download.')
    exportS13Excel()
  } finally {
    generatingDocx.value = false
  }
}

function exportS13Excel() {
  // Build S-13 layout table in Excel
  const rows = []
  rows.push(['TERRITORY ASSIGNMENT RECORD', '', '', '', '', '', '', '', '', ''])
  rows.push([`Service Year: ${selectedServiceYear.value}`, '', '', '', '', '', '', '', '', ''])
  rows.push(['Terr. no.', 'Last date completed*', 'Assigned to', '', 'Assigned to', '', 'Assigned to', '', 'Assigned to', ''])
  rows.push(['', '', 'Date assigned', 'Date completed', 'Date assigned', 'Date completed', 'Date assigned', 'Date completed', 'Date assigned', 'Date completed'])

  s13TableRows.value.forEach(item => {
    rows.push([
      item.number,
      item.lastCompleted || '',
      item.slot1?.assignedTo || '',
      '',
      item.slot2?.assignedTo || '',
      '',
      item.slot3?.assignedTo || '',
      '',
      item.slot4?.assignedTo || '',
      ''
    ])
    rows.push([
      '',
      '',
      item.slot1?.dateAssigned || '',
      item.slot1?.dateCompleted || '',
      item.slot2?.dateAssigned || '',
      item.slot2?.dateCompleted || '',
      item.slot3?.dateAssigned || '',
      item.slot3?.dateCompleted || '',
      item.slot4?.dateAssigned || '',
      item.slot4?.dateCompleted || ''
    ])
  })

  rows.push([])
  rows.push(['*When beginning a new sheet, use this column to record the date on which each territory was last completed.', '', '', '', '', '', '', '', '', ''])
  rows.push(['S-13-E 11/16', '', '', '', '', '', '', '', '', ''])

  const ws = XLSX.utils.aoa_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, `S-13_SY${selectedServiceYear.value}`)
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  saveAs(new Blob([wbout], { type: 'application/octet-stream' }), `S-13_ServiceYear_${selectedServiceYear.value}.xlsx`)
}
</script>

<style scoped>
/* ============================================================ */
/* OFFICIAL S-13 SHEET STYLING (MATCHES PUBLIC/S-13_E.DOCX)     */
/* ============================================================ */
.s13-document-wrapper {
  background: #f1f5f9;
  border-radius: 16px;
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 16px;
}

/* Custom scrollbar for horizontal scroll */
.s13-document-wrapper::-webkit-scrollbar {
  height: 8px;
}

.s13-document-wrapper::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.s13-document-wrapper::-webkit-scrollbar-thumb {
  background: #bbb;
  border-radius: 4px;
}

.s13-document-wrapper::-webkit-scrollbar-thumb:hover {
  background: #888;
}

.s13-sheet {
  background: #ffffff;
  color: #111827;
  width: 1020px;
  min-width: 1020px;
  margin: 0 auto;
  padding: 36px 40px;
  font-family: 'Times New Roman', Times, serif;
  box-sizing: border-box;
}

.letter-spacing-wide {
  letter-spacing: 0.05em;
}

.s13-grid-table {
  width: 100%;
  border-collapse: collapse;
  border: 2px solid #111827;
  margin-top: 8px;
  font-size: 0.85rem;
}

.s13-grid-table th,
.s13-grid-table td {
  border: 1px solid #111827;
  padding: 4px 6px;
  text-align: center;
  vertical-align: middle;
}

.header-row-1 th {
  background: #f8fafc;
  font-weight: 700;
  font-size: 0.82rem;
  border-bottom: 1px solid #111827;
}

.header-row-2 th {
  background: #f8fafc;
  font-weight: 600;
  font-size: 0.75rem;
}

.col-terr-no {
  width: 55px;
}

.col-last-date {
  width: 110px;
}

.col-assigned-slot {
  width: 21%;
}

.col-sub-date {
  width: 10.5%;
}

.cell-terr-no {
  font-size: 0.95rem;
  background: #fdfdfd;
}

.cell-last-completed {
  font-size: 0.8rem;
}

.cell-publisher-name {
  font-size: 0.85rem;
  height: 28px;
  background: #fbfbfb;
}

.cell-date {
  font-size: 0.78rem;
  height: 24px;
}

/* Print Rules */
@media print {
  /* Hide application shell elements */
  nav, header, .v-app-bar, .v-navigation-drawer, .v-tabs, button, .v-btn, .mb-2 {
    display: none !important;
  }

  .s13-document-wrapper {
    background: transparent !important;
    padding: 0 !important;
    overflow: visible !important;
    width: 100% !important;
    margin: 0 !important;
  }

  .s13-sheet {
    box-shadow: none !important;
    padding: 0 !important;
    max-width: 100% !important;
    min-width: 0 !important;
    width: 100% !important;
    margin: 0 !important;
  }

  .s13-grid-table {
    border-color: #000 !important;
  }

  .s13-grid-table th,
  .s13-grid-table td {
    border-color: #000 !important;
  }
}
</style>
