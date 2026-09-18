<template>
  <div>
    <v-row class="mb-4">
      <v-col cols="12">
        <h1 class="text-h4">Public Talks Management</h1>
      </v-col>
    </v-row>

    <v-tabs v-model="activeTab" color="primary" class="mb-6" show-arrows>
      <v-tab v-if="!isEditorPublisher" value="overview">Overview</v-tab>
      <v-tab value="schedule">Schedule</v-tab>
      <v-tab v-if="authStore.isAdmin" value="generator">Generator</v-tab>
      <v-tab v-if="!isEditorPublisher" value="master">S-99</v-tab>
    </v-tabs>

    <v-window v-model="activeTab">
      <v-window-item v-if="!isEditorPublisher" value="overview">
        <PublicTalksOverview />
      </v-window-item>
      <v-window-item value="schedule">
        <PublicTalksSchedule :schedule-data="schedule" />
      </v-window-item>
      <v-window-item v-if="authStore.isAdmin" value="generator">
        <ScheduleGenerator @schedule-generated="handleScheduleGenerated" />
      </v-window-item>
      <v-window-item v-if="!isEditorPublisher" value="master">
        <MasterListS99 />
      </v-window-item>
    </v-window>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import PublicTalksOverview from './PublicTalksOverview.vue'
import PublicTalksSchedule from './PublicTalks.vue'
import ScheduleGenerator from './ScheduleGenerator.vue'
import MasterListS99 from './MasterListS99.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const isEditorPublisher = computed(() => authStore.isEditor && authStore.isPublisher)

const validTabs = ['overview', 'schedule', 'generator', 'master']
const getInitialTab = () => {
  const qTab = route.query.tab
  if (isEditorPublisher.value) {
    return 'schedule'
  }
  return validTabs.includes(qTab) ? qTab : 'overview'
}

const activeTab = ref(getInitialTab())
const schedule = ref([])

watch(isEditorPublisher, (isEP) => {
  if (isEP && (activeTab.value === 'overview' || activeTab.value === 'master')) {
    activeTab.value = 'schedule'
  }
})

watch(() => route.query.tab, (newTab) => {
  if (isEditorPublisher.value && (newTab === 'overview' || newTab === 'master')) {
    activeTab.value = 'schedule'
    return
  }
  if (newTab && validTabs.includes(newTab) && activeTab.value !== newTab) {
    activeTab.value = newTab
  }
})

watch(activeTab, (newTab) => {
  if (route.query.tab !== newTab) {
    router.replace({ query: { ...route.query, tab: newTab } })
  }
})

const handleScheduleGenerated = (newSchedule) => {
  schedule.value = newSchedule
  activeTab.value = 'schedule'
}
</script>
