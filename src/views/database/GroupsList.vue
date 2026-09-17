<template>
  <div>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-4">Groups List</h1>
      </v-col>
    </v-row>
    
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
              :disabled="isEditMode"
            />
            
            <v-spacer />
            
            <!-- Desktop Actions -->
            <div class="d-none d-md-flex align-center">
              <!-- Edit Order Buttons (Admin only) -->
              <template v-if="authStore.isAdmin">
                <template v-if="!isEditMode">
                  <v-btn 
                    color="primary" 
                    variant="flat"
                    @click="startEditMode"
                    prepend-icon="mdi-pencil"
                    class="mr-2"
                  >
                    Edit Order
                  </v-btn>
                </template>
                <template v-else>
                  <v-btn 
                    color="success" 
                    variant="flat"
                    :loading="savingOrder"
                    @click="saveOrder"
                    prepend-icon="mdi-content-save"
                    class="mr-2"
                  >
                    Save Order
                  </v-btn>
                  <v-btn 
                    color="grey" 
                    variant="tonal"
                    @click="cancelEditMode"
                    class="mr-2"
                  >
                    Cancel
                  </v-btn>
                </template>
              </template>

              <v-btn 
                v-if="authStore.isAdmin && !isEditMode"
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
                title="Toggle Columns"
              >
                <v-icon>mdi-view-column</v-icon>
              </v-btn>
              
              <v-btn 
                icon 
                @click="printTable"
                title="Print Table"
              >
                <v-icon>mdi-printer</v-icon>
              </v-btn>
            </div>

            <!-- Mobile Actions Menu -->
            <div class="d-flex d-md-none align-center">
              <template v-if="authStore.isAdmin && isEditMode">
                <v-btn 
                  color="success" 
                  variant="flat"
                  size="small"
                  :loading="savingOrder"
                  @click="saveOrder"
                  class="mr-1"
                >
                  Save
                </v-btn>
                <v-btn 
                  color="grey" 
                  variant="tonal"
                  size="small"
                  @click="cancelEditMode"
                  class="mr-1"
                >
                  Cancel
                </v-btn>
              </template>

              <v-menu offset-y>
                <template v-slot:activator="{ props }">
                  <v-btn icon v-bind="props" size="small">
                    <v-icon>mdi-dots-vertical</v-icon>
                  </v-btn>
                </template>
                <v-list>
                  <v-list-item v-if="authStore.isAdmin && !isEditMode" @click="startEditMode" prepend-icon="mdi-pencil">
                    <v-list-item-title>Edit Order</v-list-item-title>
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

          <!-- Edit Mode Instructions Banner -->
          <v-alert
            v-if="isEditMode"
            type="info"
            variant="tonal"
            density="compact"
            class="ma-4 mb-2 d-print-none"
            icon="mdi-cursor-move"
          >
            <div class="d-flex align-center justify-space-between flex-wrap ga-2">
              <div>
                <strong>Reorder Mode:</strong> Click and drag table cells up or down to reorder within each column.
                You can also click the up/down arrows. Group Overseer and Assistant are fixed.
              </div>
              <div class="d-flex ga-2">
                <v-btn size="small" color="success" variant="flat" :loading="savingOrder" @click="saveOrder">
                  Save Changes
                </v-btn>
                <v-btn size="small" color="grey" variant="tonal" @click="cancelEditMode">
                  Cancel
                </v-btn>
              </div>
            </div>
          </v-alert>
          
          <v-card-text v-if="showColumnSelector">
            <div class="mb-2 text-subtitle-2">Click to toggle column visibility:</div>
            <v-chip-group multiple column>
              <v-chip
                v-for="group in groups"
                :key="group.id"
                :color="isColumnVisible(group.id) ? 'primary' : 'grey'"
                :variant="isColumnVisible(group.id) ? 'flat' : 'outlined'"
                @click="toggleColumn(group.id)"
              >
                <v-icon start :icon="isColumnVisible(group.id) ? 'mdi-eye' : 'mdi-eye-off'" />
                {{ group.name }}
              </v-chip>
            </v-chip-group>
          </v-card-text>
          
          <v-card-text>
            <div class="groups-table-container">
              <table class="groups-table">
                <!-- Header Row: Group Names -->
                <thead>
                  <tr>
                    <th class="row-label">No's</th>
                    <th 
                      v-for="group in visibleGroups" 
                      :key="group.id"
                      class="group-header"
                    >
                      {{ group.name }}
                    </th>
                  </tr>
                </thead>
                
                <tbody>
                  <!-- Row 2: Overseer -->
                  <tr class="role-row">
                    <td class="row-label"><strong>Overseer</strong></td>
                    <td 
                      v-for="group in visibleGroups" 
                      :key="`overseer-${group.id}`"
                      class="role-cell"
                    >
                      <strong>{{ getOverseer(group.id) }}</strong>
                    </td>
                  </tr>
                  
                  <!-- Row 3: Assistant -->
                  <tr class="role-row">
                    <td class="row-label"><strong>Assistant</strong></td>
                    <td 
                      v-for="group in visibleGroups" 
                      :key="`assistant-${group.id}`"
                      class="role-cell"
                    >
                      {{ getAssistant(group.id) }}
                    </td>
                  </tr>
                  
                  <!-- Member Rows -->
                  <tr 
                    v-for="(row, index) in maxMembers" 
                    :key="`member-${index}`"
                    class="member-row"
                  >
                    <td class="row-label">{{ index + 3 }}</td>
                    <td 
                      v-for="group in visibleGroups" 
                      :key="`member-${group.id}-${index}`"
                      class="member-cell"
                      :class="{
                        'is-draggable': isEditMode && !!getMemberObj(group.id, index),
                        'is-dragging': isDraggingCell(group.id, index),
                        'is-drag-over': isDragOverCell(group.id, index),
                        'is-empty-slot': isEditMode && !getMemberObj(group.id, index) && index === (groupMembersMap[group.id]?.length || 0)
                      }"
                      :draggable="isEditMode && !!getMemberObj(group.id, index)"
                      @dragstart="onDragStart($event, group.id, index)"
                      @dragover.prevent="onDragOver($event, group.id, index)"
                      @dragenter.prevent="onDragEnter($event, group.id, index)"
                      @dragleave="onDragLeave($event, group.id, index)"
                      @drop="onDrop($event, group.id, index)"
                      @dragend="onDragEnd"
                    >
                      <template v-if="getMemberObj(group.id, index)">
                        <div v-if="!isEditMode" class="member-name-text">
                          {{ formatMemberName(getMemberObj(group.id, index)) }}
                        </div>
                        <div v-else class="d-flex align-center justify-space-between w-100 member-cell-edit-wrap">
                          <div class="d-flex align-center text-truncate flex-grow-1 mr-1">
                            <v-icon size="16" color="primary" class="mr-1 cursor-grab d-print-none">mdi-drag-vertical</v-icon>
                            <span class="text-truncate font-weight-medium">{{ formatMemberName(getMemberObj(group.id, index)) }}</span>
                          </div>
                          <div class="d-flex align-center ga-1 move-buttons d-print-none">
                            <v-btn
                              icon="mdi-chevron-up"
                              size="20"
                              variant="text"
                              density="compact"
                              :disabled="index === 0"
                              @click.stop="moveItem(group.id, index, -1)"
                              title="Move Up"
                            />
                            <v-btn
                              icon="mdi-chevron-down"
                              size="20"
                              variant="text"
                              density="compact"
                              :disabled="index >= (groupMembersMap[group.id]?.length || 1) - 1"
                              @click.stop="moveItem(group.id, index, 1)"
                              title="Move Down"
                            />
                          </div>
                        </div>
                      </template>
                      <template v-else-if="isEditMode && index === (groupMembersMap[group.id]?.length || 0)">
                        <div class="empty-drop-hint text-caption text-grey text-center py-1">
                          Drop here
                        </div>
                      </template>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Snackbar for feedback -->
    <v-snackbar v-model="snackbar" :color="snackbarColor" timeout="3500" location="bottom end">
      {{ snackbarText }}
      <template v-slot:actions>
        <v-btn variant="text" size="small" @click="snackbar = false">Close</v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { collection, getDocs, updateDoc, doc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/config/firebase'
import { useAuthStore } from '@/stores/auth'
import * as XLSX from 'xlsx'

const authStore = useAuthStore()

const groups = ref([])
const publishers = ref([])
const loading = ref(false)
const search = ref('')
const showColumnSelector = ref(false)
const visibleGroupIds = ref([])

// Custom ordering & Edit mode state
const isEditMode = ref(false)
const savingOrder = ref(false)
const groupMembersMap = ref({})
const savedGroupMembersSnapshot = ref({})

// Drag & Drop tracking
const draggingState = ref({
  groupId: null,
  index: null
})
const dragOverState = ref({
  groupId: null,
  index: null
})

// Feedback snackbar
const snackbar = ref(false)
const snackbarColor = ref('success')
const snackbarText = ref('')

// Age category order for fallback within family
const ageCategoryOrder = {
  'teenager': 1,
  'youngster': 2,
  'adult': 3,
  'aged': 4,
  'child': 5
}

// Helper: Sort regular members by family:
// 1. Group members having the same family name together.
//    If publisher has no family assigned, fall back to publisher's own name.
// 2. Within the same family, sort Male first, then Female, then by age/name.
const sortMembersByFamily = (publishersList) => {
  return [...publishersList].sort((a, b) => {
    const famA = (a.family || a.name || '').trim().toLowerCase()
    const famB = (b.family || b.name || '').trim().toLowerCase()
    
    if (famA !== famB) {
      return famA.localeCompare(famB)
    }
    
    // Within same family: Males first (0), then Females (1)
    const genderA = a.gender === 'Male' ? 0 : 1
    const genderB = b.gender === 'Male' ? 0 : 1
    if (genderA !== genderB) {
      return genderA - genderB
    }
    
    // Then age category
    const ageOrderA = ageCategoryOrder[a.ageCategory] || 999
    const ageOrderB = ageCategoryOrder[b.ageCategory] || 999
    if (ageOrderA !== ageOrderB) {
      return ageOrderA - ageOrderB
    }
    
    // Finally by name
    return (a.name || '').localeCompare(b.name || '')
  })
}

// Initialize group members mapping with custom order or default family sort
const initializeGroupMembers = () => {
  const map = {}
  groups.value.forEach(group => {
    const overseerName = group?.overseer
    const assistantName = group?.assistant
    
    // All publishers belonging to this group
    const groupPubs = publishers.value.filter(p => p.groupId === group.id)
    
    // Filter out overseer and assistant
    const regularPubs = groupPubs.filter(p => p.name !== overseerName && p.name !== assistantName)
    
    // If group has saved memberOrder (array of publisher IDs), use that order
    if (group.memberOrder && Array.isArray(group.memberOrder) && group.memberOrder.length > 0) {
      const ordered = []
      const remaining = [...regularPubs]
      
      // Place members according to saved order
      group.memberOrder.forEach(id => {
        const idx = remaining.findIndex(p => p.id === id)
        if (idx !== -1) {
          ordered.push(remaining.splice(idx, 1)[0])
        }
      })
      
      // If any new members were assigned to group since last save, sort them by family and append
      if (remaining.length > 0) {
        ordered.push(...sortMembersByFamily(remaining))
      }
      map[group.id] = ordered
    } else {
      // Default: Sort by family
      map[group.id] = sortMembersByFamily(regularPubs)
    }
  })
  groupMembersMap.value = map
  savedGroupMembersSnapshot.value = JSON.parse(JSON.stringify(map))
}

// Load groups and publishers
const loadData = async () => {
  loading.value = true
  try {
    // Load groups
    const groupsSnapshot = await getDocs(collection(db, 'groups'))
    groups.value = groupsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })).sort((a, b) => a.name.localeCompare(b.name))
    
    // Initialize all groups as visible
    if (visibleGroupIds.value.length === 0) {
      visibleGroupIds.value = groups.value.map(g => g.id)
    }
    
    // Load publishers
    const publishersSnapshot = await getDocs(collection(db, 'publishers'))
    publishers.value = publishersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    initializeGroupMembers()
  } catch (error) {
    console.error('Error loading data:', error)
  } finally {
    loading.value = false
  }
}

// Get visible groups
const visibleGroups = computed(() => {
  return groups.value.filter(g => visibleGroupIds.value.includes(g.id))
})

// Filter members by search query if active
const getFilteredMembers = (groupId) => {
  const members = groupMembersMap.value[groupId] || []
  if (!search.value || isEditMode.value) return members
  const q = search.value.toLowerCase().trim()
  return members.filter(p => {
    const nameMatch = (p.name || '').toLowerCase().includes(q)
    const famMatch = (p.family || '').toLowerCase().includes(q)
    return nameMatch || famMatch
  })
}

// Get member object at specific index
const getMemberObj = (groupId, index) => {
  const members = getFilteredMembers(groupId)
  return members[index] || null
}

// Get member formatted name at specific index
const getMember = (groupId, index) => {
  const member = getMemberObj(groupId, index)
  if (!member) return ''
  return formatMemberName(member)
}

// Get overseer for group (from Groups collection data)
const getOverseer = (groupId) => {
  const group = groups.value.find(g => g.id === groupId)
  if (!group?.overseer) return '-'
  
  const overseerPub = publishers.value.find(p => p.name === group.overseer)
  if (overseerPub) {
    return formatMemberName(overseerPub)
  }
  return group.overseer
}

// Get assistant for group (from Groups collection data)
const getAssistant = (groupId) => {
  const group = groups.value.find(g => g.id === groupId)
  if (!group?.assistant) return '-'
  
  const assistantPub = publishers.value.find(p => p.name === group.assistant)
  if (assistantPub) {
    return formatMemberName(assistantPub)
  }
  return group.assistant
}

// Format member name with role/pioneer type abbreviation
const formatMemberName = (member) => {
  if (!member) return ''
  let name = member.name
  let roleAbbr = ''
  
  if (member.role === 'Elder') {
    roleAbbr = 'Elder'
  } else if (member.role === 'Ministerial Servant') {
    roleAbbr = 'MS'
  } else if (member.role === 'Un-Baptized Publisher') {
    roleAbbr = 'UBP'
  } else if (member.pioneerType === 'RP') {
    roleAbbr = 'RP'
  } else if (member.pioneerType === 'SP') {
    roleAbbr = 'SP'
  } else if (member.pioneerType === 'TSP') {
    roleAbbr = 'TSP'
  }
  
  return roleAbbr ? `${name} (${roleAbbr})` : name
}

// Calculate max members across all visible groups
const maxMembers = computed(() => {
  let max = 0
  visibleGroups.value.forEach(group => {
    const members = getFilteredMembers(group.id)
    if (members.length > max) max = members.length
  })
  // In edit mode, add an extra row for empty drop target if needed
  return max
})

// --- EDIT MODE & DRAG-TO-SORT ACTIONS ---
const startEditMode = () => {
  search.value = '' // clear search so full group lists are editable
  savedGroupMembersSnapshot.value = JSON.parse(JSON.stringify(groupMembersMap.value))
  isEditMode.value = true
}

const cancelEditMode = () => {
  groupMembersMap.value = JSON.parse(JSON.stringify(savedGroupMembersSnapshot.value))
  isEditMode.value = false
  draggingState.value = { groupId: null, index: null }
  dragOverState.value = { groupId: null, index: null }
}

const moveItem = (groupId, fromIdx, direction) => {
  const list = [...(groupMembersMap.value[groupId] || [])]
  const targetIdx = fromIdx + direction
  if (targetIdx < 0 || targetIdx >= list.length) return
  const [item] = list.splice(fromIdx, 1)
  list.splice(targetIdx, 0, item)
  groupMembersMap.value[groupId] = list
}

// Drag & Drop Handlers
const onDragStart = (event, groupId, index) => {
  if (!isEditMode.value) return
  draggingState.value = { groupId, index }
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('text/plain', JSON.stringify({ groupId, index }))
}

const onDragOver = (event, groupId, index) => {
  if (!isEditMode.value) return
  if (draggingState.value.groupId !== groupId) {
    event.dataTransfer.dropEffect = 'none'
    return
  }
  event.dataTransfer.dropEffect = 'move'
  dragOverState.value = { groupId, index }
}

const onDragEnter = (event, groupId, index) => {
  if (!isEditMode.value) return
  if (draggingState.value.groupId === groupId) {
    dragOverState.value = { groupId, index }
  }
}

const onDragLeave = (event, groupId, index) => {
  if (dragOverState.value.groupId === groupId && dragOverState.value.index === index) {
    dragOverState.value = { groupId: null, index: null }
  }
}

const onDrop = (event, groupId, targetIndex) => {
  if (!isEditMode.value) return
  if (draggingState.value.groupId === groupId && draggingState.value.index !== null) {
    const fromIndex = draggingState.value.index
    if (fromIndex !== targetIndex) {
      const list = [...(groupMembersMap.value[groupId] || [])]
      const [movedItem] = list.splice(fromIndex, 1)
      const adjustedTarget = targetIndex > fromIndex ? targetIndex : targetIndex
      list.splice(adjustedTarget, 0, movedItem)
      groupMembersMap.value[groupId] = list
    }
  }
  draggingState.value = { groupId: null, index: null }
  dragOverState.value = { groupId: null, index: null }
}

const onDragEnd = () => {
  draggingState.value = { groupId: null, index: null }
  dragOverState.value = { groupId: null, index: null }
}

const isDraggingCell = (groupId, index) => {
  return draggingState.value.groupId === groupId && draggingState.value.index === index
}

const isDragOverCell = (groupId, index) => {
  return dragOverState.value.groupId === groupId && dragOverState.value.index === index
}

// Save Order to Firestore
const saveOrder = async () => {
  savingOrder.value = true
  try {
    for (const group of groups.value) {
      const currentList = groupMembersMap.value[group.id] || []
      const orderIds = currentList.map(p => p.id)
      
      await updateDoc(doc(db, 'groups', group.id), {
        memberOrder: orderIds,
        updatedAt: serverTimestamp()
      })
      group.memberOrder = orderIds
    }

    savedGroupMembersSnapshot.value = JSON.parse(JSON.stringify(groupMembersMap.value))
    isEditMode.value = false
    snackbarText.value = 'Groups member order saved successfully!'
    snackbarColor.value = 'success'
    snackbar.value = true
  } catch (err) {
    console.error('Error saving group member order:', err)
    snackbarText.value = 'Failed to save group order: ' + err.message
    snackbarColor.value = 'error'
    snackbar.value = true
  } finally {
    savingOrder.value = false
  }
}

// Column visibility
const isColumnVisible = (groupId) => visibleGroupIds.value.includes(groupId)

const toggleColumn = (groupId) => {
  const index = visibleGroupIds.value.indexOf(groupId)
  if (index > -1) {
    visibleGroupIds.value.splice(index, 1)
  } else {
    visibleGroupIds.value.push(groupId)
  }
}

const printTable = () => {
  window.print()
}

const exportData = () => {
  const sortedGroups = [...groups.value].sort((a, b) => a.name.localeCompare(b.name))
  const rows = []
  
  // Row 1: Header — No's + Group Names
  rows.push(["No's", ...sortedGroups.map(g => g.name)])
  
  // Row 2: Overseer
  rows.push(['Overseer', ...sortedGroups.map(g => getOverseer(g.id))])
  
  // Row 3: Assistant
  rows.push(['Assistant', ...sortedGroups.map(g => getAssistant(g.id))])
  
  // Member rows
  let maxMemberCount = 0
  sortedGroups.forEach(g => {
    const count = (groupMembersMap.value[g.id] || []).length
    if (count > maxMemberCount) maxMemberCount = count
  })
  
  for (let i = 0; i < maxMemberCount; i++) {
    const row = [i + 3]
    sortedGroups.forEach(g => {
      row.push(getMember(g.id, i))
    })
    rows.push(row)
  }
  
  const worksheet = XLSX.utils.aoa_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Groups List')
  
  const colWidths = rows[0].map((_, colIdx) => {
    let maxLen = 10
    rows.forEach(row => {
      const val = String(row[colIdx] || '')
      if (val.length > maxLen) maxLen = val.length
    })
    return { wch: maxLen + 2 }
  })
  worksheet['!cols'] = colWidths
  
  XLSX.writeFile(workbook, 'Groups_List.xlsx')
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.groups-table-container {
  overflow-x: auto;
}

.groups-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 600px;
}

.groups-table th,
.groups-table td {
  border: 1px solid rgba(var(--v-border-color), 0.2);
  padding: 10px 12px;
  text-align: left;
}

.groups-table thead th {
  font-weight: bold;
  position: sticky;
  top: 0;
  z-index: 10;
  background: rgb(var(--v-theme-surface));
}

.row-label {
  font-weight: 600;
  min-width: 110px;
  position: sticky;
  left: 0;
  z-index: 5;
  background: rgb(var(--v-theme-surface));
}

.group-header {
  font-weight: bold;
  text-align: center;
  min-width: 170px;
}

.role-cell {
  font-weight: 500;
}

/* Member cells */
.member-cell {
  min-height: 42px;
  transition: border-color 0.15s ease, background-color 0.15s ease;
}

/* In edit mode, draggable cells */
.member-cell.is-draggable {
  cursor: grab;
  user-select: none;
}

.member-cell.is-draggable:active {
  cursor: grabbing;
}

/* Highlight border and background when dragging clicked cell */
.member-cell.is-dragging {
  border: 2px solid #1976d2 !important;
  background-color: rgba(25, 118, 210, 0.1) !important;
  box-shadow: inset 0 0 0 1px #1976d2, 0 4px 12px rgba(25, 118, 210, 0.25) !important;
  opacity: 0.92;
}

/* Highlight border when dragging over target cell */
.member-cell.is-drag-over {
  border: 2px dashed #1976d2 !important;
  background-color: rgba(25, 118, 210, 0.18) !important;
}

.member-cell.is-empty-slot {
  border: 1px dashed rgba(var(--v-border-color), 0.4);
}

.member-cell-edit-wrap {
  min-height: 28px;
}

.cursor-grab {
  cursor: grab;
}

.move-buttons .v-btn {
  width: 22px !important;
  height: 22px !important;
  min-width: 22px !important;
}

@media print {
  .v-btn, .v-text-field, .v-chip-group, .d-print-none {
    display: none !important;
  }
  
  .groups-table-container {
    overflow: visible;
  }
}
</style>
