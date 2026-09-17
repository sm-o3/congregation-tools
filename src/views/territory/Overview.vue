<template>
  <div class="territory-overview">
    <!-- Header -->
    <v-row class="mb-2 align-center justify-space-between" dense>
      <v-col cols="12" sm="7">
        <h1 class="text-h4 font-weight-bold d-flex align-center ga-2">
          <v-icon color="primary">mdi-map-marker-radius</v-icon>
          Territory Overview
        </h1>
        <p class="text-body-2 text-medium-emphasis mt-1">
          Service year performance, completion frequency, and assignment tracking.
        </p>
      </v-col>

      <!-- Service Year Selector & Quick Navigation -->
      <v-col cols="12" sm="5" class="d-flex align-center justify-sm-end ga-2 flex-wrap mt-2 mt-sm-0">
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

        <v-menu location="bottom end">
          <template v-slot:activator="{ props }">
            <v-btn
              v-bind="props"
              color="primary"
              variant="tonal"
              density="comfortable"
              prepend-icon="mdi-navigation"
              append-icon="mdi-chevron-down"
            >
              Go To
            </v-btn>
          </template>
          <v-list density="compact" class="rounded-lg elevation-3">
            <v-list-item to="/territory/list" prepend-icon="mdi-format-list-bulleted" title="Territory List" />
            <v-list-item to="/territory/s13" prepend-icon="mdi-file-document-outline" title="S-13 Assignment Record" />
          </v-list>
        </v-menu>
      </v-col>
    </v-row>

    <!-- Loading State (Circle loading) -->
    <div v-if="loading" class="text-center pa-12 my-6">
      <v-progress-circular indeterminate color="primary" size="64" width="5" class="mb-3" />
      <div class="text-subtitle-1 font-weight-medium text-medium-emphasis">
        Loading territory statistics for Service Year {{ selectedServiceYear }}...
      </div>
    </div>

    <template v-else>
      <!-- Stat Cards: Single Row 4-Column Clickable Cards -->
      <v-row class="mb-3 stat-cards-row" dense>
        <!-- 1. Total Territories -->
        <v-col cols="3">
          <v-card hover class="stat-card stat-card-primary h-100" @click="openCardModal('total')">
            <v-card-text class="text-center pa-2 pa-sm-4 pa-md-5">
              <div class="stat-icon-wrap bg-primary mb-2 mb-sm-3">
                <v-icon color="white" class="stat-icon">mdi-map-marker-multiple</v-icon>
              </div>
              <div class="stat-number font-weight-bold text-primary">{{ totalTerritoriesCount }}</div>
              <div class="stat-label text-medium-emphasis text-truncate mt-1" title="Total Territories">
                Total Territories
              </div>
              <v-chip size="x-small" color="primary" variant="tonal" class="stat-badge mt-1 d-none d-sm-inline-flex">
                All Registered
              </v-chip>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- 2. Completed Territories -->
        <v-col cols="3">
          <v-card hover class="stat-card stat-card-success h-100" @click="openCardModal('completed')">
            <v-card-text class="text-center pa-2 pa-sm-4 pa-md-5">
              <div class="stat-icon-wrap bg-success mb-2 mb-sm-3">
                <v-icon color="white" class="stat-icon">mdi-check-decagram</v-icon>
              </div>
              <div class="stat-number font-weight-bold text-success">{{ completedTerritoriesCount }}</div>
              <div class="stat-label text-medium-emphasis text-truncate mt-1" title="Completed Territories">
                Completed
              </div>
              <v-chip size="x-small" color="success" variant="tonal" class="stat-badge mt-1 d-none d-sm-inline-flex">
                {{ completedRoundsTotal }} rounds
              </v-chip>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- 3. On-Progress Territories -->
        <v-col cols="3">
          <v-card hover class="stat-card stat-card-warning h-100" @click="openCardModal('inProgress')">
            <v-card-text class="text-center pa-2 pa-sm-4 pa-md-5">
              <div class="stat-icon-wrap bg-warning mb-2 mb-sm-3">
                <v-icon color="white" class="stat-icon">mdi-progress-clock</v-icon>
              </div>
              <div class="stat-number font-weight-bold text-warning">{{ inProgressTerritoriesCount }}</div>
              <div class="stat-label text-medium-emphasis text-truncate mt-1" title="On-Progress Territories">
                On-Progress
              </div>
              <v-chip size="x-small" color="warning" variant="tonal" class="stat-badge mt-1 d-none d-sm-inline-flex">
                Being Worked
              </v-chip>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- 4. Not-Yet Worked Territories -->
        <v-col cols="3">
          <v-card hover class="stat-card stat-card-error h-100" @click="openCardModal('notWorked')">
            <v-card-text class="text-center pa-2 pa-sm-4 pa-md-5">
              <div class="stat-icon-wrap bg-error mb-2 mb-sm-3">
                <v-icon color="white" class="stat-icon">mdi-clock-alert-outline</v-icon>
              </div>
              <div class="stat-number font-weight-bold text-error">{{ notWorkedTerritoriesCount }}</div>
              <div class="stat-label text-medium-emphasis text-truncate mt-1" title="Not-Yet Worked Territories">
                Not-Yet Worked
              </div>
              <v-chip size="x-small" color="error" variant="tonal" class="stat-badge mt-1 d-none d-sm-inline-flex">
                0 In SY
              </v-chip>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Main Overview Boxes (Recent Summary Box & Service Year Box) -->
      <v-row class="mt-2">
        <!-- Box 1: Recent Summary Box -->
        <v-col cols="12" md="6">
          <v-card class="h-100 rounded-xl elevation-1 border d-flex flex-column">
            <v-card-title class="pa-4 pb-3 d-flex align-center justify-space-between flex-wrap ga-2 border-b">
              <div class="d-flex align-center">
                <v-avatar color="success" variant="tonal" size="36" rounded="lg" class="mr-3">
                  <v-icon color="success" size="20">mdi-history</v-icon>
                </v-avatar>
                <div>
                  <div class="text-subtitle-1 font-weight-bold">Recent Summary</div>
                  <div class="text-caption text-medium-emphasis">
                    Recently completed territories in SY {{ selectedServiceYear }}
                  </div>
                </div>
              </div>

              <v-chip size="small" color="success" variant="tonal" class="font-weight-bold">
                {{ recentlyCompletedList.length }} Completed
              </v-chip>
            </v-card-title>

            <v-card-text class="pa-3 flex-grow-1 d-flex flex-column">
              <!-- Search within recent completed -->
              <v-text-field
                v-if="recentlyCompletedList.length > 5"
                v-model="recentSearch"
                density="compact"
                variant="outlined"
                placeholder="Search Terr No, Name, Publisher..."
                prepend-inner-icon="mdi-magnify"
                hide-details
                clearable
                class="mb-3"
              />

              <div v-if="filteredRecentlyCompleted.length > 0" class="recent-list-container flex-grow-1">
                <v-list bg-color="transparent" class="pa-0">
                  <v-list-item
                    v-for="item in filteredRecentlyCompleted"
                    :key="item.id || item.assignmentId"
                    rounded="lg"
                    class="px-3 py-2 mb-2 territory-item-card border"
                  >
                    <template v-slot:prepend>
                      <v-badge
                        color="success"
                        :content="`#${item.terrNo}`"
                        inline
                        class="font-weight-black mr-2 text-subtitle-2"
                      />
                    </template>

                    <v-list-item-title class="font-weight-bold text-body-2 d-flex align-center flex-wrap ga-1">
                      <span>{{ item.terrName || `Territory ${item.terrNo}` }}</span>
                      <v-chip
                        v-if="item.groupName"
                        size="x-small"
                        color="primary"
                        variant="tonal"
                        class="ml-1"
                      >
                        {{ item.groupName }}
                      </v-chip>
                      <v-chip
                        size="x-small"
                        color="success"
                        variant="flat"
                        class="ml-auto font-weight-medium"
                      >
                        Seq {{ item.seq || 1 }}
                      </v-chip>
                    </v-list-item-title>

                    <v-list-item-subtitle class="text-caption text-medium-emphasis mt-1 d-flex align-center justify-space-between flex-wrap ga-2">
                      <span class="d-flex align-center">
                        <v-icon size="14" class="mr-1" color="grey">mdi-account</v-icon>
                        {{ item.assignedTo || 'Unassigned' }}
                      </span>
                      <span class="d-flex align-center font-weight-bold text-success">
                        <v-icon size="14" class="mr-1" color="success">mdi-calendar-check</v-icon>
                        Completed: {{ item.dateCompleted }}
                      </span>
                    </v-list-item-subtitle>
                  </v-list-item>
                </v-list>
              </div>

              <!-- Empty State for Recent Summary -->
              <div v-else class="text-center pa-8 text-medium-emphasis border rounded-xl bg-grey-lighten-5 my-auto">
                <v-icon size="48" color="grey-lighten-1" class="mb-2">mdi-checkbox-blank-circle-outline</v-icon>
                <div class="text-body-1 font-weight-bold mb-1">No Completed Territories Yet</div>
                <div class="text-caption">
                  {{ recentSearch ? 'No completed territories match your search query.' : `No territories have been completed in Service Year ${selectedServiceYear} yet.` }}
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Box 2: Service Year Box -->
        <v-col cols="12" md="6">
          <v-card class="h-100 rounded-xl elevation-1 border d-flex flex-column">
            <v-card-title class="pa-4 pb-0 d-flex align-center justify-space-between flex-wrap ga-2 border-b">
              <div class="d-flex align-center">
                <v-avatar color="primary" variant="tonal" size="36" rounded="lg" class="mr-3">
                  <v-icon color="primary" size="20">mdi-calendar-sync</v-icon>
                </v-avatar>
                <div>
                  <div class="text-subtitle-1 font-weight-bold">Service Year Progress</div>
                  <div class="text-caption text-medium-emphasis">
                    SY {{ selectedServiceYear }} Completion frequency & unassigned list
                  </div>
                </div>
              </div>
            </v-card-title>

            <!-- Tabs inside Service Year Box -->
            <v-tabs v-model="serviceYearTab" color="primary" density="comfortable" grow class="border-b px-2">
              <v-tab value="completionCount" prepend-icon="mdi-sort-numeric-descending">
                Completions ({{ territoriesWithCompletions.length }})
              </v-tab>
              <v-tab value="unassigned" prepend-icon="mdi-map-marker-off">
                Unassigned ({{ unassignedTerritoriesList.length }})
              </v-tab>
            </v-tabs>

            <v-card-text class="pa-3 flex-grow-1 d-flex flex-column">
              <v-window v-model="serviceYearTab" class="h-100">
                <!-- Tab A: Each territory how many times completed, sorted Large to Small -->
                <v-window-item value="completionCount" class="h-100">
                  <v-text-field
                    v-if="territoriesWithCompletions.length > 5"
                    v-model="completionSearch"
                    density="compact"
                    variant="outlined"
                    placeholder="Search Terr No, Name..."
                    prepend-inner-icon="mdi-magnify"
                    hide-details
                    clearable
                    class="mb-3"
                  />

                  <div v-if="filteredCompletionList.length > 0" class="frequency-list-container">
                    <v-list bg-color="transparent" class="pa-0">
                      <v-list-item
                        v-for="terr in filteredCompletionList"
                        :key="terr.id || terr.number"
                        rounded="lg"
                        class="px-3 py-2 mb-2 territory-item-card border"
                      >
                        <template v-slot:prepend>
                          <v-badge
                            :color="terr.completionCount > 0 ? 'primary' : 'grey'"
                            :content="`#${terr.number}`"
                            inline
                            class="font-weight-black mr-2 text-subtitle-2"
                          />
                        </template>

                        <v-list-item-title class="font-weight-bold text-body-2 d-flex align-center flex-wrap ga-1">
                          <span>{{ terr.name }}</span>
                          <v-chip
                            v-if="terr.groupName"
                            size="x-small"
                            color="primary"
                            variant="tonal"
                            class="ml-1"
                          >
                            {{ terr.groupName }}
                          </v-chip>
                        </v-list-item-title>

                        <v-list-item-subtitle class="text-caption text-medium-emphasis mt-1 d-flex align-center justify-space-between flex-wrap ga-2">
                          <span v-if="terr.lastCompletedInSY">
                            Latest: {{ terr.lastCompletedInSY }}
                          </span>
                          <span v-else-if="terr.lastCompleted">
                            Prior: {{ terr.lastCompleted }}
                          </span>
                          <span v-else>
                            Not yet completed
                          </span>

                          <v-chip
                            size="small"
                            :color="terr.completionCount >= 2 ? 'purple' : terr.completionCount === 1 ? 'success' : 'grey'"
                            :variant="terr.completionCount > 0 ? 'flat' : 'outlined'"
                            class="font-weight-bold ml-auto"
                          >
                            <v-icon start size="14">mdi-check-all</v-icon>
                            {{ terr.completionCount }} {{ terr.completionCount === 1 ? 'time' : 'times' }} completed
                          </v-chip>
                        </v-list-item-subtitle>
                      </v-list-item>
                    </v-list>
                  </div>

                  <div v-else class="text-center pa-8 text-medium-emphasis border rounded-xl bg-grey-lighten-5">
                    <v-icon size="48" color="grey-lighten-1" class="mb-2">mdi-chart-line</v-icon>
                    <div class="text-body-1 font-weight-bold mb-1">No Territory Records</div>
                    <div class="text-caption">No registered territories match the criteria.</div>
                  </div>
                </v-window-item>

                <!-- Tab B: Unassigned Territory List -->
                <v-window-item value="unassigned" class="h-100">
                  <v-text-field
                    v-if="unassignedTerritoriesList.length > 5"
                    v-model="unassignedSearch"
                    density="compact"
                    variant="outlined"
                    placeholder="Search Unassigned Terr No, Name..."
                    prepend-inner-icon="mdi-magnify"
                    hide-details
                    clearable
                    class="mb-3"
                  />

                  <div v-if="filteredUnassignedList.length > 0" class="unassigned-list-container">
                    <v-list bg-color="transparent" class="pa-0">
                      <v-list-item
                        v-for="terr in filteredUnassignedList"
                        :key="terr.id || terr.number"
                        rounded="lg"
                        class="px-3 py-2 mb-2 territory-item-card border bg-red-lighten-5"
                      >
                        <template v-slot:prepend>
                          <v-badge
                            color="error"
                            :content="`#${terr.number}`"
                            inline
                            class="font-weight-black mr-2 text-subtitle-2"
                          />
                        </template>

                        <v-list-item-title class="font-weight-bold text-body-2 d-flex align-center flex-wrap ga-1">
                          <span>{{ terr.name }}</span>
                          <v-chip
                            size="x-small"
                            color="error"
                            variant="tonal"
                            class="ml-1"
                          >
                            {{ terr.groupName || 'Unassigned Group' }}
                          </v-chip>
                        </v-list-item-title>

                        <v-list-item-subtitle class="text-caption text-medium-emphasis mt-1 d-flex align-center justify-space-between flex-wrap ga-2">
                          <span v-if="terr.lastCompleted">
                            Last Worked: {{ terr.lastCompleted }}
                          </span>
                          <span v-else class="text-error font-weight-medium">
                            Never assigned yet
                          </span>

                          <v-btn
                            size="x-small"
                            color="primary"
                            variant="flat"
                            prepend-icon="mdi-plus"
                            to="/territory/s13"
                            class="ml-auto"
                          >
                            Assign in S-13
                          </v-btn>
                        </v-list-item-subtitle>
                      </v-list-item>
                    </v-list>
                  </div>

                  <div v-else class="text-center pa-8 text-medium-emphasis border rounded-xl bg-grey-lighten-5">
                    <v-icon size="48" color="success" class="mb-2">mdi-check-circle-outline</v-icon>
                    <div class="text-body-1 font-weight-bold text-success mb-1">All Territories Assigned!</div>
                    <div class="text-caption">
                      Every registered territory has been assigned at least once in Service Year {{ selectedServiceYear }}.
                    </div>
                  </div>
                </v-window-item>
              </v-window>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </template>

    <!-- Modal Dialog for Clickable Cards -->
    <v-dialog v-model="cardModalOpen" max-width="720px" scrollable>
      <v-card class="rounded-xl overflow-hidden">
        <v-card-title :class="cardModalHeaderClass" class="text-white pa-4 d-flex align-center justify-space-between">
          <div class="d-flex align-center ga-2">
            <v-icon color="white">{{ cardModalIcon }}</v-icon>
            <span class="font-weight-bold">{{ cardModalTitle }}</span>
            <v-chip size="small" color="white" variant="flat" class="text-primary font-weight-bold ml-2">
              {{ cardModalItems.length }}
            </v-chip>
          </div>
          <v-btn icon="mdi-close" variant="text" size="small" color="white" @click="cardModalOpen = false" />
        </v-card-title>

        <v-card-text class="pa-4">
          <!-- Filter search inside modal -->
          <v-text-field
            v-model="cardModalSearch"
            density="compact"
            variant="outlined"
            placeholder="Filter list by Terr No, Name, Publisher..."
            prepend-inner-icon="mdi-magnify"
            hide-details
            clearable
            class="mb-3"
          />

          <div class="modal-list-container">
            <v-table v-if="filteredCardModalItems.length > 0" density="comfortable" hover>
              <thead>
                <tr>
                  <th class="font-weight-bold">Terr.No</th>
                  <th class="font-weight-bold">Territory Name</th>
                  <th class="font-weight-bold">Group</th>
                  <th v-if="activeCardModalType === 'completed' || activeCardModalType === 'inProgress'" class="font-weight-bold">
                    Assigned To
                  </th>
                  <th class="font-weight-bold text-right">
                    {{ activeCardModalType === 'completed' ? 'Completed Date' : activeCardModalType === 'inProgress' ? 'Assigned Date' : 'Last Completed' }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in filteredCardModalItems" :key="item.id || item.number || item.terrNo">
                  <td class="font-weight-black text-primary">#{{ item.number || item.terrNo }}</td>
                  <td class="font-weight-medium">{{ item.name || item.terrName }}</td>
                  <td>
                    <v-chip size="x-small" color="primary" variant="tonal">
                      {{ item.groupName || 'Unassigned' }}
                    </v-chip>
                  </td>
                  <td v-if="activeCardModalType === 'completed' || activeCardModalType === 'inProgress'">
                    {{ item.assignedTo || '-' }}
                  </td>
                  <td class="text-right font-weight-medium text-caption">
                    <span v-if="activeCardModalType === 'completed'" class="text-success font-weight-bold">
                      {{ item.dateCompleted }}
                    </span>
                    <span v-else-if="activeCardModalType === 'inProgress'" class="text-warning font-weight-bold">
                      {{ item.dateAssigned }}
                    </span>
                    <span v-else>
                      {{ item.lastCompleted || 'Never' }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </v-table>

            <div v-else class="text-center pa-8 text-medium-emphasis">
              <v-icon size="40" color="grey" class="mb-2">mdi-filter-variant-remove</v-icon>
              <div>No territories match your filter.</div>
            </div>
          </div>
        </v-card-text>

        <v-divider />

        <v-card-actions class="pa-3 d-flex justify-space-between flex-wrap ga-2">
          <div class="d-flex ga-2">
            <v-btn
              color="primary"
              variant="tonal"
              size="small"
              prepend-icon="mdi-format-list-bulleted"
              to="/territory/list"
              @click="cardModalOpen = false"
            >
              Territory List
            </v-btn>
            <v-btn
              color="primary"
              variant="tonal"
              size="small"
              prepend-icon="mdi-file-document-outline"
              to="/territory/s13"
              @click="cardModalOpen = false"
            >
              S-13 Records
            </v-btn>
          </div>
          <v-btn variant="flat" color="primary" size="small" @click="cardModalOpen = false">
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/config/firebase'

// Loading State
const loading = ref(true)

// Service Year Selection (2020 to 2035)
const selectedServiceYear = ref(getCurrentServiceYear())

// Sub-tabs in Service Year box
const serviceYearTab = ref('completionCount')

// Search inputs
const recentSearch = ref('')
const completionSearch = ref('')
const unassignedSearch = ref('')

// Modal Dialog for Stat Cards
const cardModalOpen = ref(false)
const activeCardModalType = ref('total')
const cardModalSearch = ref('')

// Data Collections
const territories = ref([])
const assignments = ref([])
const groups = ref([])

// Helper: Get Current Service Year (Sept 1 - Aug 31)
function getCurrentServiceYear() {
  const d = new Date()
  const year = d.getFullYear()
  const month = d.getMonth() + 1
  const startYear = month >= 9 ? year : year - 1
  return `${startYear}-${startYear + 1}`
}

function calculateServiceYear(dateStr) {
  if (!dateStr) return getCurrentServiceYear()
  const str = String(dateStr).trim()
  if (/^\d{4}-\d{4}$/.test(str)) return str

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

// Service Year Options: 2020 through 2035 (2035-2036)
const serviceYearOptions = computed(() => {
  const list = []
  for (let y = 2020; y <= 2035; y++) {
    list.push(`${y}-${y + 1}`)
  }
  return list
})

// Sorted Territories Numerically (0 to ...)
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

// Assignments belonging strictly to the selected Service Year
const currentSYAssignments = computed(() => {
  return assignments.value.filter(a => matchesServiceYear(a.serviceYear, a.dateAssigned, selectedServiceYear.value))
})

// Territory assignment lookup maps for selected Service Year
const assignedTerrNosSet = computed(() => {
  const set = new Set()
  for (const a of currentSYAssignments.value) {
    if (a.terrNo !== undefined && a.terrNo !== null && String(a.terrNo).trim() !== '') {
      set.add(String(a.terrNo).trim())
    }
  }
  return set
})

// Completed assignments in current Service Year
const completedSYAssignments = computed(() => {
  return currentSYAssignments.value.filter(a => !!a.dateCompleted || a.status === 'Completed')
})

// Distinct completed territory numbers in current Service Year
const completedTerrNosSet = computed(() => {
  const set = new Set()
  for (const a of completedSYAssignments.value) {
    if (a.terrNo) set.add(String(a.terrNo).trim())
  }
  return set
})

// In-progress assignments in current Service Year
const inProgressSYAssignments = computed(() => {
  return currentSYAssignments.value.filter(a => !a.dateCompleted && a.status !== 'Completed')
})

// Distinct in-progress territory numbers in current Service Year
const inProgressTerrNosSet = computed(() => {
  const set = new Set()
  for (const a of inProgressSYAssignments.value) {
    if (a.terrNo) set.add(String(a.terrNo).trim())
  }
  return set
})

// --- 4 STAT CARD COUNTS ---
const totalTerritoriesCount = computed(() => territories.value.length)
const completedTerritoriesCount = computed(() => completedTerrNosSet.value.size)
const completedRoundsTotal = computed(() => completedSYAssignments.value.length)
const inProgressTerritoriesCount = computed(() => inProgressTerrNosSet.value.size)
const notWorkedTerritoriesCount = computed(() => {
  return territories.value.filter(t => !assignedTerrNosSet.value.has(String(t.number).trim())).length
})

// --- RECENT SUMMARY BOX: RECENTLY COMPLETED SORTED BY DATE COMPLETED DESCENDING ---
const recentlyCompletedList = computed(() => {
  return [...completedSYAssignments.value].sort((a, b) => {
    const dateA = a.dateCompleted ? new Date(a.dateCompleted).getTime() : 0
    const dateB = b.dateCompleted ? new Date(b.dateCompleted).getTime() : 0
    return dateB - dateA
  })
})

const filteredRecentlyCompleted = computed(() => {
  let list = recentlyCompletedList.value
  if (recentSearch.value) {
    const q = recentSearch.value.toLowerCase().trim()
    list = list.filter(item =>
      String(item.terrNo).toLowerCase().includes(q) ||
      (item.terrName && item.terrName.toLowerCase().includes(q)) ||
      (item.assignedTo && item.assignedTo.toLowerCase().includes(q)) ||
      (item.groupName && item.groupName.toLowerCase().includes(q)) ||
      (item.dateCompleted && item.dateCompleted.toLowerCase().includes(q))
    )
  }
  return list
})

// --- SERVICE YEAR BOX: COMPLETION FREQUENCY (HIGH TO LOW) ---
const territoriesWithCompletions = computed(() => {
  // Count completions per territory number in current Service Year
  const countsMap = {}
  const latestDateMap = {}

  for (const a of completedSYAssignments.value) {
    const key = String(a.terrNo).trim()
    countsMap[key] = (countsMap[key] || 0) + 1
    if (a.dateCompleted) {
      if (!latestDateMap[key] || new Date(a.dateCompleted) > new Date(latestDateMap[key])) {
        latestDateMap[key] = a.dateCompleted
      }
    }
  }

  // Map over all sorted territories
  const list = sortedTerritories.value.map(t => {
    const key = String(t.number).trim()
    return {
      ...t,
      completionCount: countsMap[key] || 0,
      lastCompletedInSY: latestDateMap[key] || ''
    }
  })

  // Sort by completionCount descending (large to small); if equal, sort by territory number
  return list.sort((a, b) => {
    if (b.completionCount !== a.completionCount) {
      return b.completionCount - a.completionCount
    }
    const numA = parseInt(String(a.number).replace(/\D/g, ''), 10) || 0
    const numB = parseInt(String(b.number).replace(/\D/g, ''), 10) || 0
    return numA - numB
  })
})

const filteredCompletionList = computed(() => {
  let list = territoriesWithCompletions.value
  if (completionSearch.value) {
    const q = completionSearch.value.toLowerCase().trim()
    list = list.filter(t =>
      String(t.number).toLowerCase().includes(q) ||
      (t.name && t.name.toLowerCase().includes(q)) ||
      (t.groupName && t.groupName.toLowerCase().includes(q))
    )
  }
  return list
})

// --- SERVICE YEAR BOX: UNASSIGNED TERRITORIES IN CURRENT SERVICE YEAR ---
const unassignedTerritoriesList = computed(() => {
  return sortedTerritories.value.filter(t => !assignedTerrNosSet.value.has(String(t.number).trim()))
})

const filteredUnassignedList = computed(() => {
  let list = unassignedTerritoriesList.value
  if (unassignedSearch.value) {
    const q = unassignedSearch.value.toLowerCase().trim()
    list = list.filter(t =>
      String(t.number).toLowerCase().includes(q) ||
      (t.name && t.name.toLowerCase().includes(q)) ||
      (t.groupName && t.groupName.toLowerCase().includes(q))
    )
  }
  return list
})

// --- STAT CARD MODAL HANDLERS ---
function openCardModal(type) {
  activeCardModalType.value = type
  cardModalSearch.value = ''
  cardModalOpen.value = true
}

const cardModalTitle = computed(() => {
  switch (activeCardModalType.value) {
    case 'total':
      return 'All Registered Territories'
    case 'completed':
      return `Completed Territories (SY ${selectedServiceYear.value})`
    case 'inProgress':
      return `On-Progress Territories (SY ${selectedServiceYear.value})`
    case 'notWorked':
      return `Not-Yet Worked Territories (SY ${selectedServiceYear.value})`
    default:
      return 'Territories'
  }
})

const cardModalIcon = computed(() => {
  switch (activeCardModalType.value) {
    case 'total':
      return 'mdi-map-marker-multiple'
    case 'completed':
      return 'mdi-check-decagram'
    case 'inProgress':
      return 'mdi-progress-clock'
    case 'notWorked':
      return 'mdi-clock-alert-outline'
    default:
      return 'mdi-map'
  }
})

const cardModalHeaderClass = computed(() => {
  switch (activeCardModalType.value) {
    case 'total':
      return 'bg-primary'
    case 'completed':
      return 'bg-success'
    case 'inProgress':
      return 'bg-warning'
    case 'notWorked':
      return 'bg-error'
    default:
      return 'bg-primary'
  }
})

const cardModalItems = computed(() => {
  switch (activeCardModalType.value) {
    case 'total':
      return sortedTerritories.value
    case 'completed':
      return completedSYAssignments.value
    case 'inProgress':
      return inProgressSYAssignments.value
    case 'notWorked':
      return unassignedTerritoriesList.value
    default:
      return []
  }
})

const filteredCardModalItems = computed(() => {
  let list = cardModalItems.value
  if (cardModalSearch.value) {
    const q = cardModalSearch.value.toLowerCase().trim()
    list = list.filter(item => {
      const num = String(item.number || item.terrNo || '').toLowerCase()
      const name = String(item.name || item.terrName || '').toLowerCase()
      const group = String(item.groupName || '').toLowerCase()
      const assigned = String(item.assignedTo || '').toLowerCase()
      return num.includes(q) || name.includes(q) || group.includes(q) || assigned.includes(q)
    })
  }
  return list
})

// --- LIFECYCLE & DATA LOADING ---
onMounted(async () => {
  await Promise.all([
    loadTerritories(),
    loadAssignments(),
    loadGroups()
  ])
})

async function loadTerritories() {
  try {
    const snap = await getDocs(collection(db, 'territories'))
    territories.value = snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  } catch (err) {
    console.error('Error loading territories in overview:', err)
  }
}

async function loadAssignments() {
  try {
    const snap = await getDocs(collection(db, 'territoryAssignments'))
    assignments.value = snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  } catch (err) {
    console.error('Error loading assignments in overview:', err)
  } finally {
    loading.value = false
  }
}

async function loadGroups() {
  try {
    const snap = await getDocs(collection(db, 'groups'))
    groups.value = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  } catch (err) {
    console.error('Error loading groups in overview:', err)
  }
}
</script>

<style scoped>
/* Stat Cards: Single Row 4-Column responsive layout */
.stat-card {
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 14px;
}

.stat-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12) !important;
}

.stat-icon-wrap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* Mobile optimizations for 4 cards in single row */
@media (max-width: 600px) {
  .stat-icon-wrap {
    width: 28px;
    height: 28px;
    border-radius: 8px;
  }

  .stat-icon {
    font-size: 16px !important;
  }

  .stat-number {
    font-size: 1.15rem !important;
    line-height: 1.2 !important;
  }

  .stat-label {
    font-size: 0.65rem !important;
    letter-spacing: -0.2px;
  }
}

@media (min-width: 601px) {
  .stat-icon-wrap {
    width: 46px;
    height: 46px;
    border-radius: 12px;
  }

  .stat-icon {
    font-size: 24px !important;
  }

  .stat-number {
    font-size: 1.85rem !important;
    line-height: 1.2 !important;
  }

  .stat-label {
    font-size: 0.8rem !important;
    font-weight: 500;
  }
}

.territory-item-card {
  transition: background-color 0.2s ease;
}

.territory-item-card:hover {
  background-color: rgba(var(--v-theme-primary), 0.04);
}

.recent-list-container,
.frequency-list-container,
.unassigned-list-container {
  max-height: 420px;
  overflow-y: auto;
  padding-right: 2px;
}

.modal-list-container {
  max-height: 450px;
  overflow-y: auto;
}

/* Custom smooth scrollbar */
.recent-list-container::-webkit-scrollbar,
.frequency-list-container::-webkit-scrollbar,
.unassigned-list-container::-webkit-scrollbar,
.modal-list-container::-webkit-scrollbar {
  width: 6px;
}

.recent-list-container::-webkit-scrollbar-thumb,
.frequency-list-container::-webkit-scrollbar-thumb,
.unassigned-list-container::-webkit-scrollbar-thumb,
.modal-list-container::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.15);
  border-radius: 4px;
}

.h-100 {
  height: 100%;
}
</style>
