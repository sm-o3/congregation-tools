<template>
  <div>
    <!-- Greeting -->
    <v-row class="mb-2">
      <v-col cols="12">
        <h1 class="text-h4 font-weight-bold">Dashboard</h1>
        <p class="text-body-2 text-medium-emphasis mt-1">Welcome back! Here's your congregation at a glance.</p>
      </v-col>
    </v-row>
    
    <!-- Stat Cards (Single Row on Desktop & Mobile) -->
    <v-row class="mb-2">
      <v-col cols="3">
        <v-card :hover="authStore.isAdmin" :style="authStore.isAdmin ? 'cursor: pointer;' : 'cursor: default;'" class="stat-card" @click="authStore.isAdmin && navigateToPublishers()">
          <v-card-text class="text-center pa-2 pa-sm-4 pa-md-5">
            <div class="stat-icon-wrap bg-primary mb-2 mb-sm-3">
              <v-icon color="white" class="stat-icon">mdi-account-group</v-icon>
            </div>
            <div class="stat-number font-weight-bold">{{ stats.totalPublishers }}</div>
            <div class="stat-label text-medium-emphasis text-truncate mt-1" title="Total Publishers">Total Publishers</div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="3">
        <v-card :hover="authStore.isAdmin" :style="authStore.isAdmin ? 'cursor: pointer;' : 'cursor: default;'" class="stat-card" @click="authStore.isAdmin && navigateToPublishers('pioneerType', 'RP')">
          <v-card-text class="text-center pa-2 pa-sm-4 pa-md-5">
            <div class="stat-icon-wrap bg-success mb-2 mb-sm-3">
              <v-icon color="white" class="stat-icon">mdi-star</v-icon>
            </div>
            <div class="stat-number font-weight-bold">{{ stats.regularPioneers }}</div>
            <div class="stat-label text-medium-emphasis text-truncate mt-1" title="Regular Pioneers">Regular Pioneers</div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="3">
        <v-card :hover="authStore.isAdmin" :style="authStore.isAdmin ? 'cursor: pointer;' : 'cursor: default;'" class="stat-card" @click="authStore.isAdmin && navigateToPublishers('role', 'Elder')">
          <v-card-text class="text-center pa-2 pa-sm-4 pa-md-5">
            <div class="stat-icon-wrap bg-secondary mb-2 mb-sm-3">
              <v-icon color="white" class="stat-icon">mdi-shield-account</v-icon>
            </div>
            <div class="stat-number font-weight-bold">{{ stats.elders }}</div>
            <div class="stat-label text-medium-emphasis text-truncate mt-1" title="Elders">Elders</div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="3">
        <v-card :hover="authStore.isAdmin" :style="authStore.isAdmin ? 'cursor: pointer;' : 'cursor: default;'" class="stat-card" @click="authStore.isAdmin && navigateToPublishers('role', 'Ministerial Servant')">
          <v-card-text class="text-center pa-2 pa-sm-4 pa-md-5">
            <div class="stat-icon-wrap bg-info mb-2 mb-sm-3">
              <v-icon color="white" class="stat-icon">mdi-account-tie</v-icon>
            </div>
            <div class="stat-number font-weight-bold">{{ stats.ministerialServants }}</div>
            <div class="stat-label text-medium-emphasis text-truncate mt-1" title="Ministerial Servants">Ministerial Servants</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    
    <v-row class="mt-2">
      <v-col cols="12" md="6">
        <v-card class="h-100">
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2" color="primary" size="20">mdi-chart-bar</v-icon>
            Last Month Summary
          </v-card-title>
          <v-card-text>
            <v-list bg-color="transparent" class="pa-0">
              <!-- 1. Publishers Reporting & Not -->
              <v-list-item rounded="lg" class="px-2 py-1 mb-1">
                <template v-slot:prepend>
                  <v-avatar color="primary" variant="tonal" size="36" rounded="lg">
                    <v-icon size="18">mdi-account-check</v-icon>
                  </v-avatar>
                </template>
                <v-list-item-title class="font-weight-medium text-body-2">Publishers Reporting & Not</v-list-item-title>
                <template v-slot:append>
                  <div class="d-flex align-center font-weight-bold">
                    <span class="text-h6 font-weight-bold text-primary">{{ stats.publishersReporting }}</span>
                    <span class="text-caption text-medium-emphasis mx-2">|</span>
                    <span class="text-h6 font-weight-bold text-error">{{ stats.publishersNotShared }}</span>
                  </div>
                </template>
              </v-list-item>

              <!-- 2. AP Hours & Studies -->
              <v-list-item rounded="lg" class="px-2 py-1 mb-1">
                <template v-slot:prepend>
                  <v-avatar color="purple" variant="tonal" size="36" rounded="lg">
                    <v-icon size="18">mdi-star-half-full</v-icon>
                  </v-avatar>
                </template>
                <v-list-item-title class="font-weight-medium text-body-2">AP Hours & Studies</v-list-item-title>
                <template v-slot:append>
                  <div class="d-flex align-center font-weight-bold">
                    <span class="text-h6 font-weight-bold text-purple">{{ stats.apHours }}</span>
                    <span class="text-caption text-medium-emphasis mx-2">|</span>
                    <span class="text-h6 font-weight-bold text-purple">{{ stats.apStudies }}</span>
                  </div>
                </template>
              </v-list-item>

              <!-- 3. RP Hours & Studies -->
              <v-list-item rounded="lg" class="px-2 py-1 mb-1">
                <template v-slot:prepend>
                  <v-avatar color="success" variant="tonal" size="36" rounded="lg">
                    <v-icon size="18">mdi-star</v-icon>
                  </v-avatar>
                </template>
                <v-list-item-title class="font-weight-medium text-body-2">RP Hours & Studies</v-list-item-title>
                <template v-slot:append>
                  <div class="d-flex align-center font-weight-bold">
                    <span class="text-h6 font-weight-bold text-success">{{ stats.rpHours }}</span>
                    <span class="text-caption text-medium-emphasis mx-2">|</span>
                    <span class="text-h6 font-weight-bold text-success">{{ stats.rpStudies }}</span>
                  </div>
                </template>
              </v-list-item>

              <!-- 4. Publishers Bible Studies -->
              <v-list-item rounded="lg" class="px-2 py-1 mb-1">
                <template v-slot:prepend>
                  <v-avatar color="info" variant="tonal" size="36" rounded="lg">
                    <v-icon size="18">mdi-book-open-variant</v-icon>
                  </v-avatar>
                </template>
                <v-list-item-title class="font-weight-medium text-body-2">Publishers Bible Studies</v-list-item-title>
                <template v-slot:append>
                  <span class="text-h6 font-weight-bold text-info">{{ stats.publisherStudies }}</span>
                </template>
              </v-list-item>

              <!-- 5. Avg Meeting Attendance -->
              <v-list-item rounded="lg" class="px-2 py-1">
                <template v-slot:prepend>
                  <v-avatar color="warning" variant="tonal" size="36" rounded="lg">
                    <v-icon size="18">mdi-account-group</v-icon>
                  </v-avatar>
                </template>
                <v-list-item-title class="font-weight-medium text-body-2">Avg Meeting Attendance</v-list-item-title>
                <template v-slot:append>
                  <div class="d-flex align-center font-weight-bold text-warning">
                    <span class="text-body-2 font-weight-bold">Midweek {{ stats.mwAvg }}</span>
                    <span class="text-caption text-medium-emphasis mx-2">|</span>
                    <span class="text-body-2 font-weight-bold">{{ stats.weAvg }} Weekend</span>
                  </div>
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="6">
        <v-card class="h-100">
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2" color="secondary" size="20">mdi-lightning-bolt</v-icon>
            Quick Actions
          </v-card-title>
          <v-card-text class="d-flex flex-column ga-3">
            <v-btn 
              block 
              color="primary" 
              size="large"
              to="/reports/add"
              prepend-icon="mdi-plus-circle"
              class="justify-start"
            >
              Add Report
            </v-btn>
            <v-btn 
              block 
              color="teal" 
              variant="tonal"
              size="large"
              to="/reports/add-meeting-attendance"
              prepend-icon="mdi-calendar-plus"
              class="justify-start"
            >
              Add Meeting Attendance
            </v-btn>
            <v-btn 
              v-if="authStore.canViewPublishersList"
              block 
              color="secondary" 
              variant="tonal"
              size="large"
              to="/congregation/publishers"
              prepend-icon="mdi-account-group"
              class="justify-start"
            >
              View Publishers
            </v-btn>
            <v-btn 
              block 
              color="info" 
              variant="tonal"
              size="large"
              to="/schedule/overview"
              prepend-icon="mdi-calendar"
              class="justify-start"
            >
              View Schedule
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { collection, query, getDocs, where } from 'firebase/firestore'
import { db } from '@/config/firebase'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const stats = ref({
  totalPublishers: 0,
  regularPioneers: 0,
  elders: 0,
  ministerialServants: 0,
  publishersReporting: 0,
  publishersNotShared: 0,
  apHours: 0,
  apStudies: 0,
  rpHours: 0,
  rpStudies: 0,
  publisherStudies: 0,
  mwAvg: 0,
  weAvg: 0
})

const navigateToPublishers = (filterKey, filterValue) => {
  if (!authStore.isAdmin) return
  if (filterKey && filterValue) {
    router.push({
      name: 'PublishersList',
      query: { [filterKey]: filterValue }
    })
  } else {
    router.push({ name: 'PublishersList' })
  }
}

const loadStats = async () => {
  try {
    const publishersSnapshot = await getDocs(collection(db, 'publishers'))
    
    let totalPubs = 0
    let rpCount = 0
    let eldersCount = 0
    let msCount = 0
    const allPubMap = new Map()

    publishersSnapshot.forEach(doc => {
      const data = doc.data()
      allPubMap.set(doc.id, data)

      if (data.role !== 'Removed') {
        totalPubs++
        if (['RP'].includes(data.pioneerType)) {
          rpCount++
        }
        if (data.role === 'Elder') {
          eldersCount++
        }
        if (data.role === 'Ministerial Servant') {
          msCount++
        }
      }
    })

    stats.value.totalPublishers = totalPubs
    stats.value.regularPioneers = rpCount
    stats.value.elders = eldersCount
    stats.value.ministerialServants = msCount
    
    const now = new Date()
    const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1
    const lastMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
    
    const reportsQuery = query(
      collection(db, 'reports'),
      where('month', '==', lastMonth),
      where('year', '==', lastMonthYear)
    )
    
    const reportsSnapshot = await getDocs(reportsQuery)
    let reportsList = reportsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

    // For Editor with assigned group, filter last month summary to Editor's group only
    if (authStore.isEditor && authStore.userGroupId) {
      reportsList = reportsList.filter(r => {
        const pub = allPubMap.get(r.publisherId)
        return pub && pub.groupId === authStore.userGroupId
      })
    }

    // 1. Total Shared across all publishers (78)
    const pubReportingCount = reportsList.filter(r => {
      const pub = allPubMap.get(r.publisherId)
      if (!pub) return false
      return r.sharedInMinistry === true || r.sharedInMinistry === 'YES' || r.sharedInMinistry === 'true'
    }).length

    // 2. Publisher Category (non-RP, non-AP) reports (matching Overview.vue)
    const publisherCategoryReports = reportsList.filter(r => {
      const pub = allPubMap.get(r.publisherId)
      if (!pub) return false
      if (pub.pioneerType === 'RP') return false
      if (r.auxiliaryPioneer) return false
      return true
    })

    const publisherCategoryShared = publisherCategoryReports.filter(r => 
      r.sharedInMinistry === true || r.sharedInMinistry === 'YES' || r.sharedInMinistry === 'true'
    ).length

    // Exact matching Overview.vue line 567: publisherCount - publisherShared = 9
    const publisherNotShared = publisherCategoryReports.length - publisherCategoryShared

    // 3. AP Category
    const apReports = reportsList.filter(r => r.auxiliaryPioneer === true)
    const apHours = apReports.reduce((sum, r) => sum + (Number(r.hours) || 0), 0)
    const apStudies = apReports.reduce((sum, r) => sum + (Number(r.studies) || 0), 0)

    // 4. RP Category
    const rpReports = reportsList.filter(r => {
      const pub = allPubMap.get(r.publisherId)
      return pub?.pioneerType === 'RP'
    })
    const rpHours = rpReports.reduce((sum, r) => sum + (Number(r.hours) || 0), 0)
    const rpStudies = rpReports.reduce((sum, r) => sum + (Number(r.studies) || 0), 0)

    // 5. Publisher Studies
    const publisherStudies = publisherCategoryReports.reduce((sum, r) => sum + (Number(r.studies) || 0), 0)

    stats.value.publishersReporting = pubReportingCount
    stats.value.publishersNotShared = publisherNotShared
    stats.value.apHours = apHours
    stats.value.apStudies = apStudies
    stats.value.rpHours = rpHours
    stats.value.rpStudies = rpStudies
    stats.value.publisherStudies = publisherStudies

    // Fetch Last Month Meeting Attendance
    const attendanceQuery = query(
      collection(db, 'meetingAttendance'),
      where('month', '==', lastMonth),
      where('year', '==', lastMonthYear)
    )
    const attendanceSnapshot = await getDocs(attendanceQuery)

    const getAttendanceAvg = (meetingType) => {
      const recs = attendanceSnapshot.docs
        .map(d => d.data())
        .filter(a => a.meetingType === meetingType && !a.isMemorial)
      
      if (recs.length === 0) return '0'

      const weeks = [1, 2, 3, 4, 5].map(wNum => {
        const weekRecs = recs.filter(r => {
          let w = r.weekNumber
          if (!w && r.date) {
            const parts = r.date.split('-')
            if (parts.length >= 3) {
              const day = parseInt(parts[2])
              w = Math.min(5, Math.ceil(day / 7))
            }
          }
          return Number(w) === wNum
        })
        if (weekRecs.length === 0) return null
        return weekRecs.reduce((sum, r) => sum + (Number(r.total) || (Number(r.inPerson) || 0) + (Number(r.zoom) || 0)), 0)
      })

      const validWeeks = weeks.filter(w => w !== null)
      if (validWeeks.length === 0) return '0'
      const totalSum = recs.reduce((sum, r) => sum + (Number(r.total) || (Number(r.inPerson) || 0) + (Number(r.zoom) || 0)), 0)
      const val = totalSum / validWeeks.length
      return Number.isInteger(val) ? val.toString() : val.toFixed(1)
    }

    stats.value.mwAvg = getAttendanceAvg('Midweek Meeting')
    stats.value.weAvg = getAttendanceAvg('Weekend Meeting')

  } catch (error) {
    console.error('Error loading stats:', error)
  }
}

onMounted(() => {
  loadStats()
})
</script>

<style scoped>
.stat-card {
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.stat-card:hover {
  transform: translateY(-4px);
}

.stat-icon-wrap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

@media (max-width: 600px) {
  .stat-icon-wrap {
    width: 32px;
    height: 32px;
    border-radius: 8px;
  }

  .stat-icon {
    font-size: 18px !important;
  }

  .stat-number {
    font-size: 1.2rem !important;
    line-height: 1.2 !important;
  }

  .stat-label {
    font-size: 0.65rem !important;
    letter-spacing: -0.2px;
  }
}

@media (min-width: 601px) {
  .stat-icon-wrap {
    width: 48px;
    height: 48px;
    border-radius: 14px;
  }

  .stat-icon {
    font-size: 24px !important;
  }

  .stat-number {
    font-size: 2rem !important;
    line-height: 1.2 !important;
  }

  .stat-label {
    font-size: 0.75rem !important;
  }
}

.h-100 {
  height: 100%;
}
</style>
