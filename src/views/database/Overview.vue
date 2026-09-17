<template>
  <div>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-4">Congregation Overview</h1>
      </v-col>
    </v-row>
    
    <!-- First Row: Total Publishers, Regular Pioneers, Elders, MS -->
    <v-row>
      <v-col cols="12" md="6" lg="3">
        <v-card hover class="clickable-card" @click="navigateToPublishers()">
          <v-card-text>
            <div class="d-flex align-center">
              <v-icon size="40" color="primary" class="mr-4">mdi-account-group</v-icon>
              <div>
                <div class="text-caption text-grey">Total Publishers</div>
                <div class="text-h4 font-weight-bold">{{ stats.publishers }}</div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="6" lg="3">
        <v-card hover class="clickable-card" @click="navigateToPublishers('pioneerType', 'RP')">
          <v-card-text>
            <div class="d-flex align-center">
              <v-icon size="40" color="success" class="mr-4">mdi-star</v-icon>
              <div>
                <div class="text-caption text-grey">Regular Pioneers</div>
                <div class="text-h4 font-weight-bold">{{ stats.regularPioneers }}</div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="6" lg="3">
        <v-card hover class="clickable-card" @click="navigateToPublishers('role', 'Elder')">
          <v-card-text>
            <div class="d-flex align-center">
              <v-icon size="40" color="deep-purple" class="mr-4">mdi-shield-account</v-icon>
              <div>
                <div class="text-caption text-grey">Elders</div>
                <div class="text-h4 font-weight-bold">{{ stats.elders }}</div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="6" lg="3">
        <v-card hover class="clickable-card" @click="navigateToPublishers('role', 'Ministerial Servant')">
          <v-card-text>
            <div class="d-flex align-center">
              <v-icon size="40" color="blue" class="mr-4">mdi-account-tie</v-icon>
              <div>
                <div class="text-caption text-grey">Ministerial Servants</div>
                <div class="text-h4 font-weight-bold">{{ stats.ministerialServants }}</div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    
    <!-- Second Row: Unbaptized, Groups, Brothers, Sisters -->
    <v-row>
      <v-col cols="12" md="6" lg="3">
        <v-card hover class="clickable-card" @click="navigateToPublishers('role', 'Un-Baptized Publisher')">
          <v-card-text>
            <div class="d-flex align-center">
              <v-icon size="40" color="warning" class="mr-4">mdi-account</v-icon>
              <div>
                <div class="text-caption text-grey">Unbaptized Publishers</div>
                <div class="text-h4 font-weight-bold">{{ stats.unbaptized }}</div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="6" lg="3">
        <v-card>
          <v-card-text>
            <div class="d-flex align-center">
              <v-icon size="40" color="indigo" class="mr-4">mdi-account-multiple</v-icon>
              <div>
                <div class="text-caption text-grey">Total Groups</div>
                <div class="text-h4 font-weight-bold">{{ stats.totalGroups }}</div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="6" lg="3">
        <v-card hover class="clickable-card" @click="navigateToPublishers('gender', 'Male')">
          <v-card-text>
            <div class="d-flex align-center">
              <v-icon size="40" color="blue" class="mr-4">mdi-gender-male</v-icon>
              <div>
                <div class="text-caption text-grey">Brothers</div>
                <div class="text-h4 font-weight-bold">{{ stats.brothers }}</div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="6" lg="3">
        <v-card hover class="clickable-card" @click="navigateToPublishers('gender', 'Female')">
          <v-card-text>
            <div class="d-flex align-center">
              <v-icon size="40" color="pink" class="mr-4">mdi-gender-female</v-icon>
              <div>
                <div class="text-caption text-grey">Sisters</div>
                <div class="text-h4 font-weight-bold">{{ stats.sisters }}</div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    
    <!-- Third Row: Teenagers, Children -->
    <v-row>
      <v-col cols="12" md="6" lg="3">
        <v-card hover class="clickable-card" @click="navigateToPublishers('ageCategory', 'teenager')">
          <v-card-text>
            <div class="d-flex align-center">
              <v-icon size="40" color="teal" class="mr-4">mdi-account-school</v-icon>
              <div>
                <div class="text-caption text-grey">Teenagers (13-19)</div>
                <div class="text-h4 font-weight-bold">{{ stats.teenagers }}</div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="6" lg="3">
        <v-card hover class="clickable-card" @click="navigateToPublishers('ageCategory', 'child')">
          <v-card-text>
            <div class="d-flex align-center">
              <v-icon size="40" color="purple" class="mr-4">mdi-baby-face</v-icon>
              <div>
                <div class="text-caption text-grey">Children (1-12)</div>
                <div class="text-h4 font-weight-bold">{{ stats.children }}</div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    
    <!-- Groups Breakdown -->
    <v-row v-if="groupStats.length > 0">
      <v-col cols="12">
        <v-card>
          <v-card-title>Publishers by Group</v-card-title>
          <v-card-text>
            <v-row>
              <v-col 
                v-for="group in groupStats" 
                :key="group.id"
                cols="12" 
                md="6" 
                lg="3"
              >
                <v-card variant="outlined">
                  <v-card-text>
                    <div class="d-flex align-center">
                      <v-icon size="32" color="primary" class="mr-3">mdi-account-group-outline</v-icon>
                      <div>
                        <div class="text-subtitle-2 font-weight-bold">{{ group.name }}</div>
                        <div class="text-h5 font-weight-bold text-primary">{{ group.count }}</div>
                        <div class="text-caption text-grey">
                          {{ group.males }} M / {{ group.females }} F
                        </div>
                      </div>
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/config/firebase'

const router = useRouter()

// Navigation function for clickable stats
const navigateToPublishers = (filterKey, filterValue) => {
  if (filterKey && filterValue) {
    router.push({
      name: 'PublishersList',
      query: { [filterKey]: filterValue }
    })
  } else {
    router.push({ name: 'PublishersList' })
  }
}

const stats = ref({
  publishers: 0,
  regularPioneers: 0,
  elders: 0,
  ministerialServants: 0,
  unbaptized: 0,
  totalGroups: 0,
  brothers: 0,
  sisters: 0,
  aged: 0,
  adults: 0,
  youngsters: 0,
  teenagers: 0,
  children: 0
})

const groupStats = ref([])

const loadStats = async () => {
  try {
    // Load publishers
    const publishersSnapshot = await getDocs(collection(db, 'publishers'))
    const publishers = publishersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    
    stats.value.publishers = publishers.length
    
    // Count statistics based on Publishers List structure
    publishers.forEach(publisher => {
      // Pioneer types (RP only, no auxiliary)
      if (publisher.pioneerType === 'RP') stats.value.regularPioneers++
      
      // Elders and MS
      if (publisher.role === 'Elder') stats.value.elders++
      if (publisher.role === 'Ministerial Servant') stats.value.ministerialServants++
      
      // Unbaptized Publishers (based on role)
      if (publisher.role === 'Un-Baptized Publisher') stats.value.unbaptized++
      
      // Gender (Male/Female from Publishers List)
      if (publisher.gender === 'Male') stats.value.brothers++
      if (publisher.gender === 'Female') stats.value.sisters++
      
      // Dynamic Age Computation (Ignore static ageCategory which may be outdated)
      if (publisher.dob) {
        const d = publisher.dob.toDate ? publisher.dob.toDate() : new Date(publisher.dob)
        const now = new Date()
        let age = now.getFullYear() - d.getFullYear()
        const m = now.getMonth() - d.getMonth()
        if (m < 0 || (m === 0 && now.getDate() < d.getDate())) {
          age--
        }
        
        if (age <= 12) stats.value.children++
        else if (age <= 19) stats.value.teenagers++
        else if (age <= 35) stats.value.youngsters++
        else if (age <= 59) stats.value.adults++
        else stats.value.aged++
      }
    })
    
    // Load groups
    const groupsSnapshot = await getDocs(collection(db, 'groups'))
    const groups = groupsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    
    stats.value.totalGroups = groups.length
    
    // Calculate publishers per group
    groupStats.value = groups.map(group => {
      const groupPublishers = publishers.filter(p => p.groupId === group.id)
      const males = groupPublishers.filter(p => p.gender === 'Male').length
      const females = groupPublishers.filter(p => p.gender === 'Female').length
      
      return {
        id: group.id,
        name: group.name,
        count: groupPublishers.length,
        males,
        females
      }
    }).sort((a, b) => a.name.localeCompare(b.name))
    
  } catch (error) {
    console.error('Error loading stats:', error)
  }
}

onMounted(() => {
  loadStats()
})
</script>

<style scoped>
.clickable-card {
  cursor: pointer;
  transition: transform 0.2s;
}

.clickable-card:hover {
  transform: translateY(-2px);
}
</style>
