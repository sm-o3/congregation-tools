<template>
  <div class="report-analyze">
    <!-- Top Header -->
    <v-row class="mb-4 align-center">
      <v-col cols="12" md="7">
        <h1 class="text-h4 font-weight-bold tracking-tight">
          <v-icon icon="mdi-chart-areaspline" color="primary" class="mr-3" />Service Year Analyse
        </h1>
        <p class="text-subtitle-1 text-medium-emphasis mt-1">
          Regular Pioneer hour monitoring & Congregation S-10 Analysis
        </p>
      </v-col>
      <v-col cols="12" md="5" class="text-md-right">
        <v-select
          v-model="selectedEndYear"
          :items="serviceYearOptions"
          item-title="label"
          item-value="year"
          label="Service Year"
          variant="outlined"
          density="comfortable"
          rounded="lg"
          class="year-selector"
          hide-details
          prepend-inner-icon="mdi-calendar-range"
        />
      </v-col>
    </v-row>

    <!-- Tabs Navigation -->
    <v-tabs v-model="activeTab" color="primary" class="mb-6" show-arrows>
      <v-tab value="rp-analysis" prepend-icon="mdi-account-star">
        RP Reports Analysis
      </v-tab>
      <v-tab value="s10-analysis" prepend-icon="mdi-file-chart-outline">
        Congregation Analysis (S-10)
      </v-tab>
    </v-tabs>

    <v-window v-model="activeTab">
      <!-- TAB 1: RP Reports Analysis -->
      <v-window-item value="rp-analysis">
        <!-- Mid-year Review Banner -->
        <v-fade-transition>
          <v-card
            v-if="showMidYearBanner"
            class="mb-8 overflow-hidden banner-card"
            elevation="0"
            variant="outlined"
          >
            <div class="banner-gradient"></div>
            <v-card-text class="pa-6 position-relative">
              <div class="d-flex align-center flex-wrap gap-4">
                <v-avatar color="indigo-lighten-4" size="56" class="mr-2">
                  <v-icon icon="mdi-flag-checkered" color="indigo-darken-2" size="32" />
                </v-avatar>
                <div class="flex-grow-1">
                  <h2 class="text-h5 font-weight-bold text-indigo-darken-3">March 1st Mid-Year Review</h2>
                  <p class="text-body-1 text-indigo-darken-1">
                    Requirement: <strong>300 hours</strong>. 
                    <span class="ml-2">
                      Status: <strong>{{ statistics.reachedThreshold }}</strong> reached, <strong>{{ statistics.belowThreshold.length }}</strong> below target.
                    </span>
                  </p>
                </div>
                <v-chip
                  v-if="statistics.belowThreshold.length > 0"
                  color="error"
                  variant="flat"
                  class="font-weight-bold px-4"
                  size="large"
                >
                  Action Required
                </v-chip>
              </div>
            </v-card-text>
          </v-card>
        </v-fade-transition>

        <!-- Empty State -->
        <v-fade-transition>
          <div v-if="!loading && filteredPioneers.length === 0" class="text-center py-16 empty-state">
            <v-avatar color="grey-lighten-4" size="120" class="mb-4">
              <v-icon icon="mdi-account-search-outline" size="64" color="grey-lighten-1" />
            </v-avatar>
            <h3 class="text-h5 text-grey-darken-1">No Regular Pioneers found</h3>
            <p class="text-body-1 text-grey mt-2">There are no publishers with "Regular Pioneer" appointment for the selected year.</p>
          </div>
        </v-fade-transition>

        <!-- Loading State -->
        <div v-if="loading" class="d-flex justify-center align-center py-16">
          <v-progress-circular indeterminate color="primary" size="64" width="6">
            <template v-slot:default>
              <span class="text-caption font-weight-bold">LOAD</span>
            </template>
          </v-progress-circular>
        </div>

        <!-- Pioneer Cards -->
        <v-row v-else>
          <v-col 
            v-for="pioneer in filteredPioneers" 
            :key="pioneer.id" 
            cols="12"
          >
            <v-card class="pioneer-card mb-4 overflow-hidden border-thin" elevation="2">
              <div :class="['card-accent', pioneer.isBelowMidYear ? 'bg-error' : 'bg-primary']"></div>
              
              <v-card-text class="pa-0">
                <div class="pa-6 d-flex align-center flex-wrap gap-4 border-bottom">
                  <v-avatar color="primary" variant="tonal" size="48">
                    <span class="font-weight-bold">{{ pioneer.name.charAt(0) }}</span>
                  </v-avatar>
                  <div class="flex-grow-1">
                    <div class="d-flex align-center">
                      <h3 class="text-h5 font-weight-bold">{{ pioneer.name }}</h3>
                      <v-chip 
                        v-if="pioneer.isBelowMidYear" 
                        color="error" 
                        size="small" 
                        class="ml-3 font-weight-bold" 
                        variant="tonal"
                        prepend-icon="mdi-alert-circle"
                      >
                        Below Threshold
                      </v-chip>
                    </div>
                    <div class="text-caption text-medium-emphasis mt-n1">{{ pioneer.groupName }}</div>
                  </div>
                  <div class="text-right">
                    <v-chip 
                      :color="pioneer.role === 'Inactive Publisher' ? 'grey' : 'success'" 
                      size="small" 
                      variant="flat"
                      class="font-weight-bold"
                    >
                      {{ pioneer.role === 'Inactive Publisher' ? 'Inactive' : 'Active' }}
                    </v-chip>
                  </div>
                </div>

                <!-- Grid Container -->
                <div class="grid-wrapper scrollbar-hidden">
                  <div class="months-grid">
                    <div 
                      v-for="month in serviceMonths" 
                      :key="month.id" 
                      class="month-cell"
                      :class="getMonthlyStatus(pioneer, month)"
                    >
                      <div class="month-label">{{ month.short }}</div>
                      <div class="month-hours">
                        <span class="reported">{{ getHoursForMonth(pioneer, month) }}</span>
                        <span class="required">({{ month.requirement }})</span>
                      </div>
                      <div class="deficit-indicator">
                        <template v-if="getDeficit(pioneer, month) > 0">
                          <v-icon icon="mdi-plus" size="10" />{{ getDeficit(pioneer, month) }} needed
                        </template>
                        <template v-else-if="hasReport(pioneer, month)">
                          <v-icon icon="mdi-check" size="14" color="success" />
                        </template>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Totals Row -->
                <div class="pa-4 d-flex flex-wrap gap-6 border-top">
                  <div class="total-item">
                    <div class="label">First Half (Sep–Feb)</div>
                    <div class="value-group" :class="getSummaryColor(pioneer.midYearTotal, 300)">
                      <span class="reported">{{ pioneer.midYearTotal }}</span>
                      <span class="required">/ 300</span>
                    </div>
                  </div>
                  <v-divider vertical class="mx-2 d-none d-sm-block"></v-divider>
                  <div class="total-item">
                    <div class="label">Annual Total</div>
                    <div class="value-group" :class="getSummaryColor(pioneer.annualTotal, pioneer.annualRequirement)">
                      <span class="reported text-h6 font-weight-bold">{{ pioneer.annualTotal }}</span>
                      <span class="required">/ {{ pioneer.annualRequirement }}</span>
                    </div>
                  </div>
                  <v-spacer></v-spacer>
                  <div class="total-item text-right" v-if="pioneer.annualTotal < pioneer.annualRequirement">
                    <div class="label">Annual Deficit</div>
                    <div class="text-error font-weight-bold">
                      {{ pioneer.annualRequirement - pioneer.annualTotal }} hours remaining
                    </div>
                  </div>
                  <div class="total-item text-right" v-else>
                    <div class="label">Status</div>
                    <v-chip color="success" size="small" variant="flat" prepend-icon="mdi-star">GOAL REACHED</v-chip>
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-window-item>

      <!-- TAB 2: Congregation Analysis (S-10) -->
      <v-window-item value="s10-analysis">
        <div v-if="loading" class="d-flex justify-center align-center py-16">
          <v-progress-circular indeterminate color="primary" size="64" width="6">
            <template v-slot:default>
              <span class="text-caption font-weight-bold">LOAD</span>
            </template>
          </v-progress-circular>
        </div>

        <div v-else class="s10-content">
          <!-- Section 1: Average Meeting Attendance -->
          <v-card class="mb-6 rounded-xl border-thin" elevation="1">
            <v-card-item class="bg-surface-variant py-3 px-4 border-bottom">
              <div class="d-flex align-center">
                <v-avatar color="primary" variant="tonal" size="36" class="mr-3">
                  <v-icon icon="mdi-account-group" size="20" />
                </v-avatar>
                <div>
                  <div class="text-h6 font-weight-bold">Average Meeting Attendance</div>
                  <div class="text-caption text-medium-emphasis">Calculated over Service Year {{ selectedServiceYearLabel }}</div>
                </div>
              </div>
            </v-card-item>

            <v-card-text class="pa-0">
              <v-table hover class="s10-table">
                <thead>
                  <tr>
                    <th class="text-left font-weight-bold">Meeting Type</th>
                    <th class="text-center font-weight-bold">Meetings Recorded</th>
                    <th class="text-center font-weight-bold">Total Attendance</th>
                    <th class="text-right font-weight-bold">Average Attendance</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td class="font-weight-medium">
                      <v-icon icon="mdi-book-open-variant" color="indigo" class="mr-2" size="20" />
                      Midweek Meeting
                    </td>
                    <td class="text-center">{{ s10Attendance.midweek.count }}</td>
                    <td class="text-center">{{ s10Attendance.midweek.total }}</td>
                    <td class="text-right font-weight-bold text-primary">
                      <v-chip color="primary" variant="tonal" size="small" class="font-weight-bold">
                        {{ s10Attendance.midweek.avg }}
                      </v-chip>
                    </td>
                  </tr>
                  <tr>
                    <td class="font-weight-medium">
                      <v-icon icon="mdi-account-group" color="teal" class="mr-2" size="20" />
                      Weekend Meeting
                    </td>
                    <td class="text-center">{{ s10Attendance.weekend.count }}</td>
                    <td class="text-center">{{ s10Attendance.weekend.total }}</td>
                    <td class="text-right font-weight-bold text-teal">
                      <v-chip color="teal" variant="tonal" size="small" class="font-weight-bold">
                        {{ s10Attendance.weekend.avg }}
                      </v-chip>
                    </td>
                  </tr>
                </tbody>
              </v-table>
            </v-card-text>
          </v-card>

          <!-- Section 2: Congregation Totals -->
          <v-card class="mb-6 rounded-xl border-thin" elevation="1">
            <v-card-item class="bg-surface-variant py-3 px-4 border-bottom">
              <div class="d-flex align-center">
                <v-avatar color="indigo" variant="tonal" size="36" class="mr-3">
                  <v-icon icon="mdi-account-multiple-check" size="20" />
                </v-avatar>
                <div>
                  <div class="text-h6 font-weight-bold">Congregation Totals</div>
                  <div class="text-caption text-medium-emphasis">Publisher activity over 6 consecutive months & special status counts</div>
                </div>
              </div>
            </v-card-item>

            <v-card-text class="pa-0">
              <v-table hover class="s10-table">
                <thead>
                  <tr>
                    <th class="text-left font-weight-bold">Category / Status Description</th>
                    <th class="text-left font-weight-bold">Criteria</th>
                    <th class="text-right font-weight-bold">Publisher Count</th>
                  </tr>
                </thead>
                <tbody>
                  <tr class="clickable-row" @click="navigateToFilteredPublishers('s10_active')">
                    <td class="font-weight-medium">
                      <v-icon icon="mdi-check-circle" color="success" class="mr-2" size="18" />
                      All Active Publishers
                    </td>
                    <td class="text-caption text-medium-emphasis">
                      Reported at least once in the last 6 months of the service year
                    </td>
                    <td class="text-right font-weight-bold text-success text-body-1">
                      {{ s10Totals.activePublishers }}
                      <v-icon icon="mdi-chevron-right" size="16" class="ml-1 text-medium-emphasis" />
                    </td>
                  </tr>
                  <tr class="clickable-row" @click="navigateToFilteredPublishers('s10_inactive')">
                    <td class="font-weight-medium">
                      <v-icon icon="mdi-alert-circle" color="warning" class="mr-2" size="18" />
                      New Inactive Publishers
                    </td>
                    <td class="text-caption text-medium-emphasis">
                      Became inactive (6 consecutive months no report) within the service year
                    </td>
                    <td class="text-right font-weight-bold text-warning text-body-1">
                      {{ s10Totals.inactivePublishers }}
                      <v-icon icon="mdi-chevron-right" size="16" class="ml-1 text-medium-emphasis" />
                    </td>
                  </tr>
                  <tr class="clickable-row" @click="navigateToFilteredPublishers('s10_reactivated')">
                    <td class="font-weight-medium">
                      <v-icon icon="mdi-sync" color="info" class="mr-2" size="18" />
                      Reactivated Publishers
                    </td>
                    <td class="text-caption text-medium-emphasis">
                      Inactive publishers who resumed reporting in any month of the service year
                    </td>
                    <td class="text-right font-weight-bold text-info text-body-1">
                      {{ s10Totals.reactivatedPublishers }}
                      <v-icon icon="mdi-chevron-right" size="16" class="ml-1 text-medium-emphasis" />
                    </td>
                  </tr>
                  <tr class="clickable-row" @click="navigateToFilteredPublishers('deaf')">
                    <td class="font-weight-medium">
                      <v-icon icon="mdi-ear-hearing-off" color="purple" class="mr-2" size="18" />
                      Deaf Publishers
                    </td>
                    <td class="text-caption text-medium-emphasis">Deaf / Hard of hearing publishers</td>
                    <td class="text-right font-weight-bold text-body-1">
                      {{ s10Totals.deafPublishers }}
                      <v-icon icon="mdi-chevron-right" size="16" class="ml-1 text-medium-emphasis" />
                    </td>
                  </tr>
                  <tr class="clickable-row" @click="navigateToFilteredPublishers('blind')">
                    <td class="font-weight-medium">
                      <v-icon icon="mdi-eye-off" color="amber-darken-2" class="mr-2" size="18" />
                      Blind Publishers
                    </td>
                    <td class="text-caption text-medium-emphasis">Blind / Visually impaired publishers</td>
                    <td class="text-right font-weight-bold text-body-1">
                      {{ s10Totals.blindPublishers }}
                      <v-icon icon="mdi-chevron-right" size="16" class="ml-1 text-medium-emphasis" />
                    </td>
                  </tr>
                  <tr class="clickable-row" @click="navigateToFilteredPublishers('incarcerated')">
                    <td class="font-weight-medium">
                      <v-icon icon="mdi-lock-outline" color="deep-orange" class="mr-2" size="18" />
                      Incarcerated Publishers
                    </td>
                    <td class="text-caption text-medium-emphasis">Incarcerated / Restricted publishers</td>
                    <td class="text-right font-weight-bold text-body-1">
                      {{ s10Totals.incarceratedPublishers }}
                      <v-icon icon="mdi-chevron-right" size="16" class="ml-1 text-medium-emphasis" />
                    </td>
                  </tr>
                </tbody>
              </v-table>
            </v-card-text>
          </v-card>

          <!-- Section 3: Territory Coverage -->
          <v-card class="rounded-xl border-thin" elevation="1">
            <v-card-item class="bg-surface-variant py-3 px-4 border-bottom">
              <div class="d-flex align-center">
                <v-avatar color="teal" variant="tonal" size="36" class="mr-3">
                  <v-icon icon="mdi-map-marker-distance" size="20" />
                </v-avatar>
                <div>
                  <div class="text-h6 font-weight-bold">Territory Coverage</div>
                  <div class="text-caption text-medium-emphasis">Overview of territory assignments and activity</div>
                </div>
              </div>
            </v-card-item>

            <v-card-text class="pa-0">
              <v-table hover class="s10-table">
                <thead>
                  <tr>
                    <th class="text-left font-weight-bold">Territory Metric</th>
                    <th class="text-left font-weight-bold">Description</th>
                    <th class="text-right font-weight-bold">Count</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td class="font-weight-medium">
                      <v-icon icon="mdi-map" color="teal" class="mr-2" size="18" />
                      Total Number of Territories
                    </td>
                    <td class="text-caption text-medium-emphasis">Total congregation territory cards registered</td>
                    <td class="text-right font-weight-bold text-body-1">
                      {{ s10Territories.total }}
                    </td>
                  </tr>
                  <tr>
                    <td class="font-weight-medium">
                      <v-icon icon="mdi-map-clock-outline" color="grey-darken-1" class="mr-2" size="18" />
                      Territories Not Worked
                    </td>
                    <td class="text-caption text-medium-emphasis">Territories not assigned or worked in the service year</td>
                    <td class="text-right font-weight-bold text-body-1">
                      {{ s10Territories.notWorked }}
                    </td>
                  </tr>
                </tbody>
              </v-table>
            </v-card-text>
          </v-card>
        </div>
      </v-window-item>
    </v-window>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/config/firebase'

const router = useRouter()
const activeTab = ref('rp-analysis')

const navigateToFilteredPublishers = (filterType) => {
  router.push({
    name: 'PublishersList',
    query: {
      filter: filterType,
      year: selectedEndYear.value
    }
  })
}
const loading = ref(true)
const publishers = ref([])
const reports = ref([])
const groups = ref([])
const attendance = ref([])
const territories = ref([])

// Service Year Logic
const currentRealDate = new Date()
const defaultEndYear = currentRealDate.getMonth() >= 8 
  ? currentRealDate.getFullYear() + 1 
  : currentRealDate.getFullYear()

const selectedEndYear = ref(defaultEndYear)

const selectedServiceYearLabel = computed(() => {
  const opt = serviceYearOptions.value.find(y => y.year === selectedEndYear.value)
  return opt ? opt.label : `${selectedEndYear.value - 1}–${selectedEndYear.value % 100}`
})

const serviceYearOptions = computed(() => {
  const years = []
  for (let y = 2024; y <= 2035; y++) {
    years.push({
      label: `${y - 1}–${y % 100}`,
      year: y
    })
  }
  return years
})

// Month configuration (Sep to Aug)
const serviceMonths = [
  { id: 8, name: 'September', short: 'Sep', requirement: 50 },
  { id: 9, name: 'October', short: 'Oct', requirement: 50 },
  { id: 10, name: 'November', short: 'Nov', requirement: 50 },
  { id: 11, name: 'December', short: 'Dec', requirement: 50 },
  { id: 0, name: 'January', short: 'Jan', requirement: 50 },
  { id: 1, name: 'February', short: 'Feb', requirement: 50 },
  { id: 2, name: 'March', short: 'Mar', requirement: 50 },
  { id: 3, name: 'April', short: 'Apr', requirement: 50 },
  { id: 4, name: 'May', short: 'May', requirement: 50 },
  { id: 5, name: 'June', short: 'Jun', requirement: 50 },
  { id: 6, name: 'July', short: 'Jul', requirement: 50 },
  { id: 7, name: 'August', short: 'Aug', requirement: 50 }
]

const showMidYearBanner = computed(() => {
  const now = new Date()
  const reviewDate = new Date(selectedEndYear.value, 2, 1) // March 1st of end year
  return now >= reviewDate
})

const statistics = computed(() => {
  const below = filteredPioneers.value.filter(p => p.isBelowMidYear)
  return {
    reachedThreshold: filteredPioneers.value.length - below.length,
    belowThreshold: below
  }
})

const loadData = async () => {
  loading.value = true
  try {
    // Load Publishers
    const publishersSnapshot = await getDocs(collection(db, 'publishers'))
    publishers.value = publishersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

    // Load Groups
    const groupsSnapshot = await getDocs(collection(db, 'groups'))
    groups.value = groupsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

    // Load Reports
    const reportsSnapshot = await getDocs(collection(db, 'reports'))
    reports.value = reportsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

    // Load Meeting Attendance
    try {
      const attendanceSnapshot = await getDocs(collection(db, 'meetingAttendance'))
      attendance.value = attendanceSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    } catch (e) {
      console.warn('Meeting attendance fetch notice:', e)
      attendance.value = []
    }

    // Load Territories
    try {
      const territoriesSnapshot = await getDocs(collection(db, 'territories'))
      territories.value = territoriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    } catch (e) {
      console.warn('Territories fetch notice:', e)
      territories.value = []
    }
  } catch (error) {
    console.error('Error loading analysis data:', error)
  } finally {
    loading.value = false
  }
}

const filteredPioneers = computed(() => {
  // Filter for Regular Pioneers
  const rps = publishers.value.filter(p => p.pioneerType === 'RP')
  
  return rps.map(p => {
    const groupName = groups.value.find(g => g.id === p.groupId)?.name || 'No Group'
    
    // Map monthly hours
    const startYear = selectedEndYear.value - 1
    const endYear = selectedEndYear.value
    
    const monthlyData = serviceMonths.map(m => {
      const year = m.id >= 8 ? startYear : endYear
      const report = reports.value.find(r => r.publisherId === p.id && r.month === m.id && r.year === year)
      return {
        monthId: m.id,
        year,
        hours: report?.hours || 0,
        hasReport: !!report
      }
    })

    // Calculate totals
    const midYearTotal = monthlyData.slice(0, 6).reduce((sum, m) => sum + m.hours, 0)
    const annualTotal = monthlyData.reduce((sum, m) => sum + m.hours, 0)
    const isBelowMidYear = showMidYearBanner.value && midYearTotal < 300

    return {
      ...p,
      groupName,
      monthlyData,
      midYearTotal,
      annualTotal,
      annualRequirement: 600,
      isBelowMidYear
    }
  }).sort((a, b) => a.name.localeCompare(b.name))
})

const getHoursForMonth = (pioneer, month) => {
  const data = pioneer.monthlyData.find(m => m.monthId === month.id)
  return data ? data.hours : 0
}

const hasReport = (pioneer, month) => {
  const data = pioneer.monthlyData.find(m => m.monthId === month.id)
  return data ? data.hasReport : false
}

const getMonthlyStatus = (pioneer, month) => {
  const now = new Date()
  const year = month.id >= 8 ? selectedEndYear.value - 1 : selectedEndYear.value
  const monthDate = new Date(year, month.id, 1)
  
  // Future month
  if (monthDate > now) return 'status-grey'
  
  const reported = getHoursForMonth(pioneer, month)
  const required = month.requirement
  
  if (reported >= required) return 'status-green'
  if (reported >= required - 10) return 'status-amber'
  return 'status-red'
}

const getDeficit = (pioneer, month) => {
  const monthIdx = serviceMonths.findIndex(m => m.id === month.id)
  const targetTotal = (monthIdx + 1) * 50
  const actualTotal = pioneer.monthlyData.slice(0, monthIdx + 1).reduce((sum, m) => sum + m.hours, 0)
  return Math.max(0, targetTotal - actualTotal)
}

const getSummaryColor = (reported, required) => {
  if (reported >= required) return 'text-success'
  if (reported >= required - 20) return 'text-warning'
  return 'text-error'
}

// --- TAB 2: Congregation Analysis (S-10) Computations ---
const s10Attendance = computed(() => {
  const endYr = selectedEndYear.value
  const startYr = endYr - 1

  // Service Year range: Sep startYr (month 8) to Aug endYr (month 7)
  const serviceYearAttendance = attendance.value.filter(a => {
    if (a.isMemorial) return false
    if (a.year === startYr && a.month >= 8) return true
    if (a.year === endYr && a.month < 8) return true
    return false
  })

  const calcForType = (type) => {
    const list = serviceYearAttendance.filter(a => a.meetingType === type)
    if (list.length === 0) {
      return { count: 0, total: 0, avg: '0' }
    }

    const total = list.reduce((sum, item) => {
      const val = Number(item.total) || (Number(item.inPerson || 0) + Number(item.zoom || 0))
      return sum + val
    }, 0)

    const avgVal = total / list.length
    const avgStr = Number.isInteger(avgVal) ? avgVal.toString() : avgVal.toFixed(1)

    return {
      count: list.length,
      total,
      avg: avgStr
    }
  }

  return {
    midweek: calcForType('Midweek Meeting'),
    weekend: calcForType('Weekend Meeting')
  }
})

const s10Totals = computed(() => {
  const endYr = selectedEndYear.value
  const startYr = endYr - 1

  // 12 service months for the selected service year (Sep startYr to Aug endYr)
  const serviceYearMonths = [
    { month: 8, year: startYr },
    { month: 9, year: startYr },
    { month: 10, year: startYr },
    { month: 11, year: startYr },
    { month: 0, year: endYr },
    { month: 1, year: endYr },
    { month: 2, year: endYr },
    { month: 3, year: endYr },
    { month: 4, year: endYr },
    { month: 5, year: endYr },
    { month: 6, year: endYr },
    { month: 7, year: endYr }
  ]

  // Timeline starting 12 months before service year (24 months total)
  const historyMonths = []
  for (let m = 8; m <= 11; m++) historyMonths.push({ month: m, year: startYr - 1 })
  for (let m = 0; m <= 7; m++) historyMonths.push({ month: m, year: startYr })
  const allTimelineMonths = [...historyMonths, ...serviceYearMonths]

  const validPublishers = publishers.value.filter(p => p.role !== 'Removed')

  let activeCount = 0
  let newInactiveCount = 0
  let reactivatedCount = 0

  validPublishers.forEach(pub => {
    // 1. All Active Publishers: Reported at least once in the last 6 months of the Service Year (Mar-Aug)
    const recent6ServiceMonths = serviceYearMonths.slice(-6)
    const reportedInRecent6 = recent6ServiceMonths.some(m => {
      const rep = reports.value.find(r => r.publisherId === pub.id && r.month === m.month && r.year === m.year)
      return rep ? (rep.sharedInMinistry === true || rep.sharedInMinistry === 'YES' || rep.sharedInMinistry === 'true' || (Number(rep.hours) || 0) > 0) : false
    })

    if (reportedInRecent6) {
      activeCount++
    }

    // Timeline array (24 booleans)
    const pubTimeline = allTimelineMonths.map(m => {
      const rep = reports.value.find(r => r.publisherId === pub.id && r.month === m.month && r.year === m.year)
      return rep ? (rep.sharedInMinistry === true || rep.sharedInMinistry === 'YES' || rep.sharedInMinistry === 'true' || (Number(rep.hours) || 0) > 0) : false
    })

    // 2. New Inactive Publishers: A 6-consecutive-month no-report period ended in one of the months of this service year (indices 12..23), and they were previously active
    let becameInactiveInServiceYear = false
    for (let i = 12; i <= 23; i++) {
      const streak6No = pubTimeline.slice(i - 5, i + 1).every(s => s === false)
      if (streak6No) {
        const reportedPrior = pubTimeline.slice(0, i - 5).some(s => s === true)
        if (reportedPrior) {
          becameInactiveInServiceYear = true
          break
        }
      }
    }

    if (becameInactiveInServiceYear) {
      newInactiveCount++
    }

    // 3. Reactivated Publishers: Was inactive (had 6-month no-report streak) and resumed reporting in any month of the service year (indices 12..23)
    let wasReactivatedInServiceYear = false
    for (let i = 12; i <= 23; i++) {
      if (pubTimeline[i] === true) {
        const prior6 = pubTimeline.slice(i - 6, i)
        if (prior6.length === 6 && prior6.every(s => s === false)) {
          wasReactivatedInServiceYear = true
          break
        }
      }
    }

    if (wasReactivatedInServiceYear) {
      reactivatedCount++
    }
  })

  // Special Publisher Flags (0 if unpopulated/none)
  const deafCount = validPublishers.filter(p => 
    p.isDeaf === true || 
    p.deaf === true || 
    (Array.isArray(p.specialNeeds) && p.specialNeeds.some(s => s.toLowerCase().includes('deaf'))) ||
    (typeof p.notes === 'string' && p.notes.toLowerCase().includes('deaf'))
  ).length

  const blindCount = validPublishers.filter(p => 
    p.isBlind === true || 
    p.blind === true || 
    (Array.isArray(p.specialNeeds) && p.specialNeeds.some(s => s.toLowerCase().includes('blind'))) ||
    (typeof p.notes === 'string' && p.notes.toLowerCase().includes('blind'))
  ).length

  const incarceratedCount = validPublishers.filter(p => 
    p.isIncarcerated === true || 
    p.incarcerated === true || 
    (Array.isArray(p.specialNeeds) && p.specialNeeds.some(s => s.toLowerCase().includes('incarcerated'))) ||
    (typeof p.notes === 'string' && p.notes.toLowerCase().includes('incarcerated'))
  ).length

  return {
    activePublishers: activeCount,
    inactivePublishers: newInactiveCount,
    reactivatedPublishers: reactivatedCount,
    deafPublishers: deafCount,
    blindPublishers: blindCount,
    incarceratedPublishers: incarceratedCount
  }
})

const s10Territories = computed(() => {
  return {
    total: territories.value.length || 0,
    notWorked: 0
  }
})

onMounted(loadData)

watch(selectedEndYear, loadData)
</script>

<style scoped>
.report-analyze {
  padding: 16px;
  max-width: 1400px;
  margin: 0 auto;
}

.tracking-tight { letter-spacing: -0.025em; }

.year-selector {
  max-width: 200px;
  display: inline-block;
}

.banner-card {
  border: 1px solid rgba(var(--v-theme-indigo), 0.2);
  background-color: #f8faff;
  position: relative;
}

.banner-gradient {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #6366f1, #8b5cf6);
}

.pioneer-card {
  position: relative;
  border-radius: 16px !important;
}

.card-accent {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  width: 4px;
}

.border-bottom { border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)); }
.border-top { border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)); }

.grid-wrapper {
  overflow-x: auto;
  background: transparent;
}

.months-grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(100px, 1fr));
  width: 100%;
}

.month-cell {
  padding: 16px 8px;
  text-align: center;
  border-right: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  transition: all 0.2s;
}

.month-cell:last-child { border-right: none; }

.status-green { background-color: rgba(76, 175, 80, 0.15); color: #81c784; }
.status-amber { background-color: rgba(255, 152, 0, 0.15); color: #ffb74d; }
.status-red { background-color: rgba(244, 67, 54, 0.15); color: #ff5252; }
.status-grey { background-color: transparent; color: rgba(var(--v-theme-on-surface), 0.7); }

.month-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  margin-bottom: 4px;
  color: rgba(var(--v-theme-on-surface), 0.9);
}

.month-hours {
  font-size: 14px;
  font-weight: 600;
  color: rgba(var(--v-theme-on-surface), 1);
}

.month-hours .required {
  font-size: 11px;
  opacity: 0.7;
  margin-left: 2px;
  color: rgba(var(--v-theme-on-surface), 0.7);
}

.deficit-indicator {
  font-size: 10px;
  font-weight: 700;
  height: 14px;
  margin-top: 4px;
  color: inherit;
}

.total-item .label {
  font-size: 11px;
  color: rgba(var(--v-theme-on-surface), 0.7);
  font-weight: 700;
  text-transform: uppercase;
  margin-bottom: 2px;
}

.value-group .required {
  font-size: 13px;
  opacity: 0.7;
  margin-left: 4px;
  color: rgba(var(--v-theme-on-surface), 0.7);
}

.empty-state { opacity: 0.8; }

.gap-4 { gap: 16px; }
.gap-6 { gap: 24px; }

.s10-table th {
  font-size: 0.85rem !important;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.clickable-row {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.clickable-row:hover {
  background-color: rgba(var(--v-theme-primary), 0.06) !important;
}

/* Scrollbar styling */
.scrollbar-hidden::-webkit-scrollbar { display: none; }
.scrollbar-hidden { -ms-overflow-style: none; scrollbar-width: none; }

@media (max-width: 960px) {
  .months-grid {
    grid-template-columns: repeat(6, 1fr);
    grid-template-rows: repeat(2, 1fr);
  }
  .month-cell { border-bottom: 1px solid rgba(0, 0, 0, 0.03); }
}
</style>
