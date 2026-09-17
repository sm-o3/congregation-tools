<template>
  <div class="add-report-container">
    <v-row class="mb-4 d-flex align-center">
      <v-col cols="12" class="d-flex align-center">
        <h1 class="text-h4 font-weight-bold text-primary mr-3">Add Report</h1>
        <v-chip color="primary" variant="tonal" size="small" class="font-weight-medium">
          {{ months.find(m => m.value === selectedMonth)?.name }} {{ selectedYear }}
        </v-chip>
      </v-col>
    </v-row>
    
    <v-row>
      <!-- Form Panel -->
      <v-col cols="12" md="7" lg="8">
        <v-card class="elevation-2 rounded-xl border-thin">
          <v-card-text class="pa-sm-6 pa-4">
            <v-form ref="form" @submit.prevent="submitReport">
              
              <!-- First Row (Month/Year) -->
              <v-row>
                <v-col cols="12" sm="6">
                  <v-select
                    v-model="selectedMonth"
                    :items="months"
                    item-title="name"
                    item-value="value"
                    label="Month"
                    variant="outlined"
                    density="comfortable"
                    bg-color="surface"
                    rounded="lg"
                    :rules="[v => v !== null || 'Month is required']"
                  />
                </v-col>
                
                <v-col cols="12" sm="6">
                  <v-select
                    v-model="selectedYear"
                    :items="years"
                    label="Year"
                    variant="outlined"
                    density="comfortable"
                    bg-color="surface"
                    rounded="lg"
                    :rules="[v => !!v || 'Year is required']"
                  />
                </v-col>
              </v-row>
              
              <v-divider class="my-4 opacity-50"></v-divider>
              
              <!-- Second Row (Group/Publisher/Role) -->
              <v-row>
                <v-col cols="12" sm="6">
                  <v-select
                    v-model="report.groupId"
                    :items="groups"
                    item-title="name"
                    item-value="id"
                    label="Select Group"
                    variant="outlined"
                    density="comfortable"
                    bg-color="surface"
                    rounded="lg"
                    :rules="[v => !!v || 'Group is required']"
                    :disabled="authStore.isEditor"
                    @update:model-value="onGroupChange"
                  />
                </v-col>
                
                <v-col cols="12" sm="6">
                  <v-select
                    v-model="report.publisherId"
                    :items="filteredPublishers"
                    item-title="name"
                    item-value="id"
                    label="Select Publisher"
                    variant="outlined"
                    density="comfortable"
                    bg-color="surface"
                    rounded="lg"
                    :rules="[v => !!v || 'Publisher is required']"
                    :disabled="!report.groupId"
                    @update:model-value="onPublisherChange"
                  />
                </v-col>
                
                <v-col cols="12" sm="6" v-if="report.publisherId">
                  <v-select
                    v-model="currentPublisherRole"
                    :items="roleOptions"
                    label="Current Role"
                    variant="outlined"
                    density="comfortable"
                    bg-color="surface"
                    rounded="lg"
                    hint="Update role if changed"
                    persistent-hint
                    @update:model-value="updatePublisherRole"
                  />
                </v-col>

                <v-col cols="12" sm="6" v-if="report.publisherId">
                  <v-select
                    v-model="report.pioneerType"
                    :items="pioneerTypeOptions"
                    item-title="title"
                    item-value="value"
                    label="Pioneer Type"
                    variant="outlined"
                    density="comfortable"
                    bg-color="surface"
                    rounded="lg"
                    hint="Auto-fetched, can be changed"
                    persistent-hint
                  />
                </v-col>
              </v-row>
              
              <!-- Checkboxes replaced with Switch cards for mobile friendliness -->
              <v-row class="mt-4" v-if="report.publisherId">
                <v-col cols="12" sm="6">
                  <v-card 
                    variant="outlined" 
                    class="d-flex align-center px-4 py-2 hover-card"
                    :class="{ 'border-primary bg-primary-lighten-5': report.sharedInMinistry }"
                    @click="report.sharedInMinistry = !report.sharedInMinistry"
                    style="cursor: pointer; min-height: 64px;"
                  >
                    <div class="d-flex flex-column text-left">
                      <span class="font-weight-medium">Shared in Ministry</span>
                      <span class="text-caption text-medium-emphasis">Report participation</span>
                    </div>
                    <v-spacer></v-spacer>
                    <v-switch
                      v-model="report.sharedInMinistry"
                      color="primary"
                      hide-details
                      readonly
                      class="mt-0"
                    ></v-switch>
                  </v-card>
                </v-col>
                
                <v-col cols="12" sm="6">
                  <v-card 
                    variant="outlined" 
                    class="d-flex align-center px-4 py-2 hover-card"
                    :class="{ 
                      'border-primary bg-primary-lighten-5': report.auxiliaryPioneer,
                      'opacity-50': isRegularPioneer || !report.sharedInMinistry 
                    }"
                    @click="(!isRegularPioneer && report.sharedInMinistry) ? report.auxiliaryPioneer = !report.auxiliaryPioneer : null"
                    :style="(!isRegularPioneer && report.sharedInMinistry) ? 'cursor: pointer; min-height: 64px;' : 'min-height: 64px;'"
                  >
                    <div class="d-flex flex-column text-left">
                      <span class="font-weight-medium">Auxiliary Pioneer</span>
                      <span class="text-caption text-medium-emphasis">This month only</span>
                    </div>
                    <v-spacer></v-spacer>
                    <v-switch
                      v-model="report.auxiliaryPioneer"
                      color="primary"
                      hide-details
                      readonly
                      :disabled="isRegularPioneer || !report.sharedInMinistry"
                      class="mt-0"
                    ></v-switch>
                  </v-card>
                </v-col>
              </v-row>
              
              <!-- Numbers -->
              <v-row class="mt-4" v-if="report.publisherId">
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model.number="report.hours"
                    label="Hours (if applicable)"
                    type="number"
                    min="0"
                    variant="outlined"
                    density="comfortable"
                    bg-color="surface"
                    rounded="lg"
                    :disabled="!report.auxiliaryPioneer && !isRegularPioneer"
                    :rules="hoursRules"
                    prepend-inner-icon="mdi-clock-outline"
                  />
                </v-col>
                
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model.number="report.studies"
                    label="Number of Studies"
                    type="number"
                    min="0"
                    variant="outlined"
                    density="comfortable"
                    bg-color="surface"
                    rounded="lg"
                    :disabled="!report.sharedInMinistry && !isRegularPioneer"
                    prepend-inner-icon="mdi-book-open-variant"
                  />
                </v-col>
                
                <v-col cols="12">
                  <v-textarea
                    v-model="report.comments"
                    label="Comments / Notes"
                    rows="2"
                    variant="outlined"
                    density="comfortable"
                    bg-color="surface"
                    rounded="lg"
                    auto-grow
                  />
                </v-col>
              </v-row>
              
              <v-alert 
                v-if="monthStatus === 'closed'" 
                type="error"
                variant="tonal"
                class="mb-4 rounded-lg"
                density="compact"
                prepend-icon="mdi-lock"
              >
                This month is closed and cannot be edited.
              </v-alert>

              <v-btn 
                type="submit" 
                color="primary" 
                block
                size="large"
                class="mt-2 rounded-lg font-weight-bold"
                elevation="2"
                :loading="saving"
                :disabled="monthStatus === 'closed'"
                append-icon="mdi-send"
              >
                {{ monthStatus === 'closed' ? 'Month Closed' : 'Submit Report' }}
              </v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
      
      <!-- Not Yet Reported Panel (Sidebar on Desktop, Bottom on Mobile) -->
      <v-col cols="12" md="5" lg="4">
        <v-card class="elevation-2 rounded-xl h-100 overflow-hidden d-flex flex-column border-thin">
          <div class="bg-primary text-white pa-4 d-flex align-center">
            <v-icon class="mr-3" color="white" size="28">mdi-clipboard-text-clock-outline</v-icon>
            <div>
              <div class="text-h6 font-weight-medium line-height-1">Not Yet Reported</div>
              <div class="text-caption opacity-80 mt-1">For selected month & group</div>
            </div>
            <v-spacer />
            <v-chip color="white" variant="outlined" size="small" class="font-weight-bold">
              {{ missingPublishers.length }}
            </v-chip>
          </div>
          
          <v-card-text v-if="!report.groupId" class="text-grey text-center pa-8 flex-grow-1 d-flex flex-column justify-center align-center">
            <v-icon size="48" color="grey-lighten-2" class="mb-4">mdi-account-group</v-icon>
            <div>Select a group to see pending reports</div>
          </v-card-text>
          
          <v-card-text v-else-if="loadingReports" class="text-center pa-8 flex-grow-1 d-flex justify-center align-center">
            <v-progress-circular indeterminate color="primary" size="32" class="mr-3" />
            <span>Loading pending list...</span>
          </v-card-text>
          
          <v-card-text v-else-if="missingPublishers.length === 0" class="text-center pa-8 flex-grow-1 d-flex flex-column justify-center align-center">
            <div class="success-ring mb-4">
              <v-icon size="48" color="success">mdi-check</v-icon>
            </div>
            <div class="text-success font-weight-bold text-h6">All Clear!</div>
            <div class="text-grey-darken-1 text-body-2 mt-2">Everyone in this group has reported.</div>
          </v-card-text>
          
          <v-list v-else density="comfortable" class="pa-2 flex-grow-1 overflow-auto bg-transparent">
            <v-list-item
              v-for="pub in missingPublishers"
              :key="pub.id"
              @click="selectPublisher(pub)"
              class="rounded-lg mb-1 transition-fast-in-fast-out"
              :class="{ 'bg-primary-lighten-5 border-primary': report.publisherId === pub.id }"
              :elevation="report.publisherId === pub.id ? 1 : 0"
            >
              <template v-slot:prepend>
                <v-avatar size="36" :color="report.publisherId === pub.id ? 'primary' : 'grey-lighten-3'" class="mr-3">
                  <span :class="report.publisherId === pub.id ? 'text-white' : 'text-grey-darken-2'">
                    {{ pub.name.charAt(0).toUpperCase() }}
                  </span>
                </v-avatar>
              </template>
              <v-list-item-title class="font-weight-medium">{{ pub.name }}</v-list-item-title>
              <v-list-item-subtitle class="text-caption">
                {{ pub.role || 'Publisher' }}
                <span v-if="pub.pioneerType" class="text-primary font-weight-medium"> · {{ pub.pioneerType }}</span>
              </v-list-item-subtitle>
              <template v-slot:append v-if="report.publisherId === pub.id">
                <v-icon color="primary" size="small">mdi-chevron-right</v-icon>
              </template>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { collection, getDocs, addDoc, updateDoc, doc, getDoc, serverTimestamp, query, where } from 'firebase/firestore'
import { db } from '@/config/firebase'
import { useAuthStore } from '@/stores/auth'
import { logActivity } from '@/utils/logging'

const authStore = useAuthStore()

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
const groups = ref([])
const publishers = ref([])
const saving = ref(false)
const message = ref('')
const messageType = ref('success')
const form = ref(null)
const currentPublisherRole = ref('Publisher')
const isRegularPioneer = ref(false)
const existingReports = ref([])
const loadingReports = ref(false)
const monthStatus = ref('open')

const report = ref({
  groupId: '',
  publisherId: '',
  pioneerType: null,
  sharedInMinistry: false,
  auxiliaryPioneer: false,
  hours: 0,
  studies: 0,
  comments: ''
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

// Generate year options (2024 to 2035)
const years = Array.from({ length: 12 }, (_, i) => 2024 + i)


// Role options matching PublishersList
const roleOptions = [
  'Publisher',
  'Un-Baptized Publisher',
  'Ministerial Servant',
  'Elder',
  'Inactive Publisher',
  'Removed'
]

const pioneerTypeOptions = [
  { title: 'None', value: null },
  { title: 'RP (Regular Pioneer)', value: 'RP' },
  { title: 'SP (Special Pioneer)', value: 'SP' },
  { title: 'TSP (Temporary Special Pioneer)', value: 'TSP' }
]

const filteredPublishers = computed(() => {
  if (!report.value.groupId) return []
  
  const selectedGroup = groups.value.find(g => g.id === report.value.groupId)
  if (!selectedGroup || !selectedGroup.members) return []
  
  return publishers.value.filter(p => {
    // Filter by group member
    if (!selectedGroup.members.includes(p.id)) return false
    // Filter out ONLY inactive/removed unless they are the currently selected one
    // Include all others: Publisher, Elder, MS, Un-Baptized Publisher, or undefined/null roles
    //if (p.id !== report.value.publisherId) {
    //  const role = p.role || 'Publisher' // Default to Publisher if role is undefined
    //  if (['Inactive Publisher', 'Removed'].includes(role)) return false
    //}
    return true
  })
})

// Computed rules for hours
const hoursRules = computed(() => {
  if (isRegularPioneer.value || report.value.auxiliaryPioneer) {
    return [v => (v !== null && v >= 0) || 'Hours are required for pioneers']
  }
  return []
})

const onGroupChange = () => {
  report.value.publisherId = ''
  currentPublisherRole.value = 'Publisher'
  isRegularPioneer.value = false
  loadExistingReports()
}

// Watch publisher selection to update pioneer status and role
const onPublisherChange = () => {
  const publisher = publishers.value.find(p => p.id === report.value.publisherId)
  if (publisher) {
    currentPublisherRole.value = publisher.role
    
    // Auto-fetch pioneer type
    report.value.pioneerType = publisher.pioneerType || null
    
    // Update local validation flag based on fetched type
    // Note: We use the report's pioneerType now, which can be manually changed
    isRegularPioneer.value = ['RP', 'SP', 'TSP'].includes(report.value.pioneerType)
    
    // Auto-set Aux Pioneer to false if Regular Pioneer
    if (isRegularPioneer.value) {
      report.value.auxiliaryPioneer = false
    }
  } else {
    currentPublisherRole.value = 'Publisher'
    report.value.pioneerType = null
    isRegularPioneer.value = false
  }
}

// Watch for manual changes to pioneer type in the form
watch(() => report.value.pioneerType, (newValue) => {
  isRegularPioneer.value = ['RP', 'SP', 'TSP'].includes(newValue)
  if (isRegularPioneer.value) {
    report.value.auxiliaryPioneer = false
  }
})

// When Shared in Ministry is unchecked, reset AP, Hours, Studies
watch(() => report.value.sharedInMinistry, (checked) => {
  if (!checked && !isRegularPioneer.value) {
    report.value.auxiliaryPioneer = false
    report.value.hours = 0
    report.value.studies = 0
  }
})

// When Auxiliary Pioneer is unchecked, reset Hours (unless Regular Pioneer)
watch(() => report.value.auxiliaryPioneer, (checked) => {
  if (!checked && !isRegularPioneer.value) {
    report.value.hours = 0
  }
})

// Update publisher role in Firestore
const updatePublisherRole = async (newRole) => {
  if (!report.value.publisherId) return
  
  try {
    const { doc, updateDoc } = await import('firebase/firestore')
    await updateDoc(doc(db, 'publishers', report.value.publisherId), {
      role: newRole
    })
    
    // Update local state
    const publisher = publishers.value.find(p => p.id === report.value.publisherId)
    if (publisher) publisher.role = newRole
    
  } catch (error) {
    console.error('Error updating role:', error)
  }
}

const loadGroups = async () => {
  try {
    const snapshot = await getDocs(collection(db, 'groups'))
    groups.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    if (authStore.isEditor && authStore.userGroupId) {
      report.value.groupId = authStore.userGroupId
      onGroupChange()
    }
  } catch (error) {
    console.error('Error loading groups:', error)
  }
}

const loadPublishers = async () => {
  try {
    const snapshot = await getDocs(collection(db, 'publishers'))
    publishers.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  } catch (error) {
    console.error('Error loading publishers:', error)
  }
}

// Load existing reports for current month/year
const loadExistingReports = async () => {
  if (selectedMonth.value === null || !selectedYear.value) return
  
  loadingReports.value = true
  try {
    const reportsQuery = query(
      collection(db, 'reports'),
      where('month', '==', selectedMonth.value),
      where('year', '==', selectedYear.value)
    )
    const snapshot = await getDocs(reportsQuery)
    existingReports.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    await loadMonthStatus()
  } catch (error) {
    console.error('Error loading existing reports:', error)
  } finally {
    loadingReports.value = false
  }
}

const loadMonthStatus = async () => {
  const statusId = `${selectedYear.value}-${String(selectedMonth.value + 1).padStart(2, '0')}`
  try {
    const docRef = doc(db, 'monthStatus', statusId)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      monthStatus.value = docSnap.data().status
    } else {
      monthStatus.value = 'open'
    }
  } catch (error) {
    console.error('Error loading month status:', error)
  }
}

// Compute publishers who haven't submitted reports yet
const missingPublishers = computed(() => {
  if (!report.value.groupId) return []
  
  const groupPublishers = filteredPublishers.value
  const reportedIds = existingReports.value.map(r => r.publisherId)
  
  return groupPublishers.filter(p => !reportedIds.includes(p.id))
})

// Click a missing publisher to auto-select them
const selectPublisher = (pub) => {
  report.value.publisherId = pub.id
  onPublisherChange()
}

const submitReport = async () => {
  const { valid } = await form.value.validate()
  if (!valid) return
  
  try {
    saving.value = true
    message.value = ''

    if (monthStatus.value === 'closed') {
      message.value = 'This month is closed and cannot be edited.'
      messageType.value = 'error'
      saving.value = false
      return
    }
    
    // Check if report already exists for this publisher/month/year
    const existingReport = existingReports.value.find(r => r.publisherId === report.value.publisherId)
    const publisherName = publishers.value.find(p => p.id === report.value.publisherId)?.name || 'Unknown'
    const reportPayload = {
      ...report.value,
      publisherName,
      month: selectedMonth.value,
      year: selectedYear.value
    }

    if (existingReport) {
      // Update existing
      await updateDoc(doc(db, 'reports', existingReport.id), {
        ...report.value,
        month: selectedMonth.value,
        year: selectedYear.value,
        updatedAt: serverTimestamp(),
        updatedBy: authStore.user.uid
      })
      await logActivity(
        authStore,
        'Report Updated',
        `Updated report for ${publisherName} (${months[selectedMonth.value].name} ${selectedYear.value})`,
        selectedMonth.value,
        selectedYear.value,
        existingReport,
        reportPayload
      )
      message.value = 'Report updated successfully'
    } else {
      // Create new
      await addDoc(collection(db, 'reports'), {
        ...report.value,
        month: selectedMonth.value,
        year: selectedYear.value,
        createdAt: serverTimestamp(),
        createdBy: authStore.user.uid
      })
      await logActivity(
        authStore,
        'Report Created',
        `Created report for ${publisherName} (${months[selectedMonth.value].name} ${selectedYear.value})`,
        selectedMonth.value,
        selectedYear.value,
        null,
        reportPayload
      )
      message.value = 'Report submitted successfully'
    }
    messageType.value = 'success'
    
    // Reset form but keep Month, Year, and Group for convenience
    const preservedGroupId = report.value.groupId
    report.value = {
      groupId: preservedGroupId, // Keep the selected group
      publisherId: '',
      pioneerType: null,
      sharedInMinistry: false,
      auxiliaryPioneer: false,
      hours: 0,
      studies: 0,
      comments: ''
    }
    // Note: selectedMonth and selectedYear are separate refs, so they're automatically preserved
    
    form.value.resetValidation()
    
    // Reload existing reports to update the missing list
    await loadExistingReports()
  } catch (error) {
    console.error('Error submitting report:', error)
    message.value = 'Failed to submit report'
    messageType.value = 'error'
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadGroups()
  loadPublishers()
  loadExistingReports()
})

// Re-load existing reports when month/year changes
watch([selectedMonth, selectedYear], () => {
  loadExistingReports()
})
</script>
