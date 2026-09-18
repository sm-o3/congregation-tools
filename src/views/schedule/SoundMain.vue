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
          :midweek-day="midweekMeetingDay"
          @load-saved="syncPublishers"
        />
      </v-window-item>

      <v-window-item value="generator">
        <SoundGenerator 
          :publishers="publishers"
          :midweek-day="midweekMeetingDay"
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
import { collection, getDocs, doc, getDoc } from 'firebase/firestore'
import { db } from '@/config/firebase'
import SoundSchedule from './SoundSchedule.vue'
import SoundGenerator from './SoundGenerator.vue'
import SoundPublishers from './SoundPublishers.vue'

const tab = ref('schedule')
const publishers = ref([])
const generatedSchedule = ref([])
const midweekMeetingDay = ref('Thursday')

const loadSettings = async () => {
  try {
    const snapMeetings = await getDoc(doc(db, 'settings', 'meetings'))
    if (snapMeetings.exists() && snapMeetings.data().midweekMeetingDay) {
      midweekMeetingDay.value = snapMeetings.data().midweekMeetingDay
      return
    }
    const snapCong = await getDoc(doc(db, 'settings', 'congregation'))
    if (snapCong.exists() && snapCong.data().midweekMeetingDay) {
      midweekMeetingDay.value = snapCong.data().midweekMeetingDay
    }
  } catch (error) {
    console.error('Error loading meeting settings in SoundMain:', error)
  }
}

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

onMounted(() => {
  loadPublishers()
  loadSettings()
})
</script>
