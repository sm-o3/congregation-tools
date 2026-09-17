<template>
  <div>
    <v-row class="mb-4">
      <v-col cols="12">
        <h1 class="text-h4 font-weight-bold">Our Christian Life and Ministry (OCLM)</h1>
      </v-col>
    </v-row>

    <!-- Navigation Tabs -->
    <v-tabs v-model="activeTab" color="primary" class="mb-6" show-arrows>
      <v-tab value="overview">Overview</v-tab>
      <v-tab value="schedule">Schedule</v-tab>
      <v-tab v-if="authStore.isAdmin" value="generator">Generator</v-tab>
      <v-tab value="workbooks">Workbooks</v-tab>
    </v-tabs>

    <v-window v-model="activeTab">
      <!-- Tab 1: Overview Placeholder -->
      <v-window-item value="overview">
        <v-card variant="outlined" class="rounded-xl pa-8 text-center bg-surface">
          <v-icon size="80" color="primary" class="mb-4">mdi-book-open-variant</v-icon>
          <h2 class="text-h5 font-weight-bold mb-2">OCLM Overview</h2>
          <p class="text-body-1 text-medium-emphasis max-width-600 mx-auto">
            View monthly and annual summaries for Treasures From God's Word, Field Ministry parts, and Living as Christians.
          </p>
          <v-chip color="primary" variant="tonal" class="mt-4 font-weight-bold">
            Overview Module Ready
          </v-chip>
        </v-card>
      </v-window-item>

      <!-- Tab 2: Schedule Placeholder -->
      <v-window-item value="schedule">
        <v-card variant="outlined" class="rounded-xl pa-8 text-center bg-surface">
          <v-icon size="80" color="info" class="mb-4">mdi-calendar-clock</v-icon>
          <h2 class="text-h5 font-weight-bold mb-2">OCLM Meeting Schedule</h2>
          <p class="text-body-1 text-medium-emphasis max-width-600 mx-auto">
            View, assign, and print student assignments, talks, and meeting parts.
          </p>
          <v-chip color="info" variant="tonal" class="mt-4 font-weight-bold">
            Schedule Module Ready
          </v-chip>
        </v-card>
      </v-window-item>

      <!-- Tab 3: Generator Placeholder -->
      <v-window-item v-if="authStore.isAdmin" value="generator">
        <v-card variant="outlined" class="rounded-xl pa-8 text-center bg-surface">
          <v-icon size="80" color="warning" class="mb-4">mdi-cog-sync</v-icon>
          <h2 class="text-h5 font-weight-bold mb-2">OCLM Schedule Generator</h2>
          <p class="text-body-1 text-medium-emphasis max-width-600 mx-auto">
            Automatically generate balanced meeting schedules based on publisher qualifications and assignment history.
          </p>
          <v-chip color="warning" variant="tonal" class="mt-4 font-weight-bold">
            Generator Module Ready
          </v-chip>
        </v-card>
      </v-window-item>

      <!-- Tab 4: Workbooks (Active View) -->
      <v-window-item value="workbooks">
        <!-- Workbooks Header Controls -->
        <v-card class="mb-6 rounded-xl border-thin" elevation="1">
          <v-card-text class="pa-4">
            <v-row align="center" justify="space-between" class="ga-2">
              <!-- Top Left: Search Option -->
              <v-col cols="12" sm="6" md="4">
                <v-text-field
                  v-model="searchQuery"
                  prepend-inner-icon="mdi-magnify"
                  label="Search weeks or workbook content..."
                  single-line
                  hide-details
                  density="comfortable"
                  variant="outlined"
                  clearable
                />
              </v-col>

              <!-- Top Right: Service Year Selector & Import Button -->
              <v-col cols="12" sm="6" md="5" class="d-flex align-center justify-end ga-3">
                <v-select
                  v-model="selectedServiceYear"
                  :items="serviceYears"
                  label="Service Year"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                  style="max-width: 170px;"
                />

                <input
                  type="file"
                  ref="fileInput"
                  accept=".xlsx, .xls, .json"
                  style="display: none"
                  @change="handleFileUpload"
                />

                <v-btn
                  color="success"
                  variant="flat"
                  prepend-icon="mdi-import"
                  :loading="importing"
                  @click="triggerFileInput"
                >
                  Import
                </v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- Expandable List of Service Year Weeks -->
        <v-card class="rounded-xl border-thin overflow-hidden" elevation="1">
          <v-card-title class="d-flex align-center bg-surface-variant py-3 px-4 text-subtitle-1 font-weight-bold">
            <v-icon icon="mdi-notebook-outline" class="mr-2" color="primary" />
            OCLM Workbooks - Service Year {{ selectedServiceYear - 1 }}-{{ selectedServiceYear }}
            <v-spacer />
            <v-chip size="small" color="primary" variant="tonal" class="font-weight-bold">
              {{ filteredWeeks.length }} Weeks
            </v-chip>
          </v-card-title>

          <v-card-text class="pa-0">
            <v-expansion-panels variant="accordion" multiple>
              <v-expansion-panel
                v-for="week in filteredWeeks"
                :key="week.id"
              >
                <v-expansion-panel-title class="py-3 px-4">
                  <div class="d-flex align-center flex-wrap ga-2 w-100">
                    <v-icon icon="mdi-calendar-week" color="primary" size="20" class="mr-1" />
                    <span class="font-weight-bold text-body-1">{{ week.label }}</span>
                    <v-chip size="x-small" color="primary" variant="tonal" class="font-weight-bold">
                      {{ week.monthName }} {{ week.year }}
                    </v-chip>
                  </div>
                </v-expansion-panel-title>

                <v-expansion-panel-text class="pa-4">
                  <v-card variant="outlined" class="rounded-lg pa-4 bg-surface">
                    <div class="d-flex align-center mb-3">
                      <v-avatar color="primary" variant="tonal" size="36" class="mr-3">
                        <v-icon icon="mdi-book-open-page-variant" size="20" />
                      </v-avatar>
                      <div>
                        <div class="text-subtitle-1 font-weight-bold">
                          Meeting Content Placeholder: {{ week.label }}
                        </div>
                        <div class="text-caption text-medium-emphasis">
                          Monday to Sunday week of {{ week.startDateStr }} - {{ week.endDateStr }}
                        </div>
                      </div>
                    </div>

                    <p class="text-body-2 text-medium-emphasis mb-4">
                      Workbook curriculum data including Bible Reading, Treasures From God's Word, Apply Yourself to the Field Ministry, and Living as Christians parts will be rendered here.
                    </p>

                    <v-row density="compact">
                      <v-col cols="12" md="4">
                        <v-card variant="tonal" color="indigo" class="pa-3 rounded-lg h-100">
                          <div class="text-caption font-weight-bold mb-1">1. Treasures From God's Word</div>
                          <div class="text-body-2 font-weight-medium">10 Min Talk & Digging for Spiritual Gems</div>
                        </v-card>
                      </v-col>
                      <v-col cols="12" md="4">
                        <v-card variant="tonal" color="teal" class="pa-3 rounded-lg h-100">
                          <div class="text-caption font-weight-bold mb-1">2. Apply Yourself to Field Ministry</div>
                          <div class="text-body-2 font-weight-medium">Starting Conversations & Following Up</div>
                        </v-card>
                      </v-col>
                      <v-col cols="12" md="4">
                        <v-card variant="tonal" color="deep-orange" class="pa-3 rounded-lg h-100">
                          <div class="text-caption font-weight-bold mb-1">3. Living as Christians</div>
                          <div class="text-body-2 font-weight-medium">Congregation Bible Study & Local Needs</div>
                        </v-card>
                      </v-col>
                    </v-row>
                  </v-card>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>

            <!-- Empty Filter State -->
            <div v-if="filteredWeeks.length === 0" class="text-center pa-8">
              <v-icon size="48" color="medium-emphasis" class="mb-2">mdi-text-search</v-icon>
              <div class="text-medium-emphasis font-weight-bold">No weeks found matching search criteria</div>
            </div>
          </v-card-text>
        </v-card>
      </v-window-item>
    </v-window>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const activeTab = ref('workbooks')

const searchQuery = ref('')
const importing = ref(false)
const fileInput = ref(null)

const currentYear = new Date().getFullYear()
const currentMonth = new Date().getMonth()
const defaultSY = currentMonth >= 8 ? currentYear + 1 : currentYear

const selectedServiceYear = ref(defaultSY)
const serviceYears = Array.from({ length: 10 }, (_, i) => 2024 + i)

const monthsNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const monthShortNames = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
]

// Calculate all Monday to Sunday week ranges for the selected Service Year (Sep 1 startYr -> Aug 31 endYr)
const serviceYearWeeks = computed(() => {
  const endYear = Number(selectedServiceYear.value)
  const startYear = endYear - 1

  const startDate = new Date(startYear, 8, 1) // Sep 1 startYear
  const endDate = new Date(endYear, 7, 31)   // Aug 31 endYear

  // Advance to first Monday on or after Sep 1
  let current = new Date(startDate)
  const dayOfWeek = current.getDay() // 0=Sun, 1=Mon...
  if (dayOfWeek !== 1) {
    const offset = (8 - dayOfWeek) % 7
    current.setDate(current.getDate() + offset)
  }

  const weeks = []

  while (current <= endDate) {
    const monday = new Date(current)
    const sunday = new Date(current)
    sunday.setDate(sunday.getDate() + 6)

    const mMonthShort = monthShortNames[monday.getMonth()]
    const sMonthShort = monthShortNames[sunday.getMonth()]

    let label = ''
    if (monday.getMonth() === sunday.getMonth()) {
      label = `${mMonthShort} ${monday.getDate()} - ${sunday.getDate()}`
    } else {
      label = `${mMonthShort} ${monday.getDate()} - ${sMonthShort} ${sunday.getDate()}`
    }

    weeks.push({
      id: monday.toISOString().split('T')[0],
      label,
      monthName: monthsNames[monday.getMonth()],
      year: monday.getFullYear(),
      startDateStr: monday.toLocaleDateString(),
      endDateStr: sunday.toLocaleDateString()
    })

    // Advance 7 days to next Monday
    current.setDate(current.getDate() + 7)
  }

  return weeks
})

const filteredWeeks = computed(() => {
  let list = serviceYearWeeks.value
  if (searchQuery.value && searchQuery.value.trim() !== '') {
    const q = searchQuery.value.toLowerCase().trim()
    list = list.filter(w => 
      w.label.toLowerCase().includes(q) ||
      w.monthName.toLowerCase().includes(q) ||
      w.year.toString().includes(q)
    )
  }
  return list
})

const triggerFileInput = () => {
  if (fileInput.value) fileInput.value.click()
}

const handleFileUpload = (event) => {
  const file = event.target.files[0]
  if (!file) return

  importing.value = true
  setTimeout(() => {
    importing.value = false
    alert(`Import complete for file: ${file.name}`)
    if (fileInput.value) fileInput.value.value = ''
  }, 1000)
}
</script>

<style scoped>
.max-width-600 {
  max-width: 600px;
}
</style>
