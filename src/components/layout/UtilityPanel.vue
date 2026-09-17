<template>
  <v-navigation-drawer 
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    location="right" 
    app 
    :temporary="$vuetify.display.xs"
    :permanent="$vuetify.display.smAndUp"
    width="320"
  >
    <v-card flat class="pa-2">
      <!-- Empty card for now or add other utility items here -->
      <div class="text-center text-grey py-8">
        <v-icon size="48" color="grey-lighten-1" class="mb-2">
          mdi-tools
        </v-icon>
        <div class="text-caption">Utility Panel</div>
      </div>
    </v-card>
  </v-navigation-drawer>
</template>

<script setup>
import { onMounted } from 'vue'

defineProps({
  modelValue: Boolean
})

defineEmits(['update:modelValue'])

onMounted(() => {
  // Utility initialization if needed
})
</script>

<style scoped>
.v-list-item {
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.v-list-item:last-child {
  border-bottom: none;
}
</style>
