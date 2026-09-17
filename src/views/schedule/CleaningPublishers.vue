<template>
  <v-card>
    <v-card-title>
      Select Publishers for Cleaning Schedule
      <v-spacer />
      <v-btn color="primary" variant="text" @click="selectAll" size="small">Select All</v-btn>
      <v-btn color="error" variant="text" @click="clearAll" size="small">Clear All</v-btn>
    </v-card-title>
    
    <v-card-text>
      <v-expansion-panels multiple>
        <v-expansion-panel v-for="group in groups" :key="group.id">
          <v-expansion-panel-title>
            <strong>{{ group.name }}</strong>
            <v-spacer />
            <v-chip size="small" color="primary" class="mr-2">
              {{ getSelectedCount(group.id, 'Male') }} Males
            </v-chip>
            <v-chip size="small" color="secondary">
              {{ getSelectedCount(group.id, 'Female') }} Females
            </v-chip>
          </v-expansion-panel-title>
          
          <v-expansion-panel-text>
            <v-row>
              <!-- Males -->
              <v-col cols="12" md="6">
                <h4 class="mb-2">Males</h4>
                <v-chip-group v-model="selectedPublishers[group.id].males" multiple column @update:model-value="saveSelections">
                  <v-chip
                    v-for="publisher in getGroupPublishers(group.id, 'Male')"
                    :key="publisher.id"
                    :value="publisher.id"
                    filter
                    variant="outlined"
                  >
                    {{ publisher.name }}
                  </v-chip>
                </v-chip-group>
                <div v-if="getGroupPublishers(group.id, 'Male').length === 0" class="text-grey text-caption">No male publishers in this group</div>
              </v-col>
              
              <!-- Females -->
              <v-col cols="12" md="6">
                <h4 class="mb-2">Females</h4>
                <v-chip-group v-model="selectedPublishers[group.id].females" multiple column @update:model-value="saveSelections">
                  <v-chip
                    v-for="publisher in getGroupPublishers(group.id, 'Female')"
                    :key="publisher.id"
                    :value="publisher.id"
                    filter
                    variant="outlined"
                  >
                    {{ publisher.name }}
                  </v-chip>
                </v-chip-group>
                <div v-if="getGroupPublishers(group.id, 'Female').length === 0" class="text-grey text-caption">No female publishers in this group</div>
              </v-col>
            </v-row>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { reactive, watch, onMounted } from 'vue'

const props = defineProps({
  groups: Array,
  publishers: Array
})

const selectedPublishers = reactive({})

const getGroupPublishers = (groupId, gender) => {
  return props.publishers.filter(p => p.groupId === groupId && p.gender === gender && p.role !== 'Inactive Publisher' && p.role !== 'Removed')
}

const getSelectedCount = (groupId, gender) => {
  if (!selectedPublishers[groupId]) return 0
  const key = gender === 'Male' ? 'males' : 'females'
  return selectedPublishers[groupId][key]?.length || 0
}

const saveSelections = () => {
  localStorage.setItem('cleaningScheduleSelections', JSON.stringify(selectedPublishers))
}

const selectAll = () => {
  props.groups.forEach(group => {
    selectedPublishers[group.id] = {
      males: getGroupPublishers(group.id, 'Male').map(p => p.id),
      females: getGroupPublishers(group.id, 'Female').map(p => p.id)
    }
  })
  saveSelections()
}

const clearAll = () => {
  props.groups.forEach(group => {
    selectedPublishers[group.id] = { males: [], females: [] }
  })
  saveSelections()
}

watch(() => props.groups, (newGroups) => {
  newGroups.forEach(group => {
    if (!selectedPublishers[group.id]) {
      selectedPublishers[group.id] = { males: [], females: [] }
    }
  })
}, { immediate: true })

onMounted(() => {
  const saved = localStorage.getItem('cleaningScheduleSelections')
  if (saved) {
    Object.assign(selectedPublishers, JSON.parse(saved))
  }
})
</script>
