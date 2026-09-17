<template>
  <v-card>
    <v-card-title class="d-flex align-center py-4">
      <span>Talks Usage Matrix (2026-2035)</span>
      <v-spacer />
      <v-text-field
        v-model="search"
        prepend-inner-icon="mdi-magnify"
        label="Search Talk No. or Title"
        hide-details
        density="compact"
        class="max-width-300"
      />
    </v-card-title>

    <v-divider />

    <v-data-table
      :headers="headers"
      :items="matrixData"
      :search="search"
      :loading="loading"
      hover
      class="matrix-table"
    >
      <!-- Row index/No column -->
      <template v-slot:item.talkNumber="{ item }">
        <span class="font-weight-bold">{{ item.talkNumber }}</span>
      </template>

      <!-- Dynamic Year Columns -->
      <template v-for="year in years" :key="year" v-slot:[`item.${year}`]="{ item }">
        <div v-if="item.usage[year]" class="usage-cell">
          <div class="text-caption font-weight-bold line-height-1">
            {{ formatDate(item.usage[year].date) }}
          </div>
          <div class="text-caption text-grey text-truncate line-height-1 mt-1" :title="item.usage[year].speaker">
            {{ item.usage[year].speaker }}
          </div>
        </div>
        <span v-else class="text-grey-lighten-2">-</span>
      </template>
    </v-data-table>
  </v-card>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/config/firebase'

const search = ref('')
const loading = ref(false)
const s99Talks = ref([])
const publicTalks = ref([])

const years = Array.from({ length: 10 }, (_, i) => 2026 + i)

const headers = computed(() => {
  const baseHeaders = [
    { title: 'No.', key: 'talkNumber', sortable: true, width: '60px' },
    { title: 'Title', key: 'talkTitle', sortable: true, minWidth: '200px' }
  ]
  
  const yearHeaders = years.map(y => ({
    title: y.toString(),
    key: y.toString(),
    sortable: false,
    align: 'center',
    width: '100px'
  }))
  
  return [...baseHeaders, ...yearHeaders]
})

const matrixData = computed(() => {
  return s99Talks.value.map(talk => {
    const usage = {}
    
    // Find all instances of this talk across all years
    const talkInstances = publicTalks.value.filter(pt => pt.talkNumber == talk.talkNumber)
    
    talkInstances.forEach(instance => {
      const date = instance.date?.toDate ? instance.date.toDate() : new Date(instance.date)
      const year = date.getFullYear()
      
      if (years.includes(year)) {
        // Keep the LATEST one for that year if there are multiple (though unlikely)
        if (!usage[year] || date > usage[year].date) {
          usage[year] = {
            date: date,
            speaker: instance.speaker || 'No Speaker'
          }
        }
      }
    })
    
    return {
      talkNumber: talk.talkNumber,
      talkTitle: talk.talkTitle,
      usage: usage
    }
  })
})

const formatDate = (date) => {
  if (!date) return ''
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${date.getDate()} ${months[date.getMonth()]}`
}

const loadData = async () => {
  loading.value = true
  try {
    const [s99Snap, ptSnap] = await Promise.all([
      getDocs(collection(db, 's99_talks')),
      getDocs(collection(db, 'publicTalks'))
    ])
    
    s99Talks.value = s99Snap.docs
      .map(d => d.data())
      .sort((a, b) => Number(a.talkNumber) - Number(b.talkNumber))
      
    publicTalks.value = ptSnap.docs.map(d => d.data())
  } catch (err) {
    console.error('Error loading matrix data:', err)
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>

<style scoped>
.max-width-300 {
  max-width: 300px;
}
.matrix-table :deep(th) {
  background-color: rgba(var(--v-theme-primary), 0.05) !important;
  font-weight: bold !important;
}
.usage-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4px 0;
}
.line-height-1 {
  line-height: 1.2;
}
</style>
