<template>
  <div>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-4">Reports Overview</h1>
      </v-col>
    </v-row>
    
    <!-- Month/Year Selector -->
    <v-row>
      <v-col cols="12" md="8">
        <v-card>
          <v-card-text>
            <v-row align="center">
              <v-col cols="6" sm="3">
                <v-select
                  v-model="selectedMonth"
                  :items="months"
                  item-title="name"
                  item-value="value"
                  label="Month"
                  density="comfortable"
                  hide-details
                  @update:model-value="onDateChange"
                />
              </v-col>
              <v-col cols="6" sm="3">
                <v-select
                  v-model="selectedYear"
                  :items="years"
                  label="Year"
                  density="comfortable"
                  hide-details
                  @update:model-value="onDateChange"
                />
              </v-col>
              <v-col cols="12" sm="6" v-if="authStore.isAdmin" class="d-flex align-center">
                <v-btn
                  v-if="monthStatus !== 'closed'"
                  color="error"
                  variant="tonal"
                  prepend-icon="mdi-lock"
                  @click="toggleMonthStatus('closed')"
                  :loading="updatingStatus"
                  class="mr-2"
                >
                  Monthly Closeout
                </v-btn>
                <v-btn
                  v-else
                  color="success"
                  variant="tonal"
                  prepend-icon="mdi-lock-open"
                  @click="toggleMonthStatus('open')"
                  :loading="updatingStatus"
                  class="mr-2"
                >
                  Reopen
                </v-btn>
              </v-col>
            </v-row>
            <v-row v-if="monthStatusInfo" class="mt-1">
              <v-col cols="12">
                <div class="text-caption d-flex align-center" :class="monthStatus === 'closed' ? 'text-error' : 'text-success'">
                  <v-icon size="16" class="mr-1">{{ monthStatus === 'closed' ? 'mdi-lock' : 'mdi-lock-open' }}</v-icon>
                  {{ monthStatusInfo }}
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    
    <!-- Congregation Stats (All Active Publishers & Not Yet Reported in same row) -->
    <v-row class="mt-4">
      <v-col cols="12">
        <h2 class="text-h5 mb-2">
          Congregation Stats
        </h2>
      </v-col>
    </v-row>
    <v-row>
      <!-- All Active Publishers -->
      <v-col cols="6" sm="6">
        <v-card hover class="clickable-card stat-card" color="indigo" variant="tonal">
          <v-card-text class="pa-2 pa-sm-4">
            <div class="d-flex align-center justify-space-between flex-wrap ga-1">
              <div class="d-flex align-center">
                <v-icon size="28" class="mr-2" color="indigo">mdi-account-check</v-icon>
                <div>
                  <div class="text-caption text-indigo font-weight-medium text-truncate">All Active Publishers</div>
                  <div class="text-h5 text-sm-h4 font-weight-bold text-indigo">{{ activePublishersCount }}</div>
                </div>
              </div>
              <v-chip color="indigo" variant="flat" size="x-small" class="mt-1 mt-sm-0">
                Last 6 months
              </v-chip>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Not Yet Reported -->
      <v-col cols="6" sm="6">
        <v-card hover class="clickable-card stat-card" color="error" variant="tonal" @click="notReportedDialog = true">
          <v-card-text class="pa-2 pa-sm-4">
            <div class="d-flex align-center justify-space-between flex-wrap ga-1">
              <div class="d-flex align-center">
                <v-icon size="28" class="mr-2" color="error">mdi-alert-circle-outline</v-icon>
                <div>
                  <div class="text-caption text-error font-weight-medium text-truncate">Not Yet Reported</div>
                  <div class="text-h5 text-sm-h4 font-weight-bold text-error">{{ stats.notYetReported }}</div>
                </div>
              </div>
              <v-chip color="error" variant="flat" size="x-small" class="mt-1 mt-sm-0">
                of {{ stats.totalPublishers }} total
              </v-chip>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Meeting Attendance Summary Table -->
    <v-row class="mt-6" v-if="canViewAttendanceTable">
      <v-col cols="12">
        <div class="d-flex align-center justify-space-between mb-2">
          <h2 class="text-h5 d-flex align-center ga-2">
            <v-icon color="primary">mdi-calendar-table</v-icon>
            Meeting Attendance
          </h2>
          <v-btn
            size="small"
            variant="tonal"
            color="primary"
            to="/reports/meeting-attendance-list"
            prepend-icon="mdi-format-list-bulleted"
          >
            View Details
          </v-btn>
        </div>

        <v-card variant="outlined" class="rounded-xl overflow-hidden border">
          <v-table class="attendance-table" density="comfortable">
            <thead>
              <tr>
                <th class="font-weight-bold text-left border-right px-4"></th>
                <th class="font-weight-bold text-center border-right px-3">1st week</th>
                <th class="font-weight-bold text-center border-right px-3">2nd week</th>
                <th class="font-weight-bold text-center border-right px-3">3rd week</th>
                <th class="font-weight-bold text-center border-right px-3">4th week</th>
                <th class="font-weight-bold text-center border-right px-3">5th week</th>
                <th class="font-weight-bold text-center border-right px-3">Total</th>
                <th class="font-weight-bold text-center px-3">Average</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="font-weight-bold border-right px-4 text-primary">
                  Midweek Meeting
                </td>
                <td class="text-center border-right px-3">{{ meetingAttendanceSummary.midweek.w1 }}</td>
                <td class="text-center border-right px-3">{{ meetingAttendanceSummary.midweek.w2 }}</td>
                <td class="text-center border-right px-3">{{ meetingAttendanceSummary.midweek.w3 }}</td>
                <td class="text-center border-right px-3">{{ meetingAttendanceSummary.midweek.w4 }}</td>
                <td class="text-center border-right px-3">{{ meetingAttendanceSummary.midweek.w5 }}</td>
                <td class="text-center border-right px-3 font-weight-bold text-primary">{{ meetingAttendanceSummary.midweek.total }}</td>
                <td class="text-center px-3 font-weight-bold text-primary">{{ meetingAttendanceSummary.midweek.avg }}</td>
              </tr>
              <tr>
                <td class="font-weight-bold border-right px-4 text-purple">
                  Weekend Meeting
                </td>
                <td class="text-center border-right px-3">{{ meetingAttendanceSummary.weekend.w1 }}</td>
                <td class="text-center border-right px-3">{{ meetingAttendanceSummary.weekend.w2 }}</td>
                <td class="text-center border-right px-3">{{ meetingAttendanceSummary.weekend.w3 }}</td>
                <td class="text-center border-right px-3">{{ meetingAttendanceSummary.weekend.w4 }}</td>
                <td class="text-center border-right px-3">{{ meetingAttendanceSummary.weekend.w5 }}</td>
                <td class="text-center border-right px-3 font-weight-bold text-purple">{{ meetingAttendanceSummary.weekend.total }}</td>
                <td class="text-center px-3 font-weight-bold text-purple">{{ meetingAttendanceSummary.weekend.avg }}</td>
              </tr>
            </tbody>
          </v-table>
        </v-card>
      </v-col>
    </v-row>

    <!-- Section 1: Publishers -->
    <v-row class="mt-6">
      <v-col cols="12">
        <h2 class="text-h5 mb-2">
          <v-icon class="mr-2" color="success">mdi-account-group</v-icon>
          Publishers
        </h2>
      </v-col>
    </v-row>
    
    <v-row>
      <v-col cols="4" sm="4">
        <v-card hover class="clickable-card stat-card" @click="navigateToReports('shared', 'true')">
          <v-card-text class="text-center pa-2 pa-sm-4">
            <div class="text-caption text-grey mb-1 text-truncate">Reports (Shared)</div>
            <div class="text-h5 text-sm-h3 font-weight-bold text-primary">{{ stats.publisherShared }}</div>
            <v-divider class="my-1 my-sm-3" />
            <div class="d-flex justify-center">
              <v-chip size="x-small" density="compact" color="primary" variant="tonal">
                Shared in Min
              </v-chip>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="4" sm="4">
        <v-card hover class="clickable-card stat-card" @click="navigateToReports('shared', 'false')">
          <v-card-text class="text-center pa-2 pa-sm-4">
            <div class="text-caption text-grey mb-1 text-truncate">Reports (Not Shared)</div>
            <div class="text-h5 text-sm-h3 font-weight-bold text-error">{{ stats.publisherNotShared }}</div>
            <v-divider class="my-1 my-sm-3" />
            <div class="d-flex justify-center">
              <v-chip size="x-small" density="compact" color="error" variant="tonal">
                Not Shared
              </v-chip>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="4" sm="4">
        <v-card hover class="clickable-card stat-card" @click="navigateToReports({ category: 'publisher', hasStudies: 'true' })">
          <v-card-text class="text-center pa-2 pa-sm-4">
            <div class="text-caption text-grey mb-1 text-truncate">Bible Studies</div>
            <div class="text-h5 text-sm-h3 font-weight-bold text-warning">{{ stats.publisherStudies }}</div>
            <v-divider class="my-1 my-sm-3" />
            <div class="d-flex justify-center">
              <v-chip size="x-small" density="compact" color="warning" variant="tonal">
                Avg: {{ stats.publisherAvgStudies }} / pub
              </v-chip>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    
    <!-- Section 2: Auxiliary Pioneers -->
    <v-row class="mt-6">
      <v-col cols="12">
        <h2 class="text-h5 mb-2">
          <v-icon class="mr-2" color="purple">mdi-star-half-full</v-icon>
          Auxiliary Pioneers
        </h2>
      </v-col>
    </v-row>
    
    <v-row>
      <v-col cols="4" sm="4">
        <v-card hover class="clickable-card stat-card" @click="navigateToReports('auxiliaryPioneer', 'true')">
          <v-card-text class="text-center pa-2 pa-sm-4">
            <div class="text-caption text-grey mb-1 text-truncate">Number of Reports</div>
            <div class="text-h5 text-sm-h3 font-weight-bold text-purple">{{ stats.apCount }}</div>
            <v-divider class="my-1 my-sm-3" />
            <div class="d-flex justify-center">
              <v-chip size="x-small" density="compact" color="purple" variant="tonal">
                Avg: {{ stats.apAvgCount }} / mo
              </v-chip>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="4" sm="4">
        <v-card hover class="clickable-card stat-card" @click="navigateToReports('auxiliaryPioneer', 'true')">
          <v-card-text class="text-center pa-2 pa-sm-4">
            <div class="text-caption text-grey mb-1 text-truncate">Hours</div>
            <div class="text-h5 text-sm-h3 font-weight-bold text-primary">{{ stats.apHours }}</div>
            <v-divider class="my-1 my-sm-3" />
            <div class="d-flex justify-center">
              <v-chip size="x-small" density="compact" color="primary" variant="tonal">
                Avg: {{ stats.apAvgHours }} hrs
              </v-chip>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="4" sm="4">
        <v-card hover class="clickable-card stat-card" @click="navigateToReports({ auxiliaryPioneer: 'true', hasStudies: 'true' })">
          <v-card-text class="text-center pa-2 pa-sm-4">
            <div class="text-caption text-grey mb-1 text-truncate">Bible Studies</div>
            <div class="text-h5 text-sm-h3 font-weight-bold text-warning">{{ stats.apStudies }}</div>
            <v-divider class="my-1 my-sm-3" />
            <div class="d-flex justify-center">
              <v-chip size="x-small" density="compact" color="warning" variant="tonal">
                Avg: {{ stats.apAvgStudies }} / pio
              </v-chip>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    
    <!-- Section 3: Regular Pioneers -->
    <v-row class="mt-6">
      <v-col cols="12">
        <h2 class="text-h5 mb-2">
          <v-icon class="mr-2" color="info">mdi-star</v-icon>
          Regular Pioneers
        </h2>
      </v-col>
    </v-row>
    
    <v-row>
      <v-col cols="4" sm="4">
        <v-card hover class="clickable-card stat-card" @click="navigateToReports('pioneer', 'Regular Pioneer')">
          <v-card-text class="text-center pa-2 pa-sm-4">
            <div class="text-caption text-grey mb-1 text-truncate">Number of Reports</div>
            <div class="text-h5 text-sm-h3 font-weight-bold text-info">{{ stats.rpCount }}</div>
            <v-divider class="my-1 my-sm-3" />
            <div class="d-flex justify-center">
              <v-chip size="x-small" density="compact" color="info" variant="tonal">
                Avg: {{ stats.rpAvgCount }} / mo
              </v-chip>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="4" sm="4">
        <v-card hover class="clickable-card stat-card" @click="navigateToReports('pioneer', 'Regular Pioneer')">
          <v-card-text class="text-center pa-2 pa-sm-4">
            <div class="text-caption text-grey mb-1 text-truncate">Hours</div>
            <div class="text-h5 text-sm-h3 font-weight-bold text-primary">{{ stats.rpHours }}</div>
            <v-divider class="my-1 my-sm-3" />
            <div class="d-flex justify-center">
              <v-chip size="x-small" density="compact" color="primary" variant="tonal">
                Avg: {{ stats.rpAvgHours }} hrs
              </v-chip>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="4" sm="4">
        <v-card hover class="clickable-card stat-card" @click="navigateToReports({ pioneer: 'Regular Pioneer', hasStudies: 'true' })">
          <v-card-text class="text-center pa-2 pa-sm-4">
            <div class="text-caption text-grey mb-1 text-truncate">Bible Studies</div>
            <div class="text-h5 text-sm-h3 font-weight-bold text-warning">{{ stats.rpStudies }}</div>
            <v-divider class="my-1 my-sm-3" />
            <div class="d-flex justify-center">
              <v-chip size="x-small" density="compact" color="warning" variant="tonal">
                Avg: {{ stats.rpAvgStudies }} / pio
              </v-chip>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    
    <!-- Not Yet Reported Dialog -->
    <v-dialog v-model="notReportedDialog" max-width="700" scrollable>
      <v-card class="rounded-xl border border-error">
        <v-card-title class="d-flex align-center bg-error pa-4">
          <v-icon class="mr-3" color="white" size="28">mdi-alert-circle-outline</v-icon>
          <span class="text-white text-h6 font-weight-bold">Not Yet Reported ({{ stats.notYetReported }})</span>
          <v-spacer />
          <v-btn icon variant="text" color="white" @click="notReportedDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        
        <v-card-text class="pa-0 bg-grey-lighten-4">
          <v-expansion-panels variant="accordion" multiple>
            <v-expansion-panel
              v-for="groupData in missingPublishersByGroup"
              :key="groupData.groupName"
            >
              <v-expansion-panel-title>
                <div class="d-flex align-center w-100">
                  <v-icon class="mr-2" size="small" color="primary">mdi-account-group</v-icon>
                  <strong>{{ groupData.groupName }}</strong>
                  <v-spacer />
                  <v-chip size="small" color="error" variant="tonal">
                    {{ groupData.publishers.length }} pending
                  </v-chip>
                </div>
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <v-list density="compact" class="pa-0">
                  <v-list-item
                    v-for="pub in groupData.publishers"
                    :key="pub.id"
                  >
                    <template v-slot:prepend>
                      <v-avatar size="32" color="grey-lighten-3" class="mr-3">
                        <span class="text-grey-darken-2 font-weight-bold">{{ pub.name.charAt(0).toUpperCase() }}</span>
                      </v-avatar>
                    </template>
                    <v-list-item-title class="font-weight-medium">{{ pub.name }}</v-list-item-title>
                    <v-list-item-subtitle>
                      {{ pub.role || 'Publisher' }}
                      <span v-if="pub.pioneerType" class="text-primary font-weight-medium"> · {{ pub.pioneerType }}</span>
                    </v-list-item-subtitle>
                  </v-list-item>
                </v-list>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
          
          <div v-if="missingPublishersByGroup.length === 0" class="text-center pa-8">
            <v-icon size="48" color="success" class="mb-2">mdi-check-circle</v-icon>
            <div class="text-success font-weight-bold">All reports submitted!</div>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { collection, query, where, getDocs, doc, setDoc, getDoc } from 'firebase/firestore'
import { db } from '@/config/firebase'
import { useAuthStore } from '@/stores/auth'
import { logActivity } from '@/utils/logging'

const authStore = useAuthStore()
const router = useRouter()

const canViewAttendanceTable = computed(() => {
  if (authStore.isEditor && (authStore.isPublisher || authStore.isMS)) {
    return authStore.isAttendant
  }
  return true
})

const monthStatus = ref('open')
const monthStatusInfo = ref('')
const updatingStatus = ref(false)

// Default to previous month
const currentDate = new Date()
let defaultYear = currentDate.getFullYear()
let defaultMonth = currentDate.getMonth() - 1

// Handle January roll-back
if (defaultMonth < 0) {
  defaultMonth = 11
  defaultYear--
}

const selectedMonth = ref(defaultMonth)
const selectedYear = ref(defaultYear)
const reports = ref([])
const allRecentReports = ref([])
const publishers = ref([])
const groups = ref([])
const meetingAttendanceData = ref([])
const loading = ref(false)
const notReportedDialog = ref(false)

const activePublishersCount = computed(() => {
  if (allRecentReports.value.length === 0) return 0
  const uniquePublisherIds = new Set(allRecentReports.value.map(r => r.publisherId))
  const existingPublisherIds = new Set(publishers.value.map(p => p.id))
  let count = 0
  uniquePublisherIds.forEach(id => {
    if (existingPublisherIds.has(id)) count++
  })
  return count
})

const months = [
  { name: 'January', value: 0 },
  { name: 'February', value: 1 },
  { name: 'March', value: 2 },
  { name: 'April', value: 3 },
  { name: 'May', value: 4 },
  { name: 'June', value: 5 },
  { name: 'July', value: 6 },
  { name: 'August', value: 7 },
  { name: 'September', value: 8 },
  { name: 'October', value: 9 },
  { name: 'November', value: 10 },
  { name: 'December', value: 11 }
]

const years = Array.from({ length: 12 }, (_, i) => 2024 + i)

// Compute Meeting Attendance Summary for Selected Month and Year
const meetingAttendanceSummary = computed(() => {
  const getRowSummary = (type) => {
    const records = meetingAttendanceData.value.filter(r => {
      if (r.isMemorial) return false
      const t = (r.meetingType || '').toLowerCase()
      if (type === 'Midweek Meeting') return t.includes('midweek')
      if (type === 'Weekend Meeting') return t.includes('weekend')
      return false
    })
    
    // Calculate total attendance for each week (1st week to 5th week)
    const weeks = [1, 2, 3, 4, 5].map(wNum => {
      const recs = records.filter(r => {
        let w = r.weekNumber
        if ((w === undefined || w === null) && r.date) {
          const parts = r.date.split('-')
          if (parts.length >= 3) {
            const day = parseInt(parts[2])
            w = Math.min(5, Math.ceil(day / 7))
          }
        }
        return Number(w) === wNum
      })
      if (recs.length === 0) return null
      return recs.reduce((sum, r) => sum + (Number(r.total) || (Number(r.inPerson) || 0) + (Number(r.zoom) || 0)), 0)
    })

    const validWeekCounts = weeks.filter(w => w !== null)
    const totalSum = records.reduce((sum, r) => sum + (Number(r.total) || (Number(r.inPerson) || 0) + (Number(r.zoom) || 0)), 0)
    const avg = validWeekCounts.length > 0 ? (totalSum / validWeekCounts.length).toFixed(1) : '-'

    return {
      type,
      w1: weeks[0] !== null ? weeks[0] : '-',
      w2: weeks[1] !== null ? weeks[1] : '-',
      w3: weeks[2] !== null ? weeks[2] : '-',
      w4: weeks[3] !== null ? weeks[3] : '-',
      w5: weeks[4] !== null ? weeks[4] : '-',
      total: records.length > 0 ? totalSum : '-',
      avg
    }
  }

  return {
    midweek: getRowSummary('Midweek Meeting'),
    weekend: getRowSummary('Weekend Meeting')
  }
})

// Navigation to Reports List with filters
const navigateToReports = (filterKeyOrObject, filterValue) => {
  const queryParams = {
    month: selectedMonth.value + 1,
    year: selectedYear.value
  }
  
  if (typeof filterKeyOrObject === 'object') {
    Object.assign(queryParams, filterKeyOrObject)
  } else if (filterKeyOrObject && filterValue) {
    queryParams[filterKeyOrObject] = filterValue
  }
  
  router.push({
    name: 'ReportsList',
    query: queryParams
  })
}

// Calculate statistics
const stats = computed(() => {
  const totalReports = reports.value.length
  
  // --- Publisher Category ---
  const publisherReports = reports.value.filter(r => {
    const publisher = publishers.value.find(p => p.id === r.publisherId)
    if (!publisher) return false
    if (publisher.pioneerType === 'RP') return false
    if (r.auxiliaryPioneer) return false
    return true
  })
  
  const publisherCount = publisherReports.length
  const publisherShared = publisherReports.filter(r => r.sharedInMinistry === true).length
  const publisherNotShared = publisherCount - publisherShared
  const publisherStudies = publisherReports.reduce((sum, r) => sum + (r.studies || 0), 0)
  
  // --- Not Yet Reported ---
  const reportedPublisherIds = reports.value.map(r => r.publisherId)
  const targetEnd = new Date(selectedYear.value, selectedMonth.value + 1, 0, 23, 59, 59)

  const isEligiblePublisher = (p) => {
    if (p.role === 'Inactive Publisher' || p.role === 'Removed' || p.role === 'Children') {
      return false
    }
    if (p.createdAt) {
      const createdDate = p.createdAt.toDate ? p.createdAt.toDate() : new Date(p.createdAt)
      if (!isNaN(createdDate.getTime()) && createdDate > targetEnd) {
        return false
      }
    }
    return true
  }

  const eligiblePublishers = publishers.value.filter(isEligiblePublisher)
  const totalPublishers = eligiblePublishers.length
  const notYetReported = eligiblePublishers.filter(p => !reportedPublisherIds.includes(p.id)).length
  
  // --- Auxiliary Pioneer Category ---
  const apReports = reports.value.filter(r => r.auxiliaryPioneer === true)
  const apCount = apReports.length
  const apHours = apReports.reduce((sum, r) => sum + (r.hours || 0), 0)
  const apStudies = apReports.reduce((sum, r) => sum + (r.studies || 0), 0)
  
  // --- Regular Pioneer Category ---
  const rpReports = reports.value.filter(r => {
    const publisher = publishers.value.find(p => p.id === r.publisherId)
    return publisher?.pioneerType === 'RP'
  })
  const rpCount = rpReports.length
  const rpHours = rpReports.reduce((sum, r) => sum + (r.hours || 0), 0)
  const rpStudies = rpReports.reduce((sum, r) => sum + (r.studies || 0), 0)
  
  return {
    notYetReported,
    totalPublishers,
    
    publisherCount,
    publisherShared,
    publisherNotShared,
    publisherStudies,
    publisherAvgCount: totalReports > 0 ? (publisherCount).toFixed(0) : 0,
    publisherAvgShared: publisherCount > 0 ? ((publisherShared / publisherCount) * 100).toFixed(0) : 0,
    publisherAvgNotShared: publisherCount > 0 ? ((publisherNotShared / publisherCount) * 100).toFixed(0) : 0,
    publisherAvgStudies: publisherCount > 0 ? (publisherStudies / publisherCount).toFixed(1) : 0,
    
    apCount,
    apHours,
    apStudies,
    apAvgCount: totalReports > 0 ? (apCount).toFixed(0) : 0,
    apAvgHours: apCount > 0 ? (apHours / apCount).toFixed(1) : 0,
    apAvgStudies: apCount > 0 ? (apStudies / apCount).toFixed(1) : 0,
    
    rpCount,
    rpHours,
    rpStudies,
    rpAvgCount: totalReports > 0 ? (rpCount).toFixed(0) : 0,
    rpAvgHours: rpCount > 0 ? (rpHours / rpCount).toFixed(1) : 0,
    rpAvgStudies: rpCount > 0 ? (rpStudies / rpCount).toFixed(1) : 0
  }
})

// Compute missing publishers grouped by their field service group
const missingPublishersByGroup = computed(() => {
  const reportedIds = reports.value.map(r => r.publisherId)
  const targetEnd = new Date(selectedYear.value, selectedMonth.value + 1, 0, 23, 59, 59)

  const missing = publishers.value.filter(pub => {
    if (pub.role === 'Inactive Publisher' || pub.role === 'Removed' || pub.role === 'Children') return false
    if (pub.createdAt) {
      const createdDate = pub.createdAt.toDate ? pub.createdAt.toDate() : new Date(pub.createdAt)
      if (!isNaN(createdDate.getTime()) && createdDate > targetEnd) return false
    }
    return !reportedIds.includes(pub.id)
  })
  
  const groupMap = {}
  
  missing.forEach(pub => {
    const group = groups.value.find(g => g.id === pub.groupId)
    const groupName = group ? group.name : 'No Group'
    
    if (!groupMap[groupName]) {
      groupMap[groupName] = { groupName, publishers: [] }
    }
    groupMap[groupName].publishers.push(pub)
  })
  
  return Object.values(groupMap)
    .sort((a, b) => a.groupName.localeCompare(b.groupName))
    .map(g => ({
      ...g,
      publishers: g.publishers.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    }))
})

const loadMeetingAttendance = async () => {
  try {
    const snap = await getDocs(collection(db, 'meetingAttendance'))
    const allAttendance = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    
    meetingAttendanceData.value = allAttendance.filter(r => {
      let rMonth = r.month
      let rYear = r.year
      
      if ((rMonth === undefined || rMonth === null) && r.date) {
        const parts = r.date.split('-')
        if (parts.length >= 2) {
          rYear = parseInt(parts[0])
          rMonth = parseInt(parts[1]) - 1
        }
      }
      
      return Number(rMonth) === Number(selectedMonth.value) && Number(rYear) === Number(selectedYear.value)
    })
  } catch (err) {
    console.error('Error loading meeting attendance for overview:', err)
    meetingAttendanceData.value = []
  }
}

const loadReports = async () => {
  loading.value = true
  try {
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
    
    // Load reports
    const reportsQuery = query(
      collection(db, 'reports'),
      where('year', '>=', selectedYear.value - 1)
    )
    
    const snapshot = await getDocs(reportsQuery)
    const allFetched = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    let fetchedReports = allFetched.filter(r => 
      r.month === selectedMonth.value && r.year === selectedYear.value
    )

    const targetVal = selectedYear.value * 12 + selectedMonth.value
    let recentReports = allFetched.filter(r => {
      const val = r.year * 12 + r.month
      return val <= targetVal && val > (targetVal - 6)
    })

    if (authStore.isEditor) {
      if (authStore.userGroupId) {
        publishers.value = publishers.value.filter(p => p.groupId === authStore.userGroupId)
        const allowedPublisherIds = publishers.value.map(p => p.id)
        fetchedReports = fetchedReports.filter(r => allowedPublisherIds.includes(r.publisherId))
        recentReports = recentReports.filter(r => allowedPublisherIds.includes(r.publisherId))
      } else {
        publishers.value = []
        fetchedReports = []
        recentReports = []
      }
    }
    
    reports.value = fetchedReports
    allRecentReports.value = recentReports
    await loadMonthStatus()
    await loadMeetingAttendance()
  } catch (error) {
    console.error('Error loading reports:', error)
  } finally {
    loading.value = false
  }
}

const loadMonthStatus = async () => {
  const statusId = `${selectedYear.value}-${String(selectedMonth.value + 1).padStart(2, '0')}`
  try {
    const docRef = doc(db, 'monthStatus', statusId)
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists()) {
      const data = docSnap.data()
      monthStatus.value = data.status
      const date = data.updatedAt?.toDate().toLocaleDateString()
      monthStatusInfo.value = `${data.status === 'closed' ? 'Closed' : 'Reopened'} by ${data.updatedBy} on ${date}`
    } else {
      monthStatus.value = 'open'
      monthStatusInfo.value = ''
    }
  } catch (error) {
    console.error('Error loading month status:', error)
  }
}

const toggleMonthStatus = async (newStatus) => {
  const statusId = `${selectedYear.value}-${String(selectedMonth.value + 1).padStart(2, '0')}`
  updatingStatus.value = true
  try {
    const docRef = doc(db, 'monthStatus', statusId)
    const userName = authStore.user?.displayName || authStore.user?.email || 'Admin'
    
    const oldStatus = monthStatus.value
    monthStatus.value = newStatus
    
    await setDoc(docRef, {
      status: newStatus,
      updatedAt: new Date(),
      updatedBy: userName
    })
    
    const action = newStatus === 'closed' ? 'Month Closed' : 'Month Reopened'
    const details = `${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)} for ${months[selectedMonth.value].name} ${selectedYear.value}`
    
    await logActivity(
      authStore,
      action,
      details,
      selectedMonth.value,
      selectedYear.value,
      { status: oldStatus },
      { status: newStatus }
    )
    await loadMonthStatus()
  } catch (error) {
    console.error('Error updating month status:', error)
    alert('Failed to update month status: ' + error.message)
    await loadMonthStatus()
  } finally {
    updatingStatus.value = false
  }
}

const onDateChange = () => {
  loadReports()
}

onMounted(() => {
  loadReports()
})
</script>

<style scoped>
.clickable-card {
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.clickable-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15) !important;
}

.stat-card {
  border-radius: 12px;
}

.attendance-table th,
.attendance-table td {
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.border-right {
  border-right: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.bg-primary-subtle {
  background-color: rgba(var(--v-theme-primary), 0.08) !important;
}
</style>
