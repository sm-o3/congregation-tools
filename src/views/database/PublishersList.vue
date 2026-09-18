<template>
  <div>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-4">Publishers List</h1>
      </v-col>
    </v-row>
    
    <v-alert
      v-if="activeFilterTitle"
      color="info"
      variant="tonal"
      class="mb-4 d-flex align-center rounded-lg"
      closable
      @click:close="clearFilter"
    >
      <div class="d-flex align-center flex-wrap">
        <v-icon icon="mdi-filter-variant" class="mr-2" />
        <span class="font-weight-bold mr-2">Active Filter:</span>
        <span>{{ activeFilterTitle }}</span>
        <v-btn size="x-small" color="info" variant="flat" class="ml-4 font-weight-bold" @click="clearFilter">
          Clear Filter
        </v-btn>
      </div>
    </v-alert>

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
              <v-btn
                v-if="selected.length > 0 && authStore.canDelete"
                color="error"
                @click="deleteSelected"
                prepend-icon="mdi-delete"
                class="mr-2"
              >
                Delete ({{ selected.length }})
              </v-btn>
              
              <v-btn 
                v-if="authStore.isAdmin"
                color="primary" 
                @click="openAddDialog"
                prepend-icon="mdi-plus"
                class="mr-2"
              >
                Add
              </v-btn>
              
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
              <v-btn 
                v-if="selected.length > 0 && authStore.canDelete"
                icon
                color="error"
                @click="deleteSelected"
                class="mr-1"
                size="small"
              >
                <v-icon>mdi-delete</v-icon>
              </v-btn>
              
              <v-menu offset-y>
                <template v-slot:activator="{ props }">
                  <v-btn icon v-bind="props" size="small">
                    <v-icon>mdi-dots-vertical</v-icon>
                  </v-btn>
                </template>
                <v-list>
                  <v-list-item v-if="authStore.isAdmin" @click="openAddDialog" prepend-icon="mdi-plus">
                    <v-list-item-title>Add Publisher</v-list-item-title>
                  </v-list-item>
                  <v-list-item v-if="authStore.isAdmin" @click="triggerFileInput" prepend-icon="mdi-import">
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
            :items="publishersWithGroupNames"
            :search="search"
            :loading="loading"
            item-value="id"
            :show-select="authStore.canDelete"
            @click:row="handleRowClick"
          >
            <template v-slot:item.dob="{ item }">
              {{ formatDate(item.dob) }}
            </template>
            
            <template v-slot:item.baptismDate="{ item }">
              {{ formatDate(item.baptismDate) }}
            </template>
            
            <template v-slot:item.pioneerType="{ item }">
              {{ formatPioneerType(item.pioneerType) }}
            </template>

            <template v-slot:item.isDeaf="{ item }">
              <v-chip v-if="item.isDeaf" color="purple" size="x-small" variant="flat" class="font-weight-bold">
                Deaf
              </v-chip>
              <span v-else class="text-medium-emphasis">-</span>
            </template>

            <template v-slot:item.isBlind="{ item }">
              <v-chip v-if="item.isBlind" color="amber-darken-3" size="x-small" variant="flat" class="font-weight-bold">
                Blind
              </v-chip>
              <span v-else class="text-medium-emphasis">-</span>
            </template>

            <template v-slot:item.isIncarcerated="{ item }">
              <v-chip v-if="item.isIncarcerated" color="deep-orange" size="x-small" variant="flat" class="font-weight-bold">
                Incarcerated
              </v-chip>
              <span v-else class="text-medium-emphasis">-</span>
            </template>

            <template v-slot:item.remarks="{ item }">
              <span class="text-body-2">{{ item.remarks || item.comments || '-' }}</span>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>
    
    <!-- Add/Edit Dialog -->
    <v-dialog v-model="dialog" max-width="900px" scrollable>
      <v-card>
        <v-card-title>
          {{ editMode ? 'Edit Publisher' : 'Add Publisher' }}
        </v-card-title>
        
        <v-card-text style="max-height: 70vh;">
          <v-form ref="form">
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editedItem.name"
                  label="Name"
                  :rules="[v => !!v || 'Name is required']"
                />
              </v-col>
              
              <v-col cols="12" md="6">
                <div v-if="exactAgeDisplay" class="text-caption text-primary mb-1 font-weight-bold">
                  {{ exactAgeDisplay }}
                </div>
                <v-text-field
                  v-model="editedItem.dob"
                  label="Date of Birth"
                  type="date"
                  @change="calculateAgeCategory"
                  hide-details
                />
              </v-col>
              
              <v-col cols="12" md="6">
                <div v-if="exactBaptismAgeDisplay" class="text-caption text-primary mb-1 font-weight-bold">
                  {{ exactBaptismAgeDisplay }}
                </div>
                <v-text-field
                  v-model="editedItem.baptismDate"
                  label="Baptism Date"
                  type="date"
                  @change="calculateBaptismYears"
                  hide-details
                />
              </v-col>
              
              <v-col cols="12" md="6">
                <v-select
                  v-model="editedItem.gender"
                  :items="genderOptions"
                  label="Gender"
                />
              </v-col>
              
              <v-col cols="12" md="6">
                <v-select
                  v-model="editedItem.role"
                  :items="roleOptions"
                  label="Role"
                />
              </v-col>
              
              <v-col cols="12" md="6">
                <v-select
                  v-model="editedItem.pioneerType"
                  :items="pioneerTypeOptions"
                  label="Pioneer Type"
                />
              </v-col>
              
              <v-col cols="12" md="6">
                <v-select
                  v-model="editedItem.ageCategory"
                  :items="ageCategoryOptions"
                  item-title="text"
                  item-value="value"
                  label="Age Category"
                  hint="Auto-calculated from DOB, can be manually changed"
                  persistent-hint
                />
              </v-col>
              
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editedItem.mobile"
                  label="Mobile"
                />
              </v-col>
              
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editedItem.alternateMobile"
                  label="Alternate Mobile"
                />
              </v-col>
              
              <v-col cols="12">
                <v-textarea
                  v-model="editedItem.address"
                  label="Address"
                  rows="2"
                />
              </v-col>
              
              <v-col cols="12" md="6">
                <v-select
                  v-model="editedItem.groupId"
                  :items="groups"
                  item-title="name"
                  item-value="id"
                  label="Group"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-select
                  v-model="editedItem.hope"
                  :items="hopeOptions"
                  label="Hope"
                />
              </v-col>
              
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editedItem.family"
                  label="Family"
                />
              </v-col>

              <!-- Special Statuses -->
              <v-col cols="12" sm="4">
                <v-checkbox
                  v-model="editedItem.isDeaf"
                  label="Deaf"
                  hide-details
                  density="comfortable"
                />
              </v-col>

              <v-col cols="12" sm="4">
                <v-checkbox
                  v-model="editedItem.isBlind"
                  label="Blind"
                  hide-details
                  density="comfortable"
                />
              </v-col>

              <v-col cols="12" sm="4">
                <v-checkbox
                  v-model="editedItem.isIncarcerated"
                  label="Incarcerated"
                  hide-details
                  density="comfortable"
                />
              </v-col>

              <v-col cols="12">
                <v-textarea
                  v-model="editedItem.remarks"
                  label="Comments"
                  rows="2"
                  density="comfortable"
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        
        <v-card-actions>
          <v-btn 
            v-if="editMode && authStore.canDelete" 
            color="error" 
            @click="deletePublisher(editedItem)"
          >
            Delete
          </v-btn>
          <v-spacer />
          <v-btn @click="closeDialog">Cancel</v-btn>
          <v-btn color="primary" @click="savePublisher">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  serverTimestamp 
} from 'firebase/firestore'
import { db } from '@/config/firebase'
import { useAuthStore } from '@/stores/auth'
import { exportToExcel, importFromExcel, excelDateToJSDate } from '@/utils/excel'

const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()

const publishers = ref([])
const groups = ref([])
const reportsList = ref([])
const loading = ref(false)
const importing = ref(false)
const search = ref('')
const selected = ref([])
const dialog = ref(false)
const editMode = ref(false)
const showColumnSelector = ref(false)
const form = ref(null)
const fileInput = ref(null)
const calculatedAge = ref(null)
const baptismYears = ref(null)
const exactAgeDisplay = ref(null)
const exactBaptismAgeDisplay = ref(null)

// Options
const genderOptions = ['Male', 'Female']
const hopeOptions = ['Other Sheep', 'Anointed']

const roleOptions = [
  'Publisher',
  'Un-Baptized Publisher',
  'Ministerial Servant',
  'Elder',
  'Children',
  'Inactive Publisher',
  'Removed'
]

const pioneerTypeOptions = [
  { title: 'None', value: null },
  { title: 'RP (Regular Pioneer)', value: 'RP' },
  { title: 'SP (Special Pioneer)', value: 'SP' },
  { title: 'Field Missionary', value: 'Field Missionary' }
]

const ageCategoryOptions = [
  { text: 'Child (1-12)', value: 'child' },
  { text: 'Teenager (13-19)', value: 'teenager' },
  { text: 'Youngster (20-35)', value: 'youngster' },
  { text: 'Adult (36-59)', value: 'adult' },
  { text: 'Aged (60+)', value: 'aged' }
]

const allColumns = [
  { key: 'name', title: 'Name' },
  { key: 'dob', title: 'DOB' },
  { key: 'baptismDate', title: 'Baptism Date' },
  { key: 'role', title: 'Role' },
  { key: 'hope', title: 'Hope' },
  { key: 'pioneerType', title: 'Pioneer Type' },
  { key: 'mobile', title: 'Mobile' },
  { key: 'alternateMobile', title: 'Alternate Mobile' },
  { key: 'address', title: 'Address' },
  { key: 'groupName', title: 'Group' },
  { key: 'family', title: 'Family' },
  { key: 'gender', title: 'Gender' },
  { key: 'ageCategory', title: 'Age Category' },
  { key: 'isDeaf', title: 'Deaf' },
  { key: 'isBlind', title: 'Blind' },
  { key: 'isIncarcerated', title: 'Incarcerated' },
  { key: 'remarks', title: 'Comments' }
]

const visibleColumns = ref([
  'name', 'dob', 'baptismDate', 'role', 'hope', 'pioneerType', 
  'mobile', 'groupName', 'family', 'remarks'
])

const visibleHeaders = computed(() => {
  return allColumns
    .filter(col => visibleColumns.value.includes(col.key))
    .map(col => ({ ...col, value: col.key }))
})

const activeFilterTitle = computed(() => {
  const f = route.query.filter
  if (f === 'deaf') return 'Deaf / Hard of Hearing Publishers'
  if (f === 'blind') return 'Blind / Visually Impaired Publishers'
  if (f === 'incarcerated') return 'Incarcerated / Restricted Publishers'
  if (f === 's10_active') return 'S-10: All Active Publishers (6-Month Shared Ministry)'
  if (f === 's10_inactive') return 'S-10: New Inactive Publishers (6-Month No Share)'
  if (f === 's10_reactivated') return 'S-10: Reactivated Publishers'
  return null
})

const clearFilter = () => {
  router.push({ name: 'PublishersList' })
}

// Computed property to add group names & apply filters
const publishersWithGroupNames = computed(() => {
  let filtered = publishers.value.map(publisher => {
    const group = groups.value.find(g => g.id === publisher.groupId)
    return {
      ...publisher,
      groupName: group ? group.name : 'No Group'
    }
  })
  
  // Apply group-based access control
  if (authStore.isEditor && !authStore.isAdmin) {
    if (authStore.isPublisher) {
      filtered = []
    } else {
      filtered = filtered.filter(p => authStore.userGroupId && p.groupId === authStore.userGroupId)
    }
  }

  // Apply query parameter filters
  const queryFilters = route.query
  
  if (queryFilters.pioneerType) {
    filtered = filtered.filter(p => p.pioneerType === queryFilters.pioneerType)
  }
  
  if (queryFilters.role) {
    filtered = filtered.filter(p => p.role === queryFilters.role)
  }
  
  if (queryFilters.gender) {
    filtered = filtered.filter(p => p.gender === queryFilters.gender)
  }
  
  if (queryFilters.ageCategory) {
    filtered = filtered.filter(p => p.ageCategory === queryFilters.ageCategory)
  }
  
  if (queryFilters.groupId) {
    filtered = filtered.filter(p => p.groupId === queryFilters.groupId)
  }

  // Special Status & S-10 Filters
  if (queryFilters.filter === 'deaf') {
    filtered = filtered.filter(p => p.isDeaf === true || p.deaf === true || p.specialNeeds?.includes('Deaf') || (typeof p.notes === 'string' && p.notes.toLowerCase().includes('deaf')))
  } else if (queryFilters.filter === 'blind') {
    filtered = filtered.filter(p => p.isBlind === true || p.blind === true || p.specialNeeds?.includes('Blind') || (typeof p.notes === 'string' && p.notes.toLowerCase().includes('blind')))
  } else if (queryFilters.filter === 'incarcerated') {
    filtered = filtered.filter(p => p.isIncarcerated === true || p.incarcerated === true || p.specialNeeds?.includes('Incarcerated') || (typeof p.notes === 'string' && p.notes.toLowerCase().includes('incarcerated')))
  } else if (queryFilters.filter === 's10_active' || queryFilters.filter === 's10_inactive' || queryFilters.filter === 's10_reactivated') {
    const endYr = Number(queryFilters.year) || (new Date().getMonth() >= 8 ? new Date().getFullYear() + 1 : new Date().getFullYear())
    const startYr = endYr - 1
    const serviceYearMonths = [
      { month: 8, year: startYr }, { month: 9, year: startYr }, { month: 10, year: startYr }, { month: 11, year: startYr },
      { month: 0, year: endYr }, { month: 1, year: endYr }, { month: 2, year: endYr }, { month: 3, year: endYr },
      { month: 4, year: endYr }, { month: 5, year: endYr }, { month: 6, year: endYr }, { month: 7, year: endYr }
    ]

    const historyMonths = []
    for (let m = 8; m <= 11; m++) historyMonths.push({ month: m, year: startYr - 1 })
    for (let m = 0; m <= 7; m++) historyMonths.push({ month: m, year: startYr })
    const allTimelineMonths = [...historyMonths, ...serviceYearMonths]

    filtered = filtered.filter(pub => {
      if (pub.role === 'Removed') return false

      if (queryFilters.filter === 's10_active') {
        const recent6 = serviceYearMonths.slice(-6)
        return recent6.some(m => {
          const rep = reportsList.value.find(r => r.publisherId === pub.id && r.month === m.month && r.year === m.year)
          return rep ? (rep.sharedInMinistry === true || rep.sharedInMinistry === 'YES' || rep.sharedInMinistry === 'true' || (Number(rep.hours) || 0) > 0) : false
        })
      }

      const pubTimeline = allTimelineMonths.map(m => {
        const rep = reportsList.value.find(r => r.publisherId === pub.id && r.month === m.month && r.year === m.year)
        return rep ? (rep.sharedInMinistry === true || rep.sharedInMinistry === 'YES' || rep.sharedInMinistry === 'true' || (Number(rep.hours) || 0) > 0) : false
      })

      if (queryFilters.filter === 's10_inactive') {
        for (let i = 12; i <= 23; i++) {
          const streak6No = pubTimeline.slice(i - 5, i + 1).every(s => s === false)
          if (streak6No) {
            const reportedPrior = pubTimeline.slice(0, i - 5).some(s => s === true)
            if (reportedPrior) return true
          }
        }
        return false
      }

      if (queryFilters.filter === 's10_reactivated') {
        for (let i = 12; i <= 23; i++) {
          if (pubTimeline[i] === true) {
            const prior6 = pubTimeline.slice(i - 6, i)
            if (prior6.length === 6 && prior6.every(s => s === false)) return true
          }
        }
        return false
      }

      return true
    })
  }
  
  return filtered
})

const defaultItem = {
  name: '',
  dob: null,
  baptismDate: null,
  role: 'Publisher',
  hope: 'Other Sheep',
  pioneerType: null,
  mobile: '',
  alternateMobile: '',
  address: '',
  groupId: '',
  family: '',
  gender: 'Male',
  ageCategory: 'adult',
  isDeaf: false,
  isBlind: false,
  isIncarcerated: false,
  remarks: ''
}

const editedItem = ref({ ...defaultItem })

const isColumnVisible = (key) => visibleColumns.value.includes(key)

const toggleColumn = (key) => {
  const index = visibleColumns.value.indexOf(key)
  if (index > -1) {
    visibleColumns.value.splice(index, 1)
  } else {
    visibleColumns.value.push(key)
  }
}

const formatDate = (timestamp) => {
  if (!timestamp) return ''
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return date.toLocaleDateString()
}

const formatPioneerType = (type) => {
  if (!type) return '-'
  return type
}

const calculateAge = (dob) => {
  if (!dob) return null
  const birthDate = new Date(dob)
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return age
}

const getAgeCategoryFromAge = (age) => {
  if (age <= 12) return 'child'
  if (age <= 19) return 'teenager'
  if (age <= 35) return 'youngster'
  if (age <= 59) return 'adult'
  return 'aged'
}

const getExactAgeString = (dateString, prefix) => {
  if (!dateString) return null
  const d = new Date(dateString)
  const now = new Date()
  let years = now.getFullYear() - d.getFullYear()
  let months = now.getMonth() - d.getMonth()
  let days = now.getDate() - d.getDate()
  
  if (days < 0) {
    months--
  }
  if (months < 0) {
    years--
    months += 12
  }
  return `${prefix} (${years} Years ${months} Months)`
}

const calculateAgeCategory = () => {
  if (editedItem.value.dob) {
    const age = calculateAge(editedItem.value.dob)
    calculatedAge.value = age
    exactAgeDisplay.value = getExactAgeString(editedItem.value.dob, 'Age')
    if (age !== null) {
      editedItem.value.ageCategory = getAgeCategoryFromAge(age)
    }
  } else {
    calculatedAge.value = null
    exactAgeDisplay.value = null
  }
}

const calculateBaptismYears = () => {
  if (editedItem.value.baptismDate) {
    const years = calculateAge(editedItem.value.baptismDate)
    baptismYears.value = years
    exactBaptismAgeDisplay.value = getExactAgeString(editedItem.value.baptismDate, 'Baptized for')
  } else {
    baptismYears.value = null
    exactBaptismAgeDisplay.value = null
  }
}

const loadPublishers = async () => {
  loading.value = true
  try {
    const snapshot = await getDocs(collection(db, 'publishers'))
    publishers.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  } catch (error) {
    console.error('Error loading publishers:', error)
  } finally {
    loading.value = false
  }
}

const loadGroups = async () => {
  try {
    const snapshot = await getDocs(collection(db, 'groups'))
    groups.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  } catch (error) {
    console.error('Error loading groups:', error)
  }
}

const openAddDialog = () => {
  if (!authStore.isAdmin) return
  editMode.value = false
  editedItem.value = { ...defaultItem }
  calculatedAge.value = null
  baptismYears.value = null
  dialog.value = true
}

const handleRowClick = (event, { item }) => {
  if (authStore.isAdmin) {
    editPublisher(item)
  }
}

const editPublisher = (item) => {
  editMode.value = true
  // Convert Firestore timestamps to date strings for the date inputs
  const dobDate = item.dob?.toDate ? item.dob.toDate() : (item.dob ? new Date(item.dob) : null)
  const baptismDate = item.baptismDate?.toDate ? item.baptismDate.toDate() : (item.baptismDate ? new Date(item.baptismDate) : null)
  
  editedItem.value = {
    ...item,
    dob: dobDate ? dobDate.toISOString().split('T')[0] : null,
    baptismDate: baptismDate ? baptismDate.toISOString().split('T')[0] : null,
    isDeaf: item.isDeaf || false,
    isBlind: item.isBlind || false,
    isIncarcerated: item.isIncarcerated || false,
    remarks: item.remarks || item.comments || '',
    hope: item.hope || 'Other Sheep',
    pioneerType: item.pioneerType === 'TSP' ? 'Field Missionary' : item.pioneerType
  }
  
  // Calculate age and baptism years for display
  if (editedItem.value.dob) {
    calculatedAge.value = calculateAge(editedItem.value.dob)
    exactAgeDisplay.value = getExactAgeString(editedItem.value.dob, 'Age')
  }
  if (editedItem.value.baptismDate) {
    baptismYears.value = calculateAge(editedItem.value.baptismDate)
    exactBaptismAgeDisplay.value = getExactAgeString(editedItem.value.baptismDate, 'Baptized for')
  }
  
  dialog.value = true
}

const closeDialog = () => {
  dialog.value = false
  editedItem.value = { ...defaultItem }
  calculatedAge.value = null
  baptismYears.value = null
  exactAgeDisplay.value = null
  exactBaptismAgeDisplay.value = null
}

const savePublisher = async () => {
  try {
    if (editMode.value) {
      const { id, groupName, ...data } = editedItem.value
      await updateDoc(doc(db, 'publishers', id), {
        ...data,
        updatedAt: serverTimestamp()
      })
    } else {
      const { groupName, ...data } = editedItem.value
      await addDoc(collection(db, 'publishers'), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
    }
    
    await loadPublishers()
    closeDialog()
  } catch (error) {
    console.error('Error saving publisher:', error)
  }
}

const deletePublisher = async (item) => {
  if (!authStore.canDelete) return
  if (confirm('Are you sure you want to delete this publisher?')) {
    try {
      await deleteDoc(doc(db, 'publishers', item.id))
      await loadPublishers()
      closeDialog()
    } catch (error) {
      console.error('Error deleting publisher:', error)
    }
  }
}

const deleteSelected = async () => {
  if (!authStore.canDelete) return
  if (confirm(`Delete ${selected.value.length} selected publishers?`)) {
    try {
      loading.value = true
      const promises = selected.value.map(id => deleteDoc(doc(db, 'publishers', id)))
      await Promise.all(promises)
      selected.value = []
      await loadPublishers()
    } catch (error) {
      console.error('Error deleting publishers:', error)
      alert('Failed to delete some publishers')
    } finally {
      loading.value = false
    }
  }
}

const printTable = () => {
  window.print()
}

const exportData = () => {
  const dataToExport = publishersWithGroupNames.value.map(pub => {
    return {
      ...pub,
      dobStr: formatDate(pub.dob),
      baptismDateStr: formatDate(pub.baptismDate)
    }
  })
  
  const excelColumns = [
    { title: 'Name', key: 'name' },
    { title: 'Date of Birth', key: 'dobStr' },
    { title: 'Baptism Date', key: 'baptismDateStr' },
    { title: 'Gender', key: 'gender' },
    { title: 'Role', key: 'role' },
    { title: 'Pioneer Type', key: 'pioneerType' },
    { title: 'Mobile', key: 'mobile' },
    { title: 'Alternate Mobile', key: 'alternateMobile' },
    { title: 'Address', key: 'address' },
    { title: 'Group Name', key: 'groupName' },
    { title: 'Family', key: 'family' }
  ]
  
  exportToExcel(dataToExport, excelColumns, 'Publishers_List')
}

const triggerFileInput = () => {
  if (!authStore.isAdmin) return
  if (fileInput.value) {
    fileInput.value.click()
  }
}

const parseExcelDateString = (dateStr) => {
  if (!dateStr) return null
  if (typeof dateStr === 'number') return excelDateToJSDate(dateStr)
  
  const parsedDate = new Date(dateStr)
  if (!isNaN(parsedDate.getTime())) return parsedDate
  
  // Try DD/MM/YYYY or DD-MM-YYYY
  const parts = dateStr.toString().split(/[-/]/)
  if (parts.length === 3) {
    return new Date(parts[2], parts[1] - 1, parts[0])
  }
  return null
}

const handleFileUpload = async (event) => {
  if (!authStore.isAdmin) return
  const file = event.target.files[0]
  if (!file) return
  
  importing.value = true
  try {
    const excelColumns = [
      { title: 'Name', key: 'name' },
      { title: 'Date of Birth', key: 'dobStr' },
      { title: 'Baptism Date', key: 'baptismDateStr' },
      { title: 'Gender', key: 'gender' },
      { title: 'Role', key: 'role' },
      { title: 'Pioneer Type', key: 'pioneerType' },
      { title: 'Mobile', key: 'mobile' },
      { title: 'Alternate Mobile', key: 'alternateMobile' },
      { title: 'Address', key: 'address' },
      { title: 'Group Name', key: 'groupName' },
      { title: 'Family', key: 'family' }
    ]
    
    // Ensure groups are loaded so we can map Group Name to groupId
    if (groups.value.length === 0) {
      await loadGroups()
    }
    
    const data = await importFromExcel(file, excelColumns)
    
    for (const row of data) {
      if (!row.name) continue // Name is required
      
      const publisherName = row.name.toString().trim()
      
      // Map Group Name to Group ID
      let groupId = ''
      if (row.groupName) {
        const matchedGroup = groups.value.find(g => g.name.toLowerCase() === row.groupName.toString().toLowerCase().trim())
        if (matchedGroup) {
          groupId = matchedGroup.id
        }
      }
      
      const dobDate = parseExcelDateString(row.dobStr)
      const baptismDate = parseExcelDateString(row.baptismDateStr)
      
      const newPublisher = {
        name: publisherName,
        dob: dobDate ? dobDate.toISOString().split('T')[0] : null,
        baptismDate: baptismDate ? baptismDate.toISOString().split('T')[0] : null,
        gender: row.gender ? row.gender.toString() : 'Male',
        role: row.role ? row.role.toString() : 'Publisher',
        pioneerType: row.pioneerType ? row.pioneerType.toString() : null,
        mobile: row.mobile ? row.mobile.toString() : '',
        alternateMobile: row.alternateMobile ? row.alternateMobile.toString() : '',
        address: row.address ? row.address.toString() : '',
        family: row.family ? row.family.toString() : '',
        groupId: groupId,
        ageCategory: 'adult',
        updatedAt: serverTimestamp()
      }
      
      // Calculate age category automatically based on DOB if valid
      if (newPublisher.dob) {
        const age = calculateAge(newPublisher.dob)
        if (age !== null) {
          newPublisher.ageCategory = getAgeCategoryFromAge(age)
        }
      }
      
      const existingPublisher = publishers.value.find(p => p.name.toLowerCase() === publisherName.toLowerCase())
      
      if (existingPublisher) {
        // Update
        await updateDoc(doc(db, 'publishers', existingPublisher.id), newPublisher)
      } else {
        // Create
        newPublisher.createdAt = serverTimestamp()
        await addDoc(collection(db, 'publishers'), newPublisher)
      }
    }
    
    await loadPublishers()
    alert('Import completed successfully!')
  } catch (error) {
    console.error('Import error:', error)
    alert('Failed to import data: ' + error.message)
  } finally {
    importing.value = false
    if (fileInput.value) fileInput.value.value = ''
  }
}

// Watch for changes in DOB to auto-calculate age category
watch(() => editedItem.value.dob, () => {
  calculateAgeCategory()
})

watch(() => editedItem.value.baptismDate, () => {
  calculateBaptismYears()
})

const loadReports = async () => {
  try {
    const snap = await getDocs(collection(db, 'reports'))
    reportsList.value = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  } catch (e) {
    console.warn('Error loading reports in PublishersList:', e)
  }
}

onMounted(() => {
  loadPublishers()
  loadGroups()
  loadReports()
  if (route.query.search) {
    search.value = route.query.search
  } else if (route.query.publisher) {
    search.value = route.query.publisher
  }
})
</script>

<style scoped>
@media print {
  .v-btn, .v-text-field {
    display: none !important;
  }
}
</style>
