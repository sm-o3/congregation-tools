<template>
  <v-card>
    <v-card-title class="d-flex align-center py-4">
      Select Publishers for Sound Roles (Males Only)
      <v-spacer />
      <v-btn color="primary" variant="text" @click="selectAll" size="small">Select All</v-btn>
      <v-btn color="error" variant="text" @click="clearAll" size="small">Clear All</v-btn>
    </v-card-title>
    
    <v-card-text>
      <v-expansion-panels v-model="panels" multiple>
        <v-expansion-panel v-for="role in roles" :key="role.key" :value="role.key">
          <v-expansion-panel-title>
            <div class="d-flex align-center w-100">
              <strong>{{ role.title }}</strong>
              <v-spacer />
              <v-chip size="x-small" color="primary" class="mr-2">
                {{ selectedRoles[role.key]?.length || 0 }} Selected
              </v-chip>
            </div>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-chip-group
              v-model="selectedRoles[role.key]"
              multiple
              column
            >
              <v-chip
                v-for="p in malePublishers"
                :key="p.id"
                :value="p.id"
                filter
                variant="outlined"
                @click="toggleSelection"
              >
                {{ p.name }}
              </v-chip>
            </v-chip-group>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'

const props = defineProps({
  publishers: Array
})

const emit = defineEmits(['selections-updated'])

const panels = ref(['stage', 'pc', 'amplifier', 'rowing'])
const selectedRoles = reactive({
  stage: [],
  pc: [],
  amplifier: [],
  rowing: []
})

const roles = [
  { title: 'Stage', key: 'stage' },
  { title: 'PC (Computer)', key: 'pc' },
  { title: 'Amplifier', key: 'amplifier' },
  { title: 'Rowing (Microphones)', key: 'rowing' }
]

const malePublishers = computed(() => {
  return props.publishers.filter(p => p.gender === 'Male' && p.role !== 'Inactive Publisher' && p.role !== 'Removed')
})

const loadSelections = () => {
  const saved = localStorage.getItem('soundScheduleSelections')
  if (saved) {
    const data = JSON.parse(saved)
    Object.keys(data).forEach(key => {
      selectedRoles[key] = data[key] || []
    })
  }
}

const toggleSelection = () => {
  localStorage.setItem('soundScheduleSelections', JSON.stringify(selectedRoles))
  emit('selections-updated')
}

const selectAll = () => {
  const ids = malePublishers.value.map(p => p.id)
  roles.forEach(r => {
    selectedRoles[r.key] = [...ids]
  })
  toggleSelection()
}

const clearAll = () => {
  roles.forEach(r => {
    selectedRoles[r.key] = []
  })
  toggleSelection()
}

onMounted(loadSelections)
</script>
