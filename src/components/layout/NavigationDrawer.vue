<template>
  <v-navigation-drawer 
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    app 
    :temporary="$vuetify.display.xs"
    :permanent="$vuetify.display.smAndUp"
    :width="drawerWidth"
    class="glass-drawer"
  >
    <v-list nav density="comfortable" class="px-3 pt-4">
      <v-list-item 
        v-if="authStore.canViewHome"
        prepend-icon="mdi-home"
        title="Home"
        to="/"
        rounded="lg"
        class="nav-item"
        active-class="nav-item-active"
      />
      
      <v-divider class="my-2 opacity-regular"></v-divider>
      
      <v-list-group v-if="authStore.canViewDatabase" value="database">
        <template v-slot:activator="{ props }">
          <v-list-item 
            v-bind="props" 
            prepend-icon="mdi-database"
            title="Congregation"
            rounded="lg"
            class="nav-item"
          />
        </template>
        
        <v-list-item 
          prepend-icon="mdi-view-dashboard" 
          title="Overview" 
          to="/congregation/overview"
          rounded="lg"
          class="nav-item-sub"
          active-class="nav-item-active"
        />
        <v-list-item 
          v-if="authStore.canViewPublishersList"
          prepend-icon="mdi-account-group" 
          title="Publishers List" 
          to="/congregation/publishers"
          rounded="lg"
          class="nav-item-sub"
          active-class="nav-item-active"
        />
        <v-list-item 
          v-if="authStore.canViewGroups"
          prepend-icon="mdi-account-multiple" 
          title="Groups" 
          to="/congregation/groups"
          rounded="lg"
          class="nav-item-sub"
          active-class="nav-item-active"
        />
        <v-list-item 
          prepend-icon="mdi-table" 
          title="Groups List" 
          to="/congregation/groups-list"
          rounded="lg"
          class="nav-item-sub"
          active-class="nav-item-active"
        />
        <v-list-item 
          prepend-icon="mdi-account-alert" 
          title="Emergency Contacts" 
          to="/congregation/emergency-contacts"
          rounded="lg"
          class="nav-item-sub"
          active-class="nav-item-active"
        />
      </v-list-group>
      
      <v-divider class="my-2 opacity-regular"></v-divider>
      
      <v-list-group v-if="authStore.canViewReports" value="reports">
        <template v-slot:activator="{ props }">
          <v-list-item 
            v-bind="props" 
            prepend-icon="mdi-file-document"
            title="Reports"
            rounded="lg"
            class="nav-item"
          />
        </template>
        
        <v-list-item 
          prepend-icon="mdi-chart-bar" 
          title="Overview" 
          to="/reports/overview"
          rounded="lg"
          class="nav-item-sub"
          active-class="nav-item-active"
        />
        <v-list-item 
          prepend-icon="mdi-plus-circle" 
          title="Add Reports" 
          to="/reports/add"
          rounded="lg"
          class="nav-item-sub"
          active-class="nav-item-active"
        />
        <v-list-item 
          prepend-icon="mdi-calendar-plus" 
          title="Add Meeting Attendance" 
          to="/reports/add-meeting-attendance"
          rounded="lg"
          class="nav-item-sub"
          active-class="nav-item-active"
        />
        <v-list-item 
          prepend-icon="mdi-format-list-bulleted" 
          title="Reports List" 
          to="/reports/list"
          rounded="lg"
          class="nav-item-sub"
          active-class="nav-item-active"
        />
        <v-list-item 
          prepend-icon="mdi-calendar-text" 
          title="Meeting Attendance List" 
          to="/reports/meeting-attendance-list"
          rounded="lg"
          class="nav-item-sub"
          active-class="nav-item-active"
        />
        <v-list-item 
          v-if="authStore.canViewPublisherRecord"
          prepend-icon="mdi-card-account-details" 
          title="Publisher Record" 
          to="/reports/publisher-record"
          rounded="lg"
          class="nav-item-sub"
          active-class="nav-item-active"
        />
        <v-list-item 
          v-if="authStore.canViewReportAnalyze"
          prepend-icon="mdi-chart-areaspline" 
          title="Service Year Analyse" 
          to="/reports/analyze"
          rounded="lg"
          class="nav-item-sub"
          active-class="nav-item-active"
        />
      </v-list-group>
      
      <v-divider class="my-2 opacity-regular"></v-divider>
      
      <v-list-group v-if="authStore.canViewSchedule" value="schedule">
        <template v-slot:activator="{ props }">
          <v-list-item 
            v-bind="props" 
            prepend-icon="mdi-calendar"
            title="Schedule"
            rounded="lg"
            class="nav-item"
          />
        </template>
        
        <v-list-item 
          prepend-icon="mdi-calendar-month" 
          title="Overview" 
          to="/schedule/overview"
          rounded="lg"
          class="nav-item-sub"
          active-class="nav-item-active"
        />
        <v-list-item 
          prepend-icon="mdi-microphone" 
          title="Public Talks" 
          to="/schedule/public-talks"
          rounded="lg"
          class="nav-item-sub"
          active-class="nav-item-active"
        />

        <v-list-item 
          prepend-icon="mdi-book-open-variant" 
          title="OCLM" 
          to="/schedule/oclm"
          rounded="lg"
          class="nav-item-sub"
          active-class="nav-item-active"
        />
        <v-list-item 
          prepend-icon="mdi-broom" 
          title="Cleaning" 
          to="/schedule/cleaning"
          rounded="lg"
          class="nav-item-sub"
          active-class="nav-item-active"
        />
        <v-list-item 
          prepend-icon="mdi-volume-high" 
          title="Sound" 
          to="/schedule/sound"
          rounded="lg"
          class="nav-item-sub"
          active-class="nav-item-active"
        />
      </v-list-group>
      
      <v-divider class="my-2 opacity-regular"></v-divider>
      
      <v-list-group v-if="authStore.canViewTerritory" value="territory">
        <template v-slot:activator="{ props }">
          <v-list-item 
            v-bind="props" 
            prepend-icon="mdi-map"
            title="Territory"
            rounded="lg"
            class="nav-item"
          />
        </template>
        
        <v-list-item 
          v-if="authStore.canViewTerritoryOverview"
          prepend-icon="mdi-map-marker" 
          title="Overview" 
          to="/territory/overview"
          rounded="lg"
          class="nav-item-sub"
          active-class="nav-item-active"
        />
        <v-list-item 
          prepend-icon="mdi-format-list-bulleted" 
          title="Territory List" 
          to="/territory/list"
          rounded="lg"
          class="nav-item-sub"
          active-class="nav-item-active"
        />
        <v-list-item 
          v-if="authStore.canViewTerritoryS13"
          prepend-icon="mdi-file-document-outline" 
          title="S-13" 
          to="/territory/s13"
          rounded="lg"
          class="nav-item-sub"
          active-class="nav-item-active"
        />
      </v-list-group>
      
      <v-divider class="my-2 opacity-regular"></v-divider>
      
      <v-list-item 
        v-if="authStore.isAdmin"
        prepend-icon="mdi-cog" 
        title="Settings" 
        to="/admin/settings"
        rounded="lg"
        class="nav-item"
        active-class="nav-item-active"
      />
    </v-list>
  </v-navigation-drawer>
</template>

<script setup>
import { computed } from 'vue'
import { useDisplay } from 'vuetify'
import { useAuthStore } from '@/stores/auth'

defineProps({
  modelValue: Boolean
})

defineEmits(['update:modelValue'])

const display = useDisplay()
const authStore = useAuthStore()

// Responsive drawer width
const drawerWidth = computed(() => {
  if (display.xs.value) return 280 // Mobile: full width
  if (display.sm.value) return 260 // Tablet: slightly larger for modern feel
  return 260 // Desktop: modern width
})
</script>

<style scoped>
.glass-drawer {
  border-right: none !important;
}

.opacity-regular {
  opacity: 0.1 !important;
}

:deep(.v-list-item__spacer) {
  width: 12px !important;
}

:deep(.v-list-item) {
  padding-inline-start: 12px !important;
  padding-inline-end: 12px !important;
  min-height: 40px !important;
}

:deep(.v-list-group__items) {
  --indent-padding: 8px !important;
}

:deep(.v-list-group__items .v-list-item) {
  padding-inline-start: 16px !important;
  margin-left: 0 !important;
  margin-right: 0 !important;
}

.nav-item {
  margin-bottom: 4px !important;
  font-weight: 500;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.nav-item-sub {
  margin-bottom: 4px !important;
  font-weight: 400;
  color: rgba(var(--v-theme-on-surface), 0.7);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.nav-item-sub:hover {
  transform: translateX(4px);
  color: rgba(var(--v-theme-on-surface), 1);
}

.nav-item-active {
  background: linear-gradient(90deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1)) !important;
  color: rgb(99, 102, 241) !important;
  font-weight: 600;
  border-left: 3px solid rgb(99, 102, 241);
}

.v-theme--dark .nav-item-active {
  color: rgb(167, 139, 250) !important;
  border-left-color: rgb(167, 139, 250);
}
</style>
