<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-4">Cleaning Management</h1>
      </v-col>
    </v-row>

    <v-tabs v-model="activeTab" color="primary" class="mb-6" show-arrows>
      <v-tab value="schedule">Schedule</v-tab>
      <v-tab value="generator">Generator</v-tab>
      <v-tab value="publishers">Select Publishers</v-tab>
    </v-tabs>

    <v-window v-model="activeTab">
      <v-window-item value="schedule">
        <CleaningSchedule @refresh="loadData" :schedule-data="schedule" />
      </v-window-item>
      
      <v-window-item value="generator">
        <CleaningGenerator 
          :groups="groups" 
          :publishers="publishers" 
          :midweek-day="midweekMeetingDay"
          @schedule-generated="handleScheduleGenerated"
        />
      </v-window-item>
      
      <v-window-item value="publishers">
        <CleaningPublishers 
          :groups="groups" 
          :publishers="publishers" 
        />
      </v-window-item>
    </v-window>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { collection, getDocs, doc, getDoc } from 'firebase/firestore'
import { db } from '@/config/firebase'
import { useAuthStore } from '@/stores/auth'
import CleaningSchedule from './CleaningSchedule.vue'
import CleaningGenerator from './CleaningGenerator.vue'
import CleaningPublishers from './CleaningPublishers.vue'

const authStore = useAuthStore()
const activeTab = ref('schedule')

const schedule = ref([])
const groups = ref([])
const publishers = ref([])
const midweekMeetingDay = ref('Thursday')

const loadData = async () => {
  try {
    // Load Groups
    const groupsSnap = await getDocs(collection(db, 'groups'))
    groups.value = groupsSnap.docs.map(d => ({ id: d.id, ...d.data() }))

    // Load Publishers (Exclude Inactive Publishers)
    const pubsSnap = await getDocs(collection(db, 'publishers'))
    publishers.value = pubsSnap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(p => p.role !== 'Inactive Publisher' && p.role !== 'Removed')

    // Load Meeting Settings
    const settingsSnap = await getDoc(doc(db, 'settings', 'meetings'))
    if (settingsSnap.exists() && settingsSnap.data().midweekMeetingDay) {
      midweekMeetingDay.value = settingsSnap.data().midweekMeetingDay
    } else {
      const snapCong = await getDoc(doc(db, 'settings', 'congregation'))
      if (snapCong.exists() && snapCong.data().midweekMeetingDay) {
        midweekMeetingDay.value = snapCong.data().midweekMeetingDay
      }
    }
  } catch (error) {
    console.error('Error loading cleaning data:', error)
  }
}

const handleScheduleGenerated = (newSchedule) => {
  schedule.value = newSchedule
  activeTab.value = 'schedule'
}

onMounted(loadData)
</script>
