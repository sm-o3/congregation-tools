<template>
  <div class="schedule-overview">
    <!-- Header -->
    <v-row class="mb-3 align-center justify-space-between" dense>
      <v-col cols="12" sm="8">
        <h1 class="text-h4 font-weight-bold d-flex align-center ga-2">
          <v-icon color="primary">mdi-calendar-clock</v-icon>
          Schedule Overview
        </h1>
        <p class="text-body-2 text-medium-emphasis mt-1">
          Weekly congregation meetings, public talks, OCLM, cleaning, and sound assignments.
        </p>
      </v-col>
      <v-col cols="12" sm="4" class="d-flex align-center justify-sm-end ga-2 flex-wrap mt-2 mt-sm-0">
        <v-chip color="primary" variant="tonal" class="font-weight-bold" prepend-icon="mdi-calendar-week">
          {{ currentWeekLabel }}
        </v-chip>
      </v-col>
    </v-row>

    <!-- 1. Single Row 4-Column Clickable Cards (Desktop & Mobile) -->
    <v-row class="mb-4 stat-cards-row" dense>
      <!-- 1. Public Talk -->
      <v-col cols="3">
        <v-card 
          hover 
          class="stat-card stat-card-public-talk h-100 cursor-pointer" 
          @click="$router.push('/schedule/public-talks?tab=schedule')"
        >
          <v-card-text class="text-center pa-2 pa-sm-4">
            <div class="stat-icon-wrap bg-primary mb-1 mb-sm-3">
              <v-icon color="white" class="stat-icon">mdi-microphone</v-icon>
            </div>
            <div class="stat-title font-weight-bold text-primary text-truncate">Public Talk</div>
            <div class="stat-sub text-medium-emphasis text-truncate mt-1 d-none d-sm-block">
              Weekend Meeting
            </div>
            <v-chip size="x-small" color="primary" variant="tonal" class="stat-badge mt-1">
              {{ allTalks.length }} Talks
            </v-chip>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- 2. OCLM -->
      <v-col cols="3">
        <v-card 
          hover 
          class="stat-card stat-card-oclm h-100 cursor-pointer" 
          @click="$router.push('/schedule/oclm')"
        >
          <v-card-text class="text-center pa-2 pa-sm-4">
            <div class="stat-icon-wrap bg-success mb-1 mb-sm-3">
              <v-icon color="white" class="stat-icon">mdi-book-open-variant</v-icon>
            </div>
            <div class="stat-title font-weight-bold text-success text-truncate">OCLM</div>
            <div class="stat-sub text-medium-emphasis text-truncate mt-1 d-none d-sm-block">
              Life & Ministry
            </div>
            <v-chip size="x-small" color="success" variant="tonal" class="stat-badge mt-1">
              Midweek
            </v-chip>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- 3. Cleaning -->
      <v-col cols="3">
        <v-card 
          hover 
          class="stat-card stat-card-cleaning h-100 cursor-pointer" 
          @click="$router.push('/schedule/cleaning')"
        >
          <v-card-text class="text-center pa-2 pa-sm-4">
            <div class="stat-icon-wrap bg-info mb-1 mb-sm-3">
              <v-icon color="white" class="stat-icon">mdi-broom</v-icon>
            </div>
            <div class="stat-title font-weight-bold text-info text-truncate">Cleaning</div>
            <div class="stat-sub text-medium-emphasis text-truncate mt-1 d-none d-sm-block">
              Hall Cleaning
            </div>
            <v-chip size="x-small" color="info" variant="tonal" class="stat-badge mt-1">
              {{ cleaningCount > 0 ? cleaningCount + ' Scheduled' : 'Schedule' }}
            </v-chip>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- 4. Sound -->
      <v-col cols="3">
        <v-card 
          hover 
          class="stat-card stat-card-sound h-100 cursor-pointer" 
          @click="$router.push('/schedule/sound')"
        >
          <v-card-text class="text-center pa-2 pa-sm-4">
            <div class="stat-icon-wrap bg-warning mb-1 mb-sm-3">
              <v-icon color="white" class="stat-icon">mdi-volume-high</v-icon>
            </div>
            <div class="stat-title font-weight-bold text-warning text-truncate">Sound</div>
            <div class="stat-sub text-medium-emphasis text-truncate mt-1 d-none d-sm-block">
              Audio & Video
            </div>
            <v-chip size="x-small" color="warning" variant="tonal" class="stat-badge mt-1">
              {{ soundCount > 0 ? soundCount + ' Scheduled' : 'Schedule' }}
            </v-chip>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Loading State -->
    <div v-if="loading" class="text-center pa-8 my-4">
      <v-progress-circular indeterminate color="primary" size="48" width="4" class="mb-2" />
      <div class="text-body-2 text-medium-emphasis">Loading schedule information...</div>
    </div>

    <!-- 2. This Week's Schedule Section -->
    <div v-else>
      <v-card class="rounded-xl border elevation-1 mb-4">
        <v-card-title class="pa-3 pa-sm-4 pb-2 d-flex align-center justify-space-between flex-wrap ga-2 border-b">
          <div class="d-flex align-center ga-2">
            <v-icon color="primary" size="22">mdi-calendar-star</v-icon>
            <span class="text-subtitle-1 text-sm-h6 font-weight-bold">This Week's Schedule</span>
          </div>
          <div class="d-flex align-center ga-2">
            <v-chip size="small" color="primary" variant="flat" class="font-weight-bold">
              {{ currentWeekDateString }}
            </v-chip>
          </div>
        </v-card-title>

        <v-card-text class="pa-3 pa-sm-4">
          <!-- Featured Public Talk & Watchtower Reading Box -->
          <v-card variant="outlined" class="rounded-lg mb-4 meeting-hero-card border-primary">
            <div class="meeting-hero-header pa-3 px-4 d-flex align-center justify-space-between flex-wrap ga-2">
              <div class="d-flex align-center ga-2">
                <v-chip size="small" color="primary" variant="flat" class="font-weight-bold text-uppercase">
                  Weekend Meeting
                </v-chip>
                <span class="text-subtitle-2 font-weight-bold">
                  {{ featuredTalkDateFormatted }}
                </span>
              </div>
              <v-chip 
                v-if="isCurrentWeekTalk" 
                size="x-small" 
                color="success" 
                variant="tonal" 
                class="font-weight-bold"
              >
                Current Week
              </v-chip>
              <v-chip 
                v-else-if="featuredTalk" 
                size="x-small" 
                color="warning" 
                variant="tonal" 
                class="font-weight-bold"
              >
                Next Scheduled
              </v-chip>
            </div>

            <v-divider />

            <div class="pa-4" v-if="featuredTalk">
              <!-- Talk Title & Number -->
              <div class="mb-4">
                <div class="text-caption text-medium-emphasis font-weight-bold text-uppercase mb-1">
                  Public Talk Title
                </div>
                <div class="text-h6 text-sm-h5 font-weight-bold text-primary d-flex align-center flex-wrap ga-2">
                  <v-chip v-if="featuredTalk.talkNumber" size="small" color="primary" variant="tonal" class="font-weight-bold">
                    No. {{ featuredTalk.talkNumber }}
                  </v-chip>
                  <span>{{ featuredTalk.talkTitle || 'Untitled Talk' }}</span>
                </div>
              </div>

              <!-- 3 Key Columns: Speaker, Chairman, WT Reader -->
              <v-row dense class="schedule-details-grid">
                <!-- 1. Speaker -->
                <v-col cols="12" sm="4">
                  <v-card variant="tonal" color="primary" class="pa-3 rounded-lg h-100 detail-box">
                    <div class="d-flex align-center ga-2 mb-1">
                      <v-avatar size="28" color="primary" variant="flat">
                        <v-icon size="16" color="white">mdi-account-tie</v-icon>
                      </v-avatar>
                      <span class="text-caption font-weight-bold text-uppercase">Speaker</span>
                    </div>
                    <div class="text-subtitle-1 font-weight-bold mt-1 text-truncate" :title="featuredTalk.speaker">
                      {{ featuredTalk.speaker || 'To be assigned' }}
                    </div>
                  </v-card>
                </v-col>

                <!-- 2. Chairman -->
                <v-col cols="12" sm="4">
                  <v-card variant="tonal" color="indigo" class="pa-3 rounded-lg h-100 detail-box">
                    <div class="d-flex align-center ga-2 mb-1">
                      <v-avatar size="28" color="indigo" variant="flat">
                        <v-icon size="16" color="white">mdi-gavel</v-icon>
                      </v-avatar>
                      <span class="text-caption font-weight-bold text-uppercase">Chairman</span>
                    </div>
                    <div class="text-subtitle-1 font-weight-bold mt-1 text-truncate" :title="featuredTalk.chairman">
                      {{ featuredTalk.chairman || 'To be assigned' }}
                    </div>
                  </v-card>
                </v-col>

                <!-- 3. Watchtower Reading -->
                <v-col cols="12" sm="4">
                  <v-card variant="tonal" color="deep-purple" class="pa-3 rounded-lg h-100 detail-box">
                    <div class="d-flex align-center ga-2 mb-1">
                      <v-avatar size="28" color="deep-purple" variant="flat">
                        <v-icon size="16" color="white">mdi-book-open-page-variant</v-icon>
                      </v-avatar>
                      <span class="text-caption font-weight-bold text-uppercase">WT Reader</span>
                    </div>
                    <div class="text-subtitle-1 font-weight-bold mt-1 text-truncate" :title="featuredTalk.watchtowerReading">
                      {{ featuredTalk.watchtowerReading || 'To be assigned' }}
                    </div>
                  </v-card>
                </v-col>
              </v-row>
            </div>

            <!-- Empty Talk State -->
            <div v-else class="pa-6 text-center">
              <v-icon size="40" color="medium-emphasis" class="mb-2">mdi-microphone-off</v-icon>
              <div class="text-subtitle-1 font-weight-bold">No public talk scheduled for this week</div>
              <div class="text-body-2 text-medium-emphasis mb-3">Add or generate talks in Public Talks schedule.</div>
              <v-btn color="primary" variant="tonal" size="small" to="/schedule/public-talks?tab=schedule" prepend-icon="mdi-plus">
                Manage Public Talks
              </v-btn>
            </div>
          </v-card>

          <!-- Midweek & Hall Duties in This Week -->
          <v-row dense>
            <!-- Midweek OCLM Summary -->
            <v-col cols="12" md="4">
              <v-card variant="outlined" class="rounded-lg h-100 pa-3">
                <div class="d-flex align-center justify-space-between mb-2">
                  <div class="d-flex align-center ga-2">
                    <v-icon color="success" size="20">mdi-book-open-variant</v-icon>
                    <span class="text-subtitle-2 font-weight-bold">Midweek Meeting (OCLM)</span>
                  </div>
                  <v-btn size="x-small" variant="text" color="success" to="/schedule/oclm">Open</v-btn>
                </div>
                <div class="text-caption text-medium-emphasis">
                  Treasures From God's Word, Apply Yourself to Field Ministry & Living as Christians.
                </div>
              </v-card>
            </v-col>

            <!-- Cleaning Summary -->
            <v-col cols="12" md="4">
              <v-card variant="outlined" class="rounded-lg h-100 pa-3">
                <div class="d-flex align-center justify-space-between mb-2">
                  <div class="d-flex align-center ga-2">
                    <v-icon color="info" size="20">mdi-broom</v-icon>
                    <span class="text-subtitle-2 font-weight-bold">Cleaning Duty</span>
                  </div>
                  <v-btn size="x-small" variant="text" color="info" to="/schedule/cleaning">Open</v-btn>
                </div>
                <div class="text-caption text-medium-emphasis">
                  <span v-if="thisWeekCleaning">
                    Assigned: <strong>{{ thisWeekCleaning.group || thisWeekCleaning.members || 'Scheduled' }}</strong>
                  </span>
                  <span v-else>
                    Kingdom Hall cleaning assignment for this week.
                  </span>
                </div>
              </v-card>
            </v-col>

            <!-- Sound & Video Summary -->
            <v-col cols="12" md="4">
              <v-card variant="outlined" class="rounded-lg h-100 pa-3">
                <div class="d-flex align-center justify-space-between mb-2">
                  <div class="d-flex align-center ga-2">
                    <v-icon color="warning" size="20">mdi-volume-high</v-icon>
                    <span class="text-subtitle-2 font-weight-bold">Sound & Video</span>
                  </div>
                  <v-btn size="x-small" variant="text" color="warning" to="/schedule/sound">Open</v-btn>
                </div>
                <div class="text-caption text-medium-emphasis">
                  <span v-if="thisWeekSound">
                    PC: <strong>{{ thisWeekSound.pc || '-' }}</strong> | Mic: <strong>{{ thisWeekSound.rowingA || '-' }}</strong>
                  </span>
                  <span v-else>
                    Stage, sound console, and roving microphones duty.
                  </span>
                </div>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- Upcoming Public Talks List -->
      <v-card class="rounded-xl border elevation-1">
        <v-card-title class="pa-3 pa-sm-4 pb-2 d-flex align-center justify-space-between flex-wrap ga-2 border-b">
          <div class="d-flex align-center ga-2">
            <v-icon color="primary" size="22">mdi-format-list-numbered</v-icon>
            <span class="text-subtitle-1 font-weight-bold">Upcoming Public Talks</span>
          </div>
          <v-btn size="small" variant="text" color="primary" to="/schedule/public-talks?tab=schedule" append-icon="mdi-arrow-right">
            All Talks
          </v-btn>
        </v-card-title>
        <v-card-text class="pa-0">
          <v-list lines="two" v-if="upcomingTalksList.length > 0">
            <v-list-item
              v-for="talk in upcomingTalksList"
              :key="talk.id"
              class="px-3 px-sm-4 py-2 border-b cursor-pointer"
              @click="$router.push('/schedule/public-talks?tab=schedule')"
            >
              <template v-slot:prepend>
                <v-avatar color="primary" variant="tonal" size="36" class="mr-3 font-weight-bold">
                  {{ talk.talkNumber || '#' }}
                </v-avatar>
              </template>

              <v-list-item-title class="font-weight-bold text-body-1">
                {{ talk.talkTitle }}
              </v-list-item-title>

              <v-list-item-subtitle class="text-caption text-medium-emphasis mt-1 d-flex align-center flex-wrap ga-2">
                <span><v-icon size="14" class="mr-1">mdi-calendar</v-icon>{{ formatItemDate(talk.date) }}</span>
                <span>•</span>
                <span>Speaker: <strong>{{ talk.speaker || '-' }}</strong></span>
                <span>•</span>
                <span>Chairman: <strong>{{ talk.chairman || '-' }}</strong></span>
                <span>•</span>
                <span>WT Reader: <strong>{{ talk.watchtowerReading || '-' }}</strong></span>
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>
          <div v-else class="pa-6 text-center text-medium-emphasis">
            No upcoming talks found.
          </div>
        </v-card-text>
      </v-card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore'
import { db } from '@/config/firebase'

const loading = ref(true)
const allTalks = ref([])
const cleaningSchedules = ref([])
const soundSchedules = ref([])

// Date parsing helper
const parseDate = (val) => {
  if (!val) return null
  if (val.toDate && typeof val.toDate === 'function') return val.toDate()
  if (val instanceof Date) return val
  const d = new Date(val)
  return isNaN(d.getTime()) ? null : d
}

// Current week date bounds (Monday to Sunday)
const getWeekBounds = (refDate = new Date()) => {
  const d = new Date(refDate)
  const day = d.getDay() // 0 = Sun, 1 = Mon ...
  const diffToMonday = (day === 0 ? -6 : 1) - day
  const monday = new Date(d)
  monday.setDate(d.getDate() + diffToMonday)
  monday.setHours(0, 0, 0, 0)

  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)

  return { start: monday, end: sunday }
}

const weekBounds = getWeekBounds()

const currentWeekLabel = computed(() => {
  const options = { month: 'short', day: 'numeric' }
  const startStr = weekBounds.start.toLocaleDateString('en-US', options)
  const endStr = weekBounds.end.toLocaleDateString('en-US', { ...options, year: 'numeric' })
  return `${startStr} – ${endStr}`
})

const currentWeekDateString = computed(() => {
  const options = { weekday: 'short', month: 'short', day: 'numeric' }
  const startStr = weekBounds.start.toLocaleDateString('en-US', options)
  const endStr = weekBounds.end.toLocaleDateString('en-US', options)
  return `${startStr} to ${endStr}`
})

// Current week's talk
const currentWeekTalk = computed(() => {
  return allTalks.value.find(t => {
    const d = parseDate(t.date)
    return d && d >= weekBounds.start && d <= weekBounds.end
  }) || null
})

// Earliest upcoming talk (fallback if no talk in this exact Monday-Sunday)
const earliestUpcomingTalk = computed(() => {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const futureTalks = allTalks.value
    .filter(t => {
      const d = parseDate(t.date)
      return d && d >= now
    })
    .sort((a, b) => (parseDate(a.date) || 0) - (parseDate(b.date) || 0))

  return futureTalks[0] || (allTalks.value.length > 0 ? allTalks.value[0] : null)
})

const isCurrentWeekTalk = computed(() => !!currentWeekTalk.value)

const featuredTalk = computed(() => {
  return currentWeekTalk.value || earliestUpcomingTalk.value
})

const featuredTalkDateFormatted = computed(() => {
  if (!featuredTalk.value || !featuredTalk.value.date) return 'No Date'
  const d = parseDate(featuredTalk.value.date)
  if (!d) return ''
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })
})

const formatItemDate = (val) => {
  const d = parseDate(val)
  if (!d) return ''
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

// Next upcoming talks for the list (exclude featured one)
const upcomingTalksList = computed(() => {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return allTalks.value
    .filter(t => {
      const d = parseDate(t.date)
      return d && d >= now
    })
    .sort((a, b) => (parseDate(a.date) || 0) - (parseDate(b.date) || 0))
    .slice(0, 5)
})

// Cleaning for this week
const cleaningCount = computed(() => cleaningSchedules.value.length)
const thisWeekCleaning = computed(() => {
  for (const cs of cleaningSchedules.value) {
    if (cs.schedule && Array.isArray(cs.schedule)) {
      const match = cs.schedule.find(item => {
        const d = parseDate(item.date)
        return d && d >= weekBounds.start && d <= weekBounds.end
      })
      if (match) return match
    }
  }
  return null
})

// Sound for this week
const soundCount = computed(() => soundSchedules.value.length)
const thisWeekSound = computed(() => {
  return soundSchedules.value.find(item => {
    const d = parseDate(item.date)
    return d && d >= weekBounds.start && d <= weekBounds.end
  }) || null
})

const loadData = async () => {
  loading.value = true
  try {
    // 1. Load Public Talks
    const ptSnap = await getDocs(collection(db, 'publicTalks'))
    allTalks.value = ptSnap.docs.map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (parseDate(b.date) || 0) - (parseDate(a.date) || 0))

    // 2. Load Cleaning Schedules
    try {
      const cleanSnap = await getDocs(
        query(collection(db, 'schedules'), where('type', '==', 'cleaning'), limit(5))
      )
      cleaningSchedules.value = cleanSnap.docs.map(d => ({ id: d.id, ...d.data() }))
    } catch (err) {
      console.warn('Could not load cleaning schedules:', err)
    }

    // 3. Load Sound Schedules
    try {
      const savedSound = localStorage.getItem('soundScheduleData')
      if (savedSound) {
        soundSchedules.value = JSON.parse(savedSound)
      }
    } catch (err) {
      console.warn('Could not load sound schedules from localStorage:', err)
    }
  } catch (err) {
    console.error('Error loading schedule overview data:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}

.stat-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  border-radius: 12px;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.1) !important;
}

.stat-icon-wrap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* Mobile optimizations: 4 cards strictly in a single row */
@media (max-width: 600px) {
  .stat-icon-wrap {
    width: 28px;
    height: 28px;
    border-radius: 8px;
  }

  .stat-icon {
    font-size: 16px !important;
  }

  .stat-title {
    font-size: 0.72rem !important;
    line-height: 1.15 !important;
    letter-spacing: -0.2px;
  }

  .stat-badge {
    font-size: 0.58rem !important;
    height: 18px !important;
    padding: 0 4px !important;
  }
}

@media (min-width: 601px) {
  .stat-icon-wrap {
    width: 44px;
    height: 44px;
    border-radius: 12px;
  }

  .stat-icon {
    font-size: 22px !important;
  }

  .stat-title {
    font-size: 0.95rem !important;
    line-height: 1.3 !important;
  }

  .stat-sub {
    font-size: 0.75rem !important;
  }
}

.meeting-hero-card {
  background: rgba(var(--v-theme-primary), 0.02);
}

.meeting-hero-header {
  background: rgba(var(--v-theme-primary), 0.06);
}

.detail-box {
  transition: transform 0.15s ease;
}

.detail-box:hover {
  transform: translateY(-1px);
}
</style>
