<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-2">Sound Management</h1>
        <p class="text-subtitle-1 text-grey mb-6">
          Manage and generate schedules for Sound, PC, Amplifier, and Rowing.
        </p>
      </v-col>
    </v-row>

    <v-tabs v-model="tab" color="primary" class="mb-6">
      <v-tab value="schedule">Schedule</v-tab>
      <v-tab value="generator">Generator</v-tab>
      <v-tab value="publishers">Select Publishers</v-tab>
    </v-tabs>

    <v-window v-model="tab">
      <v-window-item value="schedule">
        <SoundSchedule 
          :scheduleData="generatedSchedule"
          @load-saved="syncPublishers"
        />
      </v-window-item>

      <v-window-item value="generator">
        <SoundGenerator 
          :publishers="publishers"
          @schedule-generated="handleScheduleGenerated"
        />
      </v-window-item>

      <v-window-item value="publishers">
        <SoundPublishers 
          :publishers="publishers"
          @selections-updated="loadPublishers"
        />
      </v-window-item>
    </v-window>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/config/firebase'
import SoundSchedule from './SoundSchedule.vue'
import SoundGenerator from './SoundGenerator.vue'
import SoundPublishers from './SoundPublishers.vue'

const tab = ref('schedule')
const publishers = ref([])
const generatedSchedule = ref([])

const loadPublishers = async () => {
  try {
    const snapshot = await getDocs(collection(db, 'publishers'))
    publishers.value = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(p => p.role !== 'Inactive Publisher' && p.role !== 'Removed')
  } catch (error) {
    console.error('Error loading publishers:', error)
  }
}

const handleScheduleGenerated = (schedule) => {
  generatedSchedule.value = schedule
  tab.value = 'schedule'
}

const syncPublishers = () => {
  loadPublishers()
}

onMounted(loadPublishers)
</script>
