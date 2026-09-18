<template>
  <div>
    <v-row class="align-center mb-2">
      <v-col cols="12">
        <h1 class="text-h4">Emergency Contacts</h1>
      </v-col>
    </v-row>
    
    <!-- Main Table Card -->
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex align-center flex-wrap ga-2 py-3">
            <v-text-field
              v-model="search"
              prepend-inner-icon="mdi-magnify"
              label="Search by Publisher Name, Contact Name, Relationship, Location, Remarks..."
              single-line
              hide-details
              density="compact"
              variant="outlined"
              style="max-width: 480px; min-width: 260px;"
              clearable
            />
            
            <v-spacer />
            
            <!-- Desktop Action Buttons -->
            <div class="d-none d-md-flex align-center ga-2">
              <v-btn 
                v-if="authStore.isAdmin"
                color="primary" 
                @click="openAddDialog"
                prepend-icon="mdi-plus"
              >
                Add Contact
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
                :loading="importing"
              >
                Import
              </v-btn>
              
              <v-btn 
                color="info" 
                variant="tonal"
                @click="exportData"
                prepend-icon="mdi-export"
              >
                Export
              </v-btn>
              
              <v-btn 
                icon 
                variant="tonal"
                @click="showColumnSelector = !showColumnSelector"
                title="Toggle Columns"
              >
                <v-icon>mdi-view-column</v-icon>
              </v-btn>
              
              <v-btn 
                icon 
                variant="tonal"
                @click="printTable"
                title="Print Table"
              >
                <v-icon>mdi-printer</v-icon>
              </v-btn>
            </div>

            <!-- Mobile Actions Menu -->
            <div class="d-flex d-md-none align-center ga-1">
              <v-btn 
                v-if="authStore.isAdmin"
                color="primary"
                size="small"
                icon
                @click="openAddDialog"
              >
                <v-icon>mdi-plus</v-icon>
              </v-btn>

              <v-menu offset-y>
                <template v-slot:activator="{ props }">
                  <v-btn icon v-bind="props" size="small">
                    <v-icon>mdi-dots-vertical</v-icon>
                  </v-btn>
                </template>
                <v-list>
                  <v-list-item v-if="authStore.isAdmin" @click="openAddDialog" prepend-icon="mdi-plus">
                    <v-list-item-title>Add Emergency Contact</v-list-item-title>
                  </v-list-item>
                  <v-list-item v-if="authStore.isAdmin" @click="triggerFileInput" prepend-icon="mdi-import">
                    <v-list-item-title>Import Excel</v-list-item-title>
                  </v-list-item>
                  <v-list-item @click="exportData" prepend-icon="mdi-export">
                    <v-list-item-title>Export Excel</v-list-item-title>
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
          
          <!-- Column Visibility Selector -->
          <v-card-text v-if="showColumnSelector" class="pt-0">
            <div class="mb-2 text-subtitle-2 font-weight-medium">Toggle Column Visibility:</div>
            <v-chip-group multiple column>
              <v-chip
                v-for="col in allColumns"
                :key="col.key"
                :color="isColumnVisible(col.key) ? 'primary' : 'grey'"
                :variant="isColumnVisible(col.key) ? 'flat' : 'outlined'"
                size="small"
                @click="toggleColumn(col.key)"
              >
                <v-icon start size="small" :icon="isColumnVisible(col.key) ? 'mdi-eye' : 'mdi-eye-off'" />
                {{ col.title }}
              </v-chip>
            </v-chip-group>
          </v-card-text>
          
          <!-- Data Table (Click row to edit emergency contact) -->
          <v-data-table
            :headers="visibleHeaders"
            :items="searchedContacts"
            :loading="loading"
            item-value="id"
            hover
            class="elevation-0 clickable-rows"
            @click:row="handleRowClick"
          >
            <template v-slot:item.no="{ index }">
              <span class="text-caption text-medium-emphasis">{{ index + 1 }}</span>
            </template>

            <!-- Publisher Name Link (stops propagation so row click isn't triggered) -->
            <template v-slot:item.publisherName="{ item }">
              <a
                class="text-decoration-none font-weight-medium text-primary cursor-pointer publisher-link"
                @click.stop="goToPublisher(item.publisherName)"
                title="Click to view in Publishers List"
              >
                <v-icon size="small" class="mr-1">mdi-account</v-icon>
                {{ item.publisherName }}
              </a>
            </template>
            
            <template v-slot:item.publisherMobile="{ item }">
              <span v-if="item.publisherMobile" class="text-body-2">
                <v-icon size="x-small" class="mr-1 text-disabled">mdi-phone</v-icon>
                {{ item.publisherMobile }}
              </span>
              <span v-else class="text-caption text-disabled">-</span>
            </template>

            <template v-slot:item.publisherAltMobile="{ item }">
              <span v-if="item.publisherAltMobile" class="text-body-2">
                <v-icon size="x-small" class="mr-1 text-disabled">mdi-phone-outline</v-icon>
                {{ item.publisherAltMobile }}
              </span>
              <span v-else class="text-caption text-disabled">-</span>
            </template>

            <template v-slot:item.emergencyContactMobile="{ item }">
              <span v-if="item.emergencyContactMobile" class="text-body-2 font-weight-medium">
                <v-icon size="x-small" class="mr-1 text-success">mdi-phone</v-icon>
                {{ item.emergencyContactMobile }}
              </span>
              <span v-else class="text-caption text-disabled">-</span>
            </template>

            <template v-slot:item.emergencyContactAltMobile="{ item }">
              <span v-if="item.emergencyContactAltMobile" class="text-body-2">
                <v-icon size="x-small" class="mr-1 text-success">mdi-phone-outline</v-icon>
                {{ item.emergencyContactAltMobile }}
              </span>
              <span v-else class="text-caption text-disabled">-</span>
            </template>

            <template v-slot:item.relationship="{ item }">
              <v-chip v-if="item.relationship" size="x-small" variant="tonal" color="indigo">
                {{ item.relationship }}
              </v-chip>
              <span v-else class="text-caption text-disabled">-</span>
            </template>

            <template v-slot:item.lastVerified="{ item }">
              <span v-if="item.lastVerified" class="text-caption">
                {{ item.lastVerified }}
              </span>
              <span v-else class="text-caption text-disabled">-</span>
            </template>

            <template v-slot:item.remarks="{ item }">
              <span v-if="item.remarks" class="text-body-2">
                {{ item.remarks }}
              </span>
              <span v-else class="text-caption text-disabled">-</span>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>

    <!-- Add / Edit Dialog -->
    <v-dialog v-model="dialog" max-width="700px" persistent scrollable>
      <v-card>
        <v-card-title class="d-flex align-center bg-surface py-3 px-4">
          <v-icon class="mr-2" color="primary">
            {{ editMode ? 'mdi-pencil' : 'mdi-account-plus' }}
          </v-icon>
          <span>{{ editMode ? 'Edit Emergency Contact' : 'Add Emergency Contact' }}</span>
          <v-spacer />
          <v-btn icon="mdi-close" variant="text" size="small" @click="closeDialog" />
        </v-card-title>
        
        <v-divider />
        
        <v-card-text style="max-height: 70vh;" class="pa-4">
          <v-form ref="form" v-model="isFormValid">
            <v-row>
              <!-- Publisher Selector -->
              <v-col cols="12">
                <v-autocomplete
                  v-model="editedItem.publisherId"
                  :items="publisherOptions"
                  item-title="name"
                  item-value="id"
                  label="Select Publisher *"
                  variant="outlined"
                  density="comfortable"
                  :rules="[v => !!v || 'Publisher selection is required']"
                  prepend-inner-icon="mdi-account"
                  clearable
                  @update:model-value="onPublisherSelected"
                >
                  <template v-slot:item="{ props, item }">
                    <v-list-item v-bind="props" :subtitle="item.raw.groupName ? `Group: ${item.raw.groupName}` : ''" />
                  </template>
                </v-autocomplete>
              </v-col>

              <!-- Publisher Details Preview Card -->
              <v-col cols="12" v-if="selectedPublisherInfo">
                <v-card variant="tonal" color="primary" class="pa-3 rounded-lg">
                  <div class="text-caption font-weight-bold mb-1">Synced Publisher Details:</div>
                  <div class="d-flex flex-wrap ga-4 text-body-2">
                    <div><strong>Mobile:</strong> {{ selectedPublisherInfo.mobile || 'None' }}</div>
                    <div><strong>Alt Mobile:</strong> {{ selectedPublisherInfo.alternateMobile || 'None' }}</div>
                    <div><strong>Group:</strong> {{ selectedPublisherInfo.groupName || 'None' }}</div>
                  </div>
                </v-card>
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editedItem.emergencyContactName"
                  label="Emergency Contact Name *"
                  variant="outlined"
                  density="comfortable"
                  :rules="[v => !!v || 'Emergency Contact Name is required']"
                  prepend-inner-icon="mdi-account-alert"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-combobox
                  v-model="editedItem.relationship"
                  :items="relationshipOptions"
                  label="Emergency Contact Relationship"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-account-heart"
                  clearable
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editedItem.emergencyContactMobile"
                  label="Emergency Contact Mobile Number"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-phone"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editedItem.emergencyContactAltMobile"
                  label="Emergency Contact Alternative Mobile"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-phone-outline"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editedItem.location"
                  label="Emergency Contact Location"
                  placeholder="City, Village, or Address"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-map-marker"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editedItem.lastVerified"
                  label="Last Verified Date"
                  type="date"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-calendar-check"
                />
              </v-col>

              <v-col cols="12">
                <v-textarea
                  v-model="editedItem.remarks"
                  label="Remarks"
                  variant="outlined"
                  density="comfortable"
                  rows="2"
                  prepend-inner-icon="mdi-note-text"
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        
        <v-divider />

        <v-card-actions class="pa-3">
          <v-btn
            v-if="editMode && editedItem.docId"
            color="error"
            variant="text"
            prepend-icon="mdi-delete"
            @click="deleteContact(editedItem)"
          >
            Delete
          </v-btn>
          <v-spacer />
          <v-btn variant="outlined" @click="closeDialog">Cancel</v-btn>
          <v-btn
            color="primary"
            variant="flat"
            :loading="saving"
            @click="saveContact"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
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
import { exportToExcel, importFromExcel } from '@/utils/excel'
import { logActivity } from '@/utils/logging'

const authStore = useAuthStore()
const router = useRouter()

const emergencyContacts = ref([])
const publishers = ref([])
const groups = ref([])

const loading = ref(false)
const saving = ref(false)
const importing = ref(false)

const search = ref('')
const showColumnSelector = ref(false)

const dialog = ref(false)
const editMode = ref(false)
const isFormValid = ref(false)
const form = ref(null)
const fileInput = ref(null)

const defaultItem = {
  id: null,
  docId: null,
  publisherId: '',
  emergencyContactName: '',
  emergencyContactMobile: '',
  emergencyContactAltMobile: '',
  relationship: '',
  location: '',
  lastVerified: new Date().toISOString().split('T')[0],
  remarks: ''
}

const editedItem = ref({ ...defaultItem })
const selectedPublisherInfo = ref(null)

const relationshipOptions = [
  'Spouse',
  'Father',
  'Mother',
  'Son',
  'Daughter',
  'Brother',
  'Sister',
  'Child',
  'Parent',
  'Relative',
  'Friend',
  'Neighbor',
  'Guardian',
  'Other'
]

const allColumns = [
  { key: 'no', title: "No's" },
  { key: 'publisherName', title: 'Publisher Name' },
  { key: 'publisherMobile', title: 'Publisher Mobile' },
  { key: 'publisherAltMobile', title: 'Alternative Mobile Number' },
  { key: 'groupName', title: 'Group' },
  { key: 'emergencyContactName', title: 'Emergency Contact Name' },
  { key: 'emergencyContactMobile', title: 'Emergency Contact Mobile Number' },
  { key: 'emergencyContactAltMobile', title: 'Emergency Contact Alternative Mobile Number' },
  { key: 'relationship', title: 'Emergency Contact Relationship' },
  { key: 'location', title: 'Emergency Contact Location' },
  { key: 'lastVerified', title: 'Last Verified' },
  { key: 'remarks', title: 'Remarks' }
]

const visibleColumns = ref([
  'no',
  'publisherName',
  'publisherMobile',
  'publisherAltMobile',
  'groupName',
  'emergencyContactName',
  'emergencyContactMobile',
  'emergencyContactAltMobile',
  'relationship',
  'location',
  'lastVerified',
  'remarks'
])

const visibleHeaders = computed(() => {
  return allColumns
    .filter(col => visibleColumns.value.includes(col.key))
    .map(col => ({
      ...col,
      value: col.key,
      sortable: col.key !== 'no'
    }))
})

const isColumnVisible = (key) => visibleColumns.value.includes(key)

const toggleColumn = (key) => {
  const index = visibleColumns.value.indexOf(key)
  if (index > -1) {
    visibleColumns.value.splice(index, 1)
  } else {
    visibleColumns.value.push(key)
  }
}

const publisherOptions = computed(() => {
  return publishers.value.map(p => {
    const grp = groups.value.find(g => g.id === p.groupId)
    return {
      id: p.id,
      name: p.name,
      groupName: grp ? grp.name : '',
      mobile: p.mobile || '',
      alternateMobile: p.alternateMobile || ''
    }
  }).sort((a, b) => a.name.localeCompare(b.name))
})

// Load publishers, groups, and emergency contacts from Firestore
const loadData = async () => {
  loading.value = true
  try {
    try {
      const publishersSnap = await getDocs(collection(db, 'publishers'))
      publishers.value = publishersSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
    } catch (err) {
      console.error('Error fetching publishers:', err)
    }

    try {
      const groupsSnap = await getDocs(collection(db, 'groups'))
      groups.value = groupsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
    } catch (err) {
      console.error('Error fetching groups:', err)
    }

    try {
      const contactsSnap = await getDocs(collection(db, 'emergencyContacts'))
      emergencyContacts.value = contactsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
    } catch (err) {
      console.error('Error fetching emergency contacts:', err)
      emergencyContacts.value = []
    }
  } catch (error) {
    console.error('Error loading emergency contacts data:', error)
  } finally {
    loading.value = false
  }
}

// Automatically include ALL publishers from Publishers List with live synced details
const enrichedContacts = computed(() => {
  const sortedPublishers = [...publishers.value].sort((a, b) => (a.name || '').localeCompare(b.name || ''))

  let list = sortedPublishers.map(pub => {
    const contact = emergencyContacts.value.find(c => c.publisherId === pub.id)
    const grp = groups.value.find(g => g.id === pub.groupId)

    if (contact) {
      return {
        id: contact.id,
        docId: contact.id,
        publisherId: pub.id,
        publisherName: pub.name || 'Unknown Publisher',
        publisherMobile: pub.mobile || '',
        publisherAltMobile: pub.alternateMobile || '',
        groupId: pub.groupId || '',
        groupName: grp ? grp.name : 'No Group',
        emergencyContactName: contact.emergencyContactName || '',
        emergencyContactMobile: contact.emergencyContactMobile || '',
        emergencyContactAltMobile: contact.emergencyContactAltMobile || '',
        relationship: contact.relationship || '',
        location: contact.location || '',
        lastVerified: contact.lastVerified || '',
        remarks: contact.remarks || ''
      }
    } else {
      // Virtual row for publisher with no emergency contact document yet
      return {
        id: 'pub_' + pub.id,
        docId: null,
        publisherId: pub.id,
        publisherName: pub.name || 'Unknown Publisher',
        publisherMobile: pub.mobile || '',
        publisherAltMobile: pub.alternateMobile || '',
        groupId: pub.groupId || '',
        groupName: grp ? grp.name : 'No Group',
        emergencyContactName: '',
        emergencyContactMobile: '',
        emergencyContactAltMobile: '',
        relationship: '',
        location: '',
        lastVerified: '',
        remarks: ''
      }
    }
  })

  // Filter based on user RBAC group restriction if applicable
  if (authStore.isEditor && !authStore.isAdmin) {
    list = list.filter(item => authStore.userGroupId && item.groupId === authStore.userGroupId)
  }

  return list
})

// Search across Publisher Name, Emergency Contact Name, Relationship, Location, and Remarks
const searchedContacts = computed(() => {
  let list = enrichedContacts.value

  if (search.value && search.value.trim() !== '') {
    const q = search.value.trim().toLowerCase()
    list = list.filter(item => {
      const pubName = (item.publisherName || '').toLowerCase()
      const contactName = (item.emergencyContactName || '').toLowerCase()
      const rel = (item.relationship || '').toLowerCase()
      const loc = (item.location || '').toLowerCase()
      const rem = (item.remarks || '').toLowerCase()

      return pubName.includes(q) || 
             contactName.includes(q) || 
             rel.includes(q) || 
             loc.includes(q) || 
             rem.includes(q)
    })
  }

  return list
})

const handleRowClick = (event, { item }) => {
  openEditDialog(item)
}

const goToPublisher = (publisherName) => {
  router.push({
    path: '/congregation/publishers',
    query: { search: publisherName }
  })
}

const onPublisherSelected = (pubId) => {
  const pub = publisherOptions.value.find(p => p.id === pubId)
  if (pub) {
    selectedPublisherInfo.value = pub
  } else {
    selectedPublisherInfo.value = null
  }
}

const openAddDialog = () => {
  if (!authStore.isAdmin) return
  editMode.value = false
  editedItem.value = { 
    ...defaultItem,
    lastVerified: new Date().toISOString().split('T')[0]
  }
  selectedPublisherInfo.value = null
  dialog.value = true
}

const openEditDialog = (item) => {
  editMode.value = true
  editedItem.value = { 
    ...item,
    lastVerified: item.lastVerified || new Date().toISOString().split('T')[0]
  }
  onPublisherSelected(item.publisherId)
  dialog.value = true
}

const closeDialog = () => {
  dialog.value = false
  editedItem.value = { ...defaultItem }
  selectedPublisherInfo.value = null
}

const saveContact = async () => {
  if (form.value) {
    const { valid } = await form.value.validate()
    if (!valid) return
  }

  saving.value = true
  try {
    const payload = {
      publisherId: editedItem.value.publisherId,
      emergencyContactName: editedItem.value.emergencyContactName || '',
      emergencyContactMobile: editedItem.value.emergencyContactMobile || '',
      emergencyContactAltMobile: editedItem.value.emergencyContactAltMobile || '',
      relationship: editedItem.value.relationship || '',
      location: editedItem.value.location || '',
      lastVerified: editedItem.value.lastVerified || '',
      remarks: editedItem.value.remarks || '',
      updatedAt: serverTimestamp()
    }

    // Check if docId exists or if an emergency contact doc already exists for this publisher
    const existingDoc = emergencyContacts.value.find(c => c.publisherId === editedItem.value.publisherId)
    const targetDocId = editedItem.value.docId || (existingDoc ? existingDoc.id : null)

    if (targetDocId) {
      await updateDoc(doc(db, 'emergencyContacts', targetDocId), payload)
      await logActivity(
        authStore,
        'Emergency Contact Updated',
        `Updated contact for publisher ${selectedPublisherInfo.value?.name || payload.publisherId}`,
        null,
        null,
        existingDoc || editedItem.value,
        payload
      )
    } else {
      payload.createdAt = serverTimestamp()
      await addDoc(collection(db, 'emergencyContacts'), payload)
      await logActivity(
        authStore,
        'Emergency Contact Created',
        `Created emergency contact for publisher ${selectedPublisherInfo.value?.name || payload.publisherId}`,
        null,
        null,
        null,
        payload
      )
    }

    await loadData()
    closeDialog()
  } catch (error) {
    console.error('Error saving emergency contact:', error)
    alert('Failed to save emergency contact: ' + error.message)
  } finally {
    saving.value = false
  }
}

const deleteContact = async (item) => {
  if (!item.docId) return
  if (confirm(`Are you sure you want to delete emergency contact details for "${item.publisherName || item.emergencyContactName}"?`)) {
    try {
      loading.value = true
      await deleteDoc(doc(db, 'emergencyContacts', item.docId))
      await logActivity(
        authStore,
        'Emergency Contact Deleted',
        `Deleted emergency contact for ${item.publisherName}`,
        null,
        null,
        item,
        null
      )
      await loadData()
      if (dialog.value) closeDialog()
    } catch (error) {
      console.error('Error deleting emergency contact:', error)
      alert('Failed to delete emergency contact: ' + error.message)
    } finally {
      loading.value = false
    }
  }
}

// Export to Excel
const exportData = () => {
  const excelColumns = [
    { title: "No's", key: 'no' },
    { title: 'Publisher Name', key: 'publisherName' },
    { title: 'Publisher Mobile', key: 'publisherMobile' },
    { title: 'Alternative Mobile Number', key: 'publisherAltMobile' },
    { title: 'Group', key: 'groupName' },
    { title: 'Emergency Contact Name', key: 'emergencyContactName' },
    { title: 'Emergency Contact Mobile Number', key: 'emergencyContactMobile' },
    { title: 'Emergency Contact Alternative Mobile Number', key: 'emergencyContactAltMobile' },
    { title: 'Emergency Contact Relationship', key: 'relationship' },
    { title: 'Emergency Contact Location', key: 'location' },
    { title: 'Last Verified', key: 'lastVerified' },
    { title: 'Remarks', key: 'remarks' }
  ]

  const dataToExport = searchedContacts.value.map((item, index) => ({
    no: index + 1,
    publisherName: item.publisherName,
    publisherMobile: item.publisherMobile,
    publisherAltMobile: item.publisherAltMobile,
    groupName: item.groupName,
    emergencyContactName: item.emergencyContactName,
    emergencyContactMobile: item.emergencyContactMobile,
    emergencyContactAltMobile: item.emergencyContactAltMobile,
    relationship: item.relationship,
    location: item.location,
    lastVerified: item.lastVerified,
    remarks: item.remarks
  }))

  exportToExcel(dataToExport, excelColumns, 'Emergency_Contacts_List')
}

const triggerFileInput = () => {
  if (!authStore.isAdmin) return
  if (fileInput.value) fileInput.value.click()
}

// Import from Excel
const handleFileUpload = async (event) => {
  if (!authStore.isAdmin) return
  const file = event.target.files[0]
  if (!file) return

  importing.value = true
  try {
    const excelColumns = [
      { title: 'Publisher Name', key: 'publisherName' },
      { title: 'Emergency Contact Name', key: 'emergencyContactName' },
      { title: 'Emergency Contact Mobile Number', key: 'emergencyContactMobile' },
      { title: 'Emergency Contact Alternative Mobile Number', key: 'emergencyContactAltMobile' },
      { title: 'Emergency Contact Relationship', key: 'relationship' },
      { title: 'Emergency Contact Location', key: 'location' },
      { title: 'Last Verified', key: 'lastVerified' },
      { title: 'Remarks', key: 'remarks' }
    ]

    const parsedRows = await importFromExcel(file, excelColumns)

    let createdCount = 0
    let updatedCount = 0

    for (const row of parsedRows) {
      if (!row.publisherName) continue

      const pubName = row.publisherName.toString().trim()
      const publisher = publishers.value.find(p => p.name.toLowerCase() === pubName.toLowerCase())

      if (!publisher) continue // Skip if publisher not found

      const contactData = {
        publisherId: publisher.id,
        emergencyContactName: row.emergencyContactName ? row.emergencyContactName.toString().trim() : '',
        emergencyContactMobile: row.emergencyContactMobile ? row.emergencyContactMobile.toString().trim() : '',
        emergencyContactAltMobile: row.emergencyContactAltMobile ? row.emergencyContactAltMobile.toString().trim() : '',
        relationship: row.relationship ? row.relationship.toString().trim() : '',
        location: row.location ? row.location.toString().trim() : '',
        lastVerified: row.lastVerified ? row.lastVerified.toString().trim() : new Date().toISOString().split('T')[0],
        remarks: row.remarks ? row.remarks.toString().trim() : '',
        updatedAt: serverTimestamp()
      }

      // Check if existing emergency contact doc exists for this publisher
      const existing = emergencyContacts.value.find(c => c.publisherId === publisher.id)

      if (existing) {
        await updateDoc(doc(db, 'emergencyContacts', existing.id), contactData)
        updatedCount++
      } else {
        contactData.createdAt = serverTimestamp()
        await addDoc(collection(db, 'emergencyContacts'), contactData)
        createdCount++
      }
    }

    alert(`Import Complete! Created: ${createdCount}, Updated: ${updatedCount}`)
    await logActivity(authStore, 'Emergency Contacts Imported', `Imported ${createdCount} new, ${updatedCount} updated emergency contacts`)
    await loadData()
  } catch (error) {
    console.error('Error importing emergency contacts:', error)
    alert('Import failed: ' + error.message)
  } finally {
    importing.value = false
    if (fileInput.value) fileInput.value.value = ''
  }
}

const printTable = () => {
  window.print()
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.publisher-link {
  color: rgb(var(--v-theme-primary)) !important;
  transition: opacity 0.2s ease;
}

.publisher-link:hover {
  text-decoration: underline !important;
  opacity: 0.85;
}

.clickable-rows :deep(tbody tr) {
  cursor: pointer;
}

@media print {
  .v-btn, .v-text-field, .v-select, .v-chip-group {
    display: none !important;
  }
}
</style>
