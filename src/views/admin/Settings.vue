<template>
  <div class="settings">
    <v-row class="mb-4">
      <v-col cols="12">
        <h1 class="text-h4">Settings & Management</h1>
        <p class="text-subtitle-1 text-grey-darken-1 mt-2">
          Manage congregation configurations and user access.
        </p>
      </v-col>
    </v-row>

    <v-tabs v-model="activeTab" color="primary" class="mb-6" show-arrows>
      <v-tab value="congregation" prepend-icon="mdi-domain">Congregation Settings</v-tab>
      <v-tab value="users" prepend-icon="mdi-account-multiple-outline">Manage Users</v-tab>
      <v-tab value="logs" prepend-icon="mdi-history">Activity Logs</v-tab>
      <v-tab value="theme" prepend-icon="mdi-palette-outline">Theme</v-tab>
      <v-tab value="about" prepend-icon="mdi-information-outline">About</v-tab>
      <v-tab value="help" prepend-icon="mdi-help-circle-outline">Help</v-tab>
    </v-tabs>

    <v-window v-model="activeTab">
      <!-- CONGREGATION SETTINGS TAB -->
      <v-window-item value="congregation">
        <v-row>
          <v-col cols="12" md="6">
            <v-card class="mb-4">
              <v-card-title class="bg-primary text-white pa-4">
                Congregation
              </v-card-title>
              
              <v-card-text class="pa-4">
                <v-alert
                  v-if="settingsError"
                  type="error"
                  variant="tonal"
                  class="mb-4"
                  closable
                  @click:close="settingsError = null"
                >
                  {{ settingsError }}
                </v-alert>

                <v-alert
                  v-if="settingsSuccessMsg"
                  type="success"
                  variant="tonal"
                  class="mb-4"
                  closable
                  @click:close="settingsSuccessMsg = null"
                >
                  {{ settingsSuccessMsg }}
                </v-alert>

                <v-form @submit.prevent="saveSettings">
                  <v-text-field
                    v-model="settings.congregationName"
                    label="Congregation Name"
                    prepend-icon="mdi-account-group"
                    variant="outlined"
                    :disabled="savingSettings"
                    placeholder="Enter congregation name"
                    class="mb-4"
                  />

                  <v-select
                    v-model="settings.midweekMeetingDay"
                    :items="weekDays"
                    label="Midweek Meeting Day"
                    prepend-icon="mdi-calendar-week"
                    variant="outlined"
                    :disabled="savingSettings"
                    class="mb-4"
                  />
                  
                  <v-text-field
                    v-model="settings.midweekMeetingTime"
                    label="Midweek Meeting Time"
                    prepend-icon="mdi-clock-outline"
                    type="time"
                    variant="outlined"
                    :disabled="savingSettings"
                    hint="Usually Thursday 6:30 PM"
                    persistent-hint
                    class="mb-4"
                  />
                  
                  <v-text-field
                    v-model="settings.weekendMeetingTime"
                    label="Weekend Meeting Time"
                    prepend-icon="mdi-clock-outline"
                    type="time"
                    variant="outlined"
                    :disabled="savingSettings"
                    hint="Usually Sunday 10:30 AM"
                    persistent-hint
                    class="mb-4"
                  />

                  <v-btn
                    type="submit"
                    color="primary"
                    block
                    :loading="savingSettings"
                    class="mt-4"
                  >
                    Save Congregation Settings
                  </v-btn>
                </v-form>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" md="6">
            <v-card>
              <v-card-title class="bg-indigo text-white pa-4">
                Congregation Appointments
              </v-card-title>
              <v-card-text class="pa-4">
                <v-alert
                  v-if="congError"
                  type="error"
                  variant="tonal"
                  class="mb-4"
                  closable
                  @click:close="congError = null"
                >
                  {{ congError }}
                </v-alert>

                <v-alert
                  v-if="congSuccessMsg"
                  type="success"
                  variant="tonal"
                  class="mb-4"
                  closable
                  @click:close="congSuccessMsg = null"
                >
                  {{ congSuccessMsg }}
                </v-alert>

                <v-form @submit.prevent="saveCongSettings">
                  <div class="text-subtitle-2 mb-2 text-indigo-darken-2">Elders Appointments</div>
                  <v-select
                    v-model="congSettings.coordinatorUid"
                    :items="eldersList"
                    item-title="displayName"
                    item-value="uid"
                    label="Coordinator"
                    variant="outlined"
                    density="comfortable"
                    class="mb-4"
                    @update:model-value="updateName('coordinator')"
                  />
                  
                  <v-select
                    v-model="congSettings.secretaryUid"
                    :items="eldersList"
                    item-title="displayName"
                    item-value="uid"
                    label="Secretary"
                    variant="outlined"
                    density="comfortable"
                    class="mb-4"
                    @update:model-value="updateName('secretary')"
                  />

                  <v-select
                    v-model="congSettings.serviceOverseerUid"
                    :items="eldersList"
                    item-title="displayName"
                    item-value="uid"
                    label="Service Overseer"
                    variant="outlined"
                    density="comfortable"
                    class="mb-4"
                    @update:model-value="updateName('serviceOverseer')"
                  />

                  <v-divider class="my-4"></v-divider>
                  <div class="text-subtitle-2 mb-2 text-indigo-darken-2">Servants Appointments</div>

                  <v-select
                    v-model="congSettings.accountsServantUid"
                    :items="allQualifiedList"
                    item-title="displayName"
                    item-value="uid"
                    label="Accounts Servant"
                    variant="outlined"
                    density="comfortable"
                    class="mb-4"
                    @update:model-value="updateName('accountsServant')"
                  />

                  <v-select
                    v-model="congSettings.territoryServantUid"
                    :items="allQualifiedList"
                    item-title="displayName"
                    item-value="uid"
                    label="Territory Servant"
                    variant="outlined"
                    density="comfortable"
                    clearable
                    class="mb-4"
                    @update:model-value="updateName('territoryServant')"
                  />

                  <v-select
                    v-model="congSettings.territoryAssistantUid"
                    :items="allQualifiedList"
                    item-title="displayName"
                    item-value="uid"
                    label="Territory Assistant"
                    variant="outlined"
                    density="comfortable"
                    clearable
                    class="mb-4"
                    @update:model-value="updateName('territoryAssistant')"
                  />

                  <v-divider class="my-4"></v-divider>
                  <div class="text-subtitle-2 mb-2 text-indigo-darken-2">Attendants</div>

                  <v-select
                    v-model="congSettings.attendants"
                    :items="brothersSortedByFamily"
                    item-title="displayLabel"
                    item-value="id"
                    label="Attendants"
                    variant="outlined"
                    density="comfortable"
                    multiple
                    chips
                    closable-chips
                    clearable
                    class="mb-4"
                    hint="Filter active brothers only"
                    persistent-hint
                  />

                  <v-btn
                    type="submit"
                    color="indigo"
                    block
                    :loading="savingCong"
                    class="mt-4"
                  >
                    Save Appointments
                  </v-btn>
                </v-form>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-window-item>

      <!-- MANAGE USERS TAB -->
      <v-window-item value="users">
        <div class="users-tab">
          <v-row class="mb-4" align="center">
            <v-col cols="12" sm="8">
              <div class="text-h6">Access Control</div>
              <div class="text-body-2 text-grey-darken-1">Add or remove users and assign their access roles.</div>
            </v-col>
            <v-col cols="12" sm="4" class="text-sm-right d-flex justify-sm-end align-center">
              <v-btn
                v-if="selectedUsers.length > 0"
                color="error"
                prepend-icon="mdi-delete"
                @click="deleteSelectedUsers"
                class="mr-2"
              >
                Delete ({{ selectedUsers.length }})
              </v-btn>
              <v-btn
                color="primary"
                prepend-icon="mdi-account-plus"
                @click="openAddUserDialog"
              >
                Add User
              </v-btn>
            </v-col>
          </v-row>

          <v-alert
            v-if="usersError"
            type="error"
            variant="tonal"
            class="mb-4"
            closable
            @click:close="usersError = null"
          >
            {{ usersError }}
          </v-alert>

          <v-alert
            v-if="usersSuccessMsg"
            type="success"
            variant="tonal"
            class="mb-4"
            closable
            @click:close="usersSuccessMsg = null"
          >
            {{ usersSuccessMsg }}
          </v-alert>

          <v-card variant="outlined">
            <v-data-table
              v-model="selectedUsers"
              :headers="userHeaders"
              :items="users"
              :loading="loadingUsers"
              item-value="id"
              show-select
              hover
              @click:row="handleUserRowClick"
            >
              <template v-slot:item.displayName="{ item }">
                <div class="d-flex align-center gap-3">
                  <v-avatar size="32" color="primary" variant="tonal">
                    <span>{{ item.displayName?.charAt(0)?.toUpperCase() || '?' }}</span>
                  </v-avatar>
                  <div class="font-weight-medium">{{ item.displayName }}</div>
                </div>
              </template>

              <template v-slot:item.groupName="{ item }">
                <span class="text-body-2">{{ item.groupName || '-' }}</span>
              </template>

              <template v-slot:item.role="{ item }">
                <v-chip :color="getRoleColor(item.role)" size="small" class="font-weight-medium">
                  {{ item.role?.toUpperCase() || 'UNKNOWN' }}
                </v-chip>
              </template>

              <template v-slot:item.spiritualRole="{ item }">
                <v-chip :color="getSpiritualRoleColor(item.spiritualRole)" size="small" variant="outlined">
                  {{ item.spiritualRole || 'Publisher' }}
                </v-chip>
              </template>

              <template v-slot:item.status="{ item }">
                <v-chip :color="item.uid ? 'success' : 'warning'" size="small" variant="flat">
                  {{ item.uid ? 'Active' : 'Pending' }}
                </v-chip>
              </template>
            </v-data-table>
          </v-card>
        </div>
      </v-window-item>

      <!-- ACTIVITY LOGS TAB -->
      <v-window-item value="logs">
        <v-row class="mb-4" align="center">
          <v-col cols="12" sm="8">
            <div class="text-h6">System Logs</div>
            <div class="text-body-2 text-grey-darken-1">Track all report updates and administrative actions. Logs are automatically cleared after 2 months.</div>
          </v-col>
        </v-row>

        <v-row class="mb-4">
          <v-col cols="12" sm="4">
            <v-select
              v-model="logMonth"
              :items="months"
              item-title="name"
              item-value="value"
              label="Filter by Month"
              variant="outlined"
              density="comfortable"
              clearable
              @update:model-value="loadLogs"
            />
          </v-col>
          <v-col cols="12" sm="4">
            <v-select
              v-model="logYear"
              :items="years"
              label="Filter by Year"
              variant="outlined"
              density="comfortable"
              clearable
              @update:model-value="loadLogs"
            />
          </v-col>
        </v-row>

        <v-card variant="outlined">
          <v-data-table
            :headers="logHeaders"
            :items="logs"
            :loading="loadingLogs"
            hover
            class="clickable-rows"
            @click:row="openLogDetailDialog"
          >
            <template v-slot:item.timestamp="{ item }">
              {{ formatLogTime(item.timestamp) }}
            </template>
            <template v-slot:item.action="{ item }">
              <v-chip
                :color="getActionColor(item.action)"
                size="small"
                variant="tonal"
              >
                {{ item.action }}
              </v-chip>
            </template>
            <template v-slot:item.details="{ item }">
              <span class="text-body-2 font-weight-medium">{{ item.details }}</span>
            </template>
          </v-data-table>
        </v-card>
      </v-window-item>

      <!-- THEME CUSTOMIZATION TAB -->
      <v-window-item value="theme">
        <v-row class="mb-4">
          <v-col cols="12" md="8">
            <h2 class="text-h5 font-weight-bold">Site Theme Customization</h2>
            <p class="text-body-2 text-medium-emphasis mt-1">
              Customize colors for Text, Sub-Texts, Accent, Background, and brand elements for Day (Light) and Night (Dark) themes.
            </p>
          </v-col>
          <v-col cols="12" md="4" class="d-flex justify-md-end align-center">
            <v-btn-toggle
              v-model="selectedThemeMode"
              mandatory
              color="primary"
              rounded="lg"
              density="comfortable"
            >
              <v-btn value="light" prepend-icon="mdi-white-balance-sunny">
                Day (Light)
              </v-btn>
              <v-btn value="dark" prepend-icon="mdi-weather-night">
                Night (Dark)
              </v-btn>
            </v-btn-toggle>
          </v-col>
        </v-row>

        <v-alert
          v-if="themeSuccessMsg"
          type="success"
          variant="tonal"
          class="mb-4"
          closable
          @click:close="themeSuccessMsg = null"
        >
          {{ themeSuccessMsg }}
        </v-alert>

        <v-alert
          v-if="themeErrorMsg"
          type="error"
          variant="tonal"
          class="mb-4"
          closable
          @click:close="themeErrorMsg = null"
        >
          {{ themeErrorMsg }}
        </v-alert>

        <v-row>
          <!-- Left Column: Palette Controls -->
          <v-col cols="12" lg="7">
            <v-card class="mb-4 elevation-1 rounded-xl">
              <v-card-title class="bg-primary text-white pa-4 d-flex align-center justify-space-between">
                <div class="d-flex align-center ga-2">
                  <v-icon>{{ selectedThemeMode === 'light' ? 'mdi-white-balance-sunny' : 'mdi-weather-night' }}</v-icon>
                  <span>{{ selectedThemeMode === 'light' ? 'Day Theme (Light)' : 'Night Theme (Dark)' }} Settings</span>
                </div>
                <v-chip size="small" variant="flat" color="white" class="text-primary font-weight-bold">
                  Editing {{ selectedThemeMode.toUpperCase() }}
                </v-chip>
              </v-card-title>

              <v-card-text class="pa-4">
                <!-- Color items list -->
                <div 
                  v-for="item in colorConfigItems" 
                  :key="item.key"
                  class="d-flex align-center justify-space-between flex-wrap ga-3 p-2 mb-3 border rounded-lg pa-3"
                >
                  <div style="flex: 1; min-width: 200px;">
                    <div class="text-subtitle-2 font-weight-bold">{{ item.label }}</div>
                    <div class="text-caption text-medium-emphasis">{{ item.description }}</div>
                  </div>
                  <div class="d-flex align-center ga-2">
                    <input
                      type="color"
                      v-model="themeConfig[selectedThemeMode][item.key]"
                      @input="onColorChange"
                      class="color-picker-input cursor-pointer"
                      :title="'Pick ' + item.label"
                    />
                    <v-text-field
                      v-model="themeConfig[selectedThemeMode][item.key]"
                      @update:model-value="onColorChange"
                      density="compact"
                      variant="outlined"
                      hide-details
                      style="width: 110px;"
                      class="font-monospace"
                    />
                  </div>
                </div>

                <!-- Presets -->
                <div class="mt-4 pt-3 border-t">
                  <div class="text-caption font-weight-bold text-medium-emphasis mb-2">QUICK PALETTE PRESETS</div>
                  <div class="d-flex flex-wrap ga-2">
                    <v-btn
                      v-for="preset in themePresets"
                      :key="preset.name"
                      size="small"
                      variant="outlined"
                      rounded="lg"
                      @click="applyPreset(preset)"
                    >
                      <span
                        class="d-inline-block rounded-circle mr-2"
                        :style="{ width: '10px', height: '10px', background: preset[selectedThemeMode].primary }"
                      ></span>
                      {{ preset.name }}
                    </v-btn>
                  </div>
                </div>

                <!-- Actions -->
                <div class="d-flex align-center justify-space-between flex-wrap ga-3 mt-6 pt-4 border-t">
                  <div class="d-flex ga-2 flex-wrap">
                    <v-btn
                      variant="outlined"
                      color="secondary"
                      size="small"
                      prepend-icon="mdi-restore"
                      @click="handleResetCurrentMode"
                    >
                      Reset {{ selectedThemeMode === 'light' ? 'Day' : 'Night' }} Defaults
                    </v-btn>
                    <v-btn
                      variant="text"
                      color="error"
                      size="small"
                      prepend-icon="mdi-refresh"
                      @click="handleResetAllThemes"
                    >
                      Reset All
                    </v-btn>
                  </div>

                  <v-btn
                    color="primary"
                    variant="flat"
                    prepend-icon="mdi-content-save"
                    :loading="savingTheme"
                    @click="handleSaveTheme"
                  >
                    Save Theme Settings
                  </v-btn>
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <!-- Right Column: Live Interactive Preview -->
          <v-col cols="12" lg="5">
            <v-card class="elevation-1 rounded-xl overflow-hidden mb-4">
              <v-card-title class="bg-grey-darken-3 text-white pa-3 text-caption font-weight-bold d-flex align-center justify-space-between">
                <span>LIVE INTERACTIVE PREVIEW</span>
                <v-btn
                  size="x-small"
                  variant="text"
                  color="white"
                  prepend-icon="mdi-theme-light-dark"
                  @click="toggleSiteThemeMode"
                >
                  Toggle Site Mode
                </v-btn>
              </v-card-title>

              <div
                class="pa-4"
                :style="{
                  background: activeThemeColors.background,
                  transition: 'background 0.3s ease'
                }"
              >
                <!-- Outer Mock Card -->
                <div
                  class="pa-4 rounded-xl elevation-2 mb-4"
                  :style="{
                    background: activeThemeColors.surface,
                    border: '1px solid rgba(128,128,128,0.18)',
                    transition: 'all 0.3s ease'
                  }"
                >
                  <div class="d-flex align-center justify-space-between mb-2">
                    <div class="text-h6 font-weight-bold" :style="{ color: activeThemeColors.text }">
                      Congregation Overview
                    </div>
                    <span
                      class="px-2 py-1 rounded text-caption font-weight-bold"
                      :style="{ background: activeThemeColors.accent, color: '#FFFFFF' }"
                    >
                      Active Accent
                    </span>
                  </div>

                  <p class="text-body-2 mb-4" :style="{ color: activeThemeColors.subtext }">
                    This sample demonstrates how headings, subtitles, descriptions, and metadata will be rendered across your congregation portal.
                  </p>

                  <div class="d-flex align-center ga-2 flex-wrap mb-4">
                    <button
                      type="button"
                      class="px-4 py-2 rounded-lg font-weight-bold text-caption text-white border-0 cursor-pointer"
                      :style="{ background: activeThemeColors.primary }"
                    >
                      Primary Action
                    </button>
                    <button
                      type="button"
                      class="px-4 py-2 rounded-lg font-weight-bold text-caption text-white border-0 cursor-pointer"
                      :style="{ background: activeThemeColors.secondary }"
                    >
                      Secondary Action
                    </button>
                  </div>

                  <!-- Inner Nested Container -->
                  <div
                    class="pa-3 rounded-lg"
                    :style="{
                      background: activeThemeColors.background,
                      border: '1px solid rgba(128,128,128,0.2)'
                    }"
                  >
                    <div class="text-subtitle-2 font-weight-bold mb-1" :style="{ color: activeThemeColors.text }">
                      Meeting Schedule Preview
                    </div>
                    <div class="text-caption" :style="{ color: activeThemeColors.subtext }">
                      Midweek: Thursday 6:30 PM &bull; Weekend: Sunday 10:30 AM
                    </div>
                  </div>
                </div>

                <!-- Color Swatch Strip -->
                <div class="d-flex justify-space-around text-center pt-2">
                  <div>
                    <div class="rounded-circle mx-auto elevation-1 mb-1" :style="{ width: '24px', height: '24px', background: activeThemeColors.text }"></div>
                    <div class="text-caption font-weight-medium" :style="{ color: activeThemeColors.text }">Text</div>
                  </div>
                  <div>
                    <div class="rounded-circle mx-auto elevation-1 mb-1" :style="{ width: '24px', height: '24px', background: activeThemeColors.subtext }"></div>
                    <div class="text-caption font-weight-medium" :style="{ color: activeThemeColors.subtext }">Sub-Text</div>
                  </div>
                  <div>
                    <div class="rounded-circle mx-auto elevation-1 mb-1" :style="{ width: '24px', height: '24px', background: activeThemeColors.accent }"></div>
                    <div class="text-caption font-weight-medium" :style="{ color: activeThemeColors.text }">Accent</div>
                  </div>
                  <div>
                    <div class="rounded-circle mx-auto elevation-1 mb-1" :style="{ width: '24px', height: '24px', background: activeThemeColors.primary }"></div>
                    <div class="text-caption font-weight-medium" :style="{ color: activeThemeColors.text }">Primary</div>
                  </div>
                  <div>
                    <div class="rounded-circle mx-auto elevation-1 mb-1" :style="{ width: '24px', height: '24px', background: activeThemeColors.secondary }"></div>
                    <div class="text-caption font-weight-medium" :style="{ color: activeThemeColors.text }">Secondary</div>
                  </div>
                </div>
              </div>
            </v-card>
          </v-col>
        </v-row>
      </v-window-item>

      <!-- ABOUT TAB -->
      <v-window-item value="about">
        <v-row>
          <v-col cols="12" md="9" lg="8" class="mx-auto">
            <v-card class="elevation-1 rounded-xl overflow-hidden mb-6">
              <!-- Hero Header Banner -->
              <div class="about-hero-banner pa-8 text-white text-center position-relative">
                <v-avatar size="72" color="white" class="mb-3 elevation-3">
                  <v-icon size="40" color="primary">mdi-account-group</v-icon>
                </v-avatar>
                <h2 class="text-h4 font-weight-bold">Congregation Tools</h2>
                <p class="text-subtitle-1 opacity-90 mt-1">
                  Administrative Management & Operations Platform
                </p>
                <v-chip class="mt-2 font-weight-bold bg-white text-primary" size="small" variant="flat">
                  Version 1.0.2
                </v-chip>
              </div>

              <v-card-text class="pa-6">
                <!-- Project Specifications List -->
                <div class="text-subtitle-2 font-weight-bold text-medium-emphasis mb-3">
                  APPLICATION METADATA
                </div>

                <v-list class="bg-transparent pa-0">
                  <v-list-item class="px-0 py-3 border-b">
                    <template v-slot:prepend>
                      <v-avatar color="primary" variant="tonal" size="40" class="mr-3">
                        <v-icon>mdi-tag-outline</v-icon>
                      </v-avatar>
                    </template>
                    <v-list-item-title class="font-weight-bold text-body-1">Version</v-list-item-title>
                    <v-list-item-subtitle class="text-body-2 text-medium-emphasis">1.0.2</v-list-item-subtitle>
                    <template v-slot:append>
                      <v-chip color="success" size="small" variant="flat">Current Release</v-chip>
                    </template>
                  </v-list-item>

                  <v-list-item class="px-0 py-3 border-b">
                    <template v-slot:prepend>
                      <v-avatar color="secondary" variant="tonal" size="40" class="mr-3">
                        <v-icon>mdi-account-circle-outline</v-icon>
                      </v-avatar>
                    </template>
                    <v-list-item-title class="font-weight-bold text-body-1">Developer</v-list-item-title>
                    <v-list-item-subtitle class="text-body-2 text-medium-emphasis">sm-o3</v-list-item-subtitle>
                    <template v-slot:append>
                      <v-btn
                        href="https://github.com/sm-o3"
                        target="_blank"
                        rel="noopener noreferrer"
                        color="secondary"
                        variant="outlined"
                        size="small"
                        prepend-icon="mdi-github"
                      >
                        github.com/sm-o3
                      </v-btn>
                    </template>
                  </v-list-item>

                  <v-list-item class="px-0 py-3 border-b">
                    <template v-slot:prepend>
                      <v-avatar color="accent" variant="tonal" size="40" class="mr-3">
                        <v-icon>mdi-source-repository</v-icon>
                      </v-avatar>
                    </template>
                    <v-list-item-title class="font-weight-bold text-body-1">Open Source Project Page</v-list-item-title>
                    <v-list-item-subtitle class="text-body-2 text-medium-emphasis">https://github.com/sm-o3/congregation-tools.git</v-list-item-subtitle>
                    <template v-slot:append>
                      <v-btn
                        href="https://github.com/sm-o3/congregation-tools.git"
                        target="_blank"
                        rel="noopener noreferrer"
                        color="primary"
                        variant="flat"
                        size="small"
                        prepend-icon="mdi-open-in-new"
                      >
                        View Project
                      </v-btn>
                    </template>
                  </v-list-item>

                  <v-list-item class="px-0 py-3">
                    <template v-slot:prepend>
                      <v-avatar color="info" variant="tonal" size="40" class="mr-3">
                        <v-icon>mdi-scale-balance</v-icon>
                      </v-avatar>
                    </template>
                    <v-list-item-title class="font-weight-bold text-body-1">License</v-list-item-title>
                    <v-list-item-subtitle class="text-body-2 text-medium-emphasis">Open Source (MIT License)</v-list-item-subtitle>
                  </v-list-item>
                </v-list>

                <v-divider class="my-6" />

                <!-- About Overview -->
                <div class="text-subtitle-1 font-weight-bold mb-2">About Congregation Tools</div>
                <p class="text-body-2 text-medium-emphasis mb-4">
                  Congregation Tools is an all-in-one open-source management suite tailored specifically for congregation recordkeeping and schedule coordination. It automates attendance logging, monthly field service reporting, public talk coordination (S-99 master directory), Our Christian Life & Ministry (OCLM) parts, cleaning and sound assignments, emergency contacts, territory management (S-13 cards), and user privilege administration.
                </p>

                <!-- Core Technologies -->
                <div class="text-subtitle-1 font-weight-bold mb-3">Core Technology Stack</div>
                <div class="d-flex flex-wrap ga-2 mb-2">
                  <v-chip size="small" variant="tonal" color="primary" prepend-icon="mdi-vuejs">Vue 3 (Composition API)</v-chip>
                  <v-chip size="small" variant="tonal" color="secondary" prepend-icon="mdi-vuetify">Vuetify 3 (Material Design)</v-chip>
                  <v-chip size="small" variant="tonal" color="info" prepend-icon="mdi-lightning-bolt">Vite Build System</v-chip>
                  <v-chip size="small" variant="tonal" color="warning" prepend-icon="mdi-fruit-pineapple">Pinia State Management</v-chip>
                  <v-chip size="small" variant="tonal" color="error" prepend-icon="mdi-firebase">Google Cloud Firestore</v-chip>
                  <v-chip size="small" variant="tonal" color="success" prepend-icon="mdi-shield-key-outline">Firebase Authentication</v-chip>
                  <v-chip size="small" variant="tonal" prepend-icon="mdi-file-excel-outline">SheetJS (Excel Engine)</v-chip>
                  <v-chip size="small" variant="tonal" prepend-icon="mdi-chart-areaspline">Chart.js Analytics</v-chip>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-window-item>

      <!-- HELP TAB -->
      <v-window-item value="help">
        <v-row class="mb-4">
          <v-col cols="12">
            <div class="d-flex align-center ga-3 mb-2">
              <v-avatar color="primary" variant="tonal" size="48">
                <v-icon size="28">mdi-book-open-page-variant-outline</v-icon>
              </v-avatar>
              <div>
                <h2 class="text-h5 font-weight-bold">Settings & Management Documentation</h2>
                <p class="text-body-2 text-medium-emphasis">
                  Operational guides and reference manuals for Congregation Settings, User Management, Activity Logs, and Themes.
                </p>
              </div>
            </div>
          </v-col>
        </v-row>

        <v-expansion-panels multiple v-model="openedHelpPanels" class="mb-6">
          <!-- 1. Congregation Settings Guide -->
          <v-expansion-panel value="congregation-guide" class="rounded-xl mb-3 border">
            <v-expansion-panel-title class="py-4">
              <div class="d-flex align-center ga-3">
                <v-avatar color="primary" size="36" class="text-white">
                  <v-icon size="20">mdi-domain</v-icon>
                </v-avatar>
                <div>
                  <div class="text-subtitle-1 font-weight-bold">1. Congregation Settings Guide</div>
                  <div class="text-caption text-medium-emphasis">Congregation Name, Meeting Schedules & Brother Appointments</div>
                </div>
              </div>
            </v-expansion-panel-title>
            <v-expansion-panel-text class="pt-2">
              <div class="text-body-2 mb-4">
                The <strong>Congregation Settings</strong> tab allows administrators to manage key congregation metadata, default meeting schedules, and brother appointment responsibilities.
              </div>

              <v-card variant="outlined" class="pa-4 mb-4 rounded-lg">
                <div class="text-subtitle-2 font-weight-bold text-primary mb-1">
                  <v-icon size="small" class="mr-1">mdi-home-city-outline</v-icon> Congregation Name
                </div>
                <p class="text-body-2 mb-2">
                  Configure the official congregation name in the <em>Congregation</em> box. Once saved:
                </p>
                <ul class="text-body-2 pl-5 mb-2">
                  <li>The top navigation AppBar dynamically displays this congregation name on both Desktop and Mobile devices.</li>
                  <li>If left empty or unconfigured, the AppBar automatically defaults to <strong>"Congregation Tools"</strong>.</li>
                  <li>Changes are stored in Cloud Firestore and instantly update across all active client views.</li>
                </ul>
              </v-card>

              <v-card variant="outlined" class="pa-4 mb-4 rounded-lg">
                <div class="text-subtitle-2 font-weight-bold text-primary mb-1">
                  <v-icon size="small" class="mr-1">mdi-clock-outline</v-icon> Meeting Times Configuration
                </div>
                <p class="text-body-2 mb-2">
                  Sets default meeting days and times for midweek and weekend gatherings:
                </p>
                <ul class="text-body-2 pl-5 mb-2">
                  <li><strong>Midweek Meeting Day & Time:</strong> The selected day (e.g. Thursday) and start time (e.g. 18:30) serve as default timestamps in Meeting Attendance, OCLM schedules, and cleaning rosters.</li>
                  <li><strong>Weekend Meeting Time:</strong> The weekend start time (e.g. 10:30) is referenced when creating Public Talk agendas and weekend attendance sheets.</li>
                </ul>
              </v-card>

              <v-card variant="outlined" class="pa-4 rounded-lg">
                <div class="text-subtitle-2 font-weight-bold text-primary mb-1">
                  <v-icon size="small" class="mr-1">mdi-account-tie</v-icon> Congregation Appointments
                </div>
                <p class="text-body-2 mb-2">
                  Assign brothers to appointed offices:
                </p>
                <ul class="text-body-2 pl-5">
                  <li><strong>Elders Appointments:</strong> Coordinator of the Body of Elders (COBE), Secretary, and Service Overseer. Only users with the spiritual role of <em>Elder</em> can be selected.</li>
                  <li><strong>Servants Appointments:</strong> Accounts Servant and Territory Servant. Can be assigned to Elders, Ministerial Servants, or qualified Publishers.</li>
                  <li><strong>Permission Automation:</strong> The appointed Service Overseer automatically receives viewing privileges for Service Year Analysis and attendance reports regardless of default user group assignments.</li>
                </ul>
              </v-card>
            </v-expansion-panel-text>
          </v-expansion-panel>

          <!-- 2. Manage Users Guide -->
          <v-expansion-panel value="users-guide" class="rounded-xl mb-3 border">
            <v-expansion-panel-title class="py-4">
              <div class="d-flex align-center ga-3">
                <v-avatar color="secondary" size="36" class="text-white">
                  <v-icon size="20">mdi-account-multiple-check-outline</v-icon>
                </v-avatar>
                <div>
                  <div class="text-subtitle-1 font-weight-bold">2. Manage Users Guide</div>
                  <div class="text-caption text-medium-emphasis">User Accounts, Access Levels, Spiritual Roles & Field Service Groups</div>
                </div>
              </div>
            </v-expansion-panel-title>
            <v-expansion-panel-text class="pt-2">
              <div class="text-body-2 mb-4">
                The <strong>Manage Users</strong> tab governs who can log in, what privileges they hold, and what congregation records they can access.
              </div>

              <v-card variant="outlined" class="pa-4 mb-4 rounded-lg">
                <div class="text-subtitle-2 font-weight-bold text-secondary mb-1">
                  <v-icon size="small" class="mr-1">mdi-shield-lock-outline</v-icon> Access Levels (Roles)
                </div>
                <ul class="text-body-2 pl-5">
                  <li><strong>Admin (Full Access):</strong> Can access the Settings page, manage users, modify congregation settings, purge activity logs, and edit all data across modules.</li>
                  <li><strong>Editor (Standard):</strong> Can view and edit schedules, create and submit monthly reports, and manage publishers and emergency contacts. Cannot access Settings or delete users.</li>
                  <li><strong>Viewer (Read Only):</strong> Has read-only access to authorized sections.</li>
                </ul>
              </v-card>

              <v-card variant="outlined" class="pa-4 mb-4 rounded-lg">
                <div class="text-subtitle-2 font-weight-bold text-secondary mb-1">
                  <v-icon size="small" class="mr-1">mdi-account-switch-outline</v-icon> Spiritual Roles & Group Scoping
                </div>
                <ul class="text-body-2 pl-5">
                  <li><strong>Elder:</strong> Has full access to congregation databases, schedules, reports, and appointments.</li>
                  <li><strong>Ministerial Servant & Publisher Group Scoping:</strong> When assigned a specific <em>Assigned Group</em>, publishers and ministerial servants are restricted to seeing records and attendance exclusively for their group.</li>
                  <li><strong>Publisher Access:</strong> Publishers only have access to submit field service reports; all other sensitive sections are automatically hidden.</li>
                </ul>
              </v-card>

              <v-card variant="outlined" class="pa-4 rounded-lg">
                <div class="text-subtitle-2 font-weight-bold text-secondary mb-1">
                  <v-icon size="small" class="mr-1">mdi-account-plus-outline</v-icon> Adding & Managing Accounts
                </div>
                <ul class="text-body-2 pl-5">
                  <li>Click <strong>Add User</strong> and enter the user's Full Name, Google Account Email, Access Level, Spiritual Role, and Assigned Group.</li>
                  <li>The email address entered must be the exact Google account they use to sign in via Google OAuth.</li>
                  <li>Click on any existing row in the table to edit their role, group, or status.</li>
                  <li>Select one or more users via checkbox and click <strong>Delete</strong> to revoke access.</li>
                </ul>
              </v-card>
            </v-expansion-panel-text>
          </v-expansion-panel>

          <!-- 3. Activity Logs Guide -->
          <v-expansion-panel value="logs-guide" class="rounded-xl mb-3 border">
            <v-expansion-panel-title class="py-4">
              <div class="d-flex align-center ga-3">
                <v-avatar color="info" size="36" class="text-white">
                  <v-icon size="20">mdi-history</v-icon>
                </v-avatar>
                <div>
                  <div class="text-subtitle-1 font-weight-bold">3. Activity Logs Guide</div>
                  <div class="text-caption text-medium-emphasis">Audit Trail Tracking, Data Diffs & Automatic Log Retention</div>
                </div>
              </div>
            </v-expansion-panel-title>
            <v-expansion-panel-text class="pt-2">
              <div class="text-body-2 mb-4">
                The <strong>Activity Logs</strong> tab provides an immutable audit trail of all data updates, user changes, reports submissions, and schedule assignments.
              </div>

              <v-card variant="outlined" class="pa-4 mb-4 rounded-lg">
                <div class="text-subtitle-2 font-weight-bold text-info mb-1">
                  <v-icon size="small" class="mr-1">mdi-format-list-checks</v-icon> Logged Events & Actions
                </div>
                <ul class="text-body-2 pl-5">
                  <li><strong>User Lifecycle:</strong> Creation, role updates, and deletions of user accounts.</li>
                  <li><strong>Congregation & Settings:</strong> Name updates, meeting time changes, and brother appointment adjustments.</li>
                  <li><strong>Reports & Attendance:</strong> Monthly report submissions, attendance recording, and month closing.</li>
                  <li><strong>Schedules & Rosters:</strong> Public talk changes, OCLM weekly rosters, cleaning and sound duties.</li>
                </ul>
              </v-card>

              <v-card variant="outlined" class="pa-4 mb-4 rounded-lg">
                <div class="text-subtitle-2 font-weight-bold text-info mb-1">
                  <v-icon size="small" class="mr-1">mdi-compare-horizontal</v-icon> Inspecting Data Diffs (Previous vs New)
                </div>
                <p class="text-body-2 mb-2">
                  Click on any row in the Activity Logs table to open the <em>Activity Log Details</em> dialog:
                </p>
                <ul class="text-body-2 pl-5">
                  <li>Displays the user who initiated the change and the exact timestamp.</li>
                  <li>If data was modified, a side-by-side comparison table highlights the exact field, the <strong>Previous Value</strong> (in red), and the <strong>Updated Value</strong> (in green).</li>
                </ul>
              </v-card>

              <v-card variant="outlined" class="pa-4 rounded-lg">
                <div class="text-subtitle-2 font-weight-bold text-info mb-1">
                  <v-icon size="small" class="mr-1">mdi-delete-clock-outline</v-icon> Retention & Filtering
                </div>
                <ul class="text-body-2 pl-5">
                  <li><strong>Month & Year Filter:</strong> Use the dropdown selectors to view logs for specific reporting periods.</li>
                  <li><strong>Automatic 2-Month Cleanup:</strong> To ensure high responsiveness and keep Firestore database storage optimized, activity log records older than 60 days (2 months) are automatically purged in the background when an admin visits the settings page.</li>
                </ul>
              </v-card>
            </v-expansion-panel-text>
          </v-expansion-panel>

          <!-- 4. Theme Customization Guide -->
          <v-expansion-panel value="theme-guide" class="rounded-xl mb-3 border">
            <v-expansion-panel-title class="py-4">
              <div class="d-flex align-center ga-3">
                <v-avatar color="warning" size="36" class="text-white">
                  <v-icon size="20">mdi-palette-outline</v-icon>
                </v-avatar>
                <div>
                  <div class="text-subtitle-1 font-weight-bold">4. Theme Customization Guide</div>
                  <div class="text-caption text-medium-emphasis">Configuring Day & Night Palettes: Text, Sub-Texts, Accent & Background</div>
                </div>
              </div>
            </v-expansion-panel-title>
            <v-expansion-panel-text class="pt-2">
              <div class="text-body-2 mb-4">
                The <strong>Theme</strong> tab enables full customization of the site appearance for both Day (Light) and Night (Dark) modes.
              </div>

              <v-card variant="outlined" class="pa-4 mb-4 rounded-lg">
                <div class="text-subtitle-2 font-weight-bold text-warning mb-1">
                  <v-icon size="small" class="mr-1">mdi-format-paint</v-icon> Configurable Palette Elements
                </div>
                <ul class="text-body-2 pl-5">
                  <li><strong>Text (Main Content):</strong> Color of titles, headings, table contents, and primary text across cards.</li>
                  <li><strong>Sub-Texts (Secondary & Muted):</strong> Color applied to subtitles, captions, metadata tags, hints, and muted descriptors.</li>
                  <li><strong>Accent:</strong> Vibrant tone used for badges, highlight chips, focus outlines, and notifications.</li>
                  <li><strong>Background:</strong> Backdrop color for the overall application canvas.</li>
                  <li><strong>Surface:</strong> The fill color for cards, sheets, dialogs, drawers, and popups.</li>
                  <li><strong>Primary & Secondary:</strong> Brand gradient colors, main action buttons, and active menu indicators.</li>
                </ul>
              </v-card>

              <v-card variant="outlined" class="pa-4 rounded-lg">
                <div class="text-subtitle-2 font-weight-bold text-warning mb-1">
                  <v-icon size="small" class="mr-1">mdi-eye-outline</v-icon> Live Preview & Persistence
                </div>
                <ul class="text-body-2 pl-5">
                  <li><strong>Dual Mode Configuration:</strong> Switch between the <em>Day (Light)</em> and <em>Night (Dark)</em> toggle buttons at the top to configure each theme profile independently.</li>
                  <li><strong>Interactive Live Preview:</strong> As you adjust colors, the live component preview instantly updates so you can verify readability and contrast before saving.</li>
                  <li><strong>Cloud Synchronization:</strong> Clicking <strong>Save Theme Settings</strong> persists the palette to Cloud Firestore and local storage, ensuring your chosen styling is consistently displayed.</li>
                  <li><strong>Reset Options:</strong> You can reset the active mode or all themes back to factory defaults at any time using the reset buttons.</li>
                </ul>
              </v-card>
            </v-expansion-panel-text>
          </v-expansion-panel>

          <!-- 5. RBAC Reference Table -->
          <v-expansion-panel value="rbac-matrix" class="rounded-xl border">
            <v-expansion-panel-title class="py-4">
              <div class="d-flex align-center ga-3">
                <v-avatar color="success" size="36" class="text-white">
                  <v-icon size="20">mdi-shield-account-outline</v-icon>
                </v-avatar>
                <div>
                  <div class="text-subtitle-1 font-weight-bold">5. Role-Based Access Control (RBAC) Matrix</div>
                  <div class="text-caption text-medium-emphasis">Summary of Permissions Across Modules</div>
                </div>
              </div>
            </v-expansion-panel-title>
            <v-expansion-panel-text class="pt-2">
              <v-table density="comfortable" class="border rounded-lg">
                <thead>
                  <tr class="bg-grey-lighten-4">
                    <th class="font-weight-bold">Module / Section</th>
                    <th class="font-weight-bold text-center">Admin</th>
                    <th class="font-weight-bold text-center">Editor (Elder)</th>
                    <th class="font-weight-bold text-center">Editor (MS)</th>
                    <th class="font-weight-bold text-center">Publisher</th>
                    <th class="font-weight-bold text-center">Service Overseer</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Home Dashboard</strong></td>
                    <td class="text-center text-success"><v-icon color="success">mdi-check-circle</v-icon></td>
                    <td class="text-center text-success"><v-icon color="success">mdi-check-circle</v-icon></td>
                    <td class="text-center text-grey"><v-icon color="grey-lighten-1">mdi-minus-circle</v-icon></td>
                    <td class="text-center text-grey"><v-icon color="grey-lighten-1">mdi-minus-circle</v-icon></td>
                    <td class="text-center text-success"><v-icon color="success">mdi-check-circle</v-icon></td>
                  </tr>
                  <tr>
                    <td><strong>Congregation Database</strong></td>
                    <td class="text-center text-success"><v-icon color="success">mdi-check-circle</v-icon></td>
                    <td class="text-center text-success"><v-icon color="success">mdi-check-circle</v-icon></td>
                    <td class="text-center text-grey"><v-icon color="grey-lighten-1">mdi-minus-circle</v-icon></td>
                    <td class="text-center text-grey"><v-icon color="grey-lighten-1">mdi-minus-circle</v-icon></td>
                    <td class="text-center text-success"><v-icon color="success">mdi-check-circle</v-icon></td>
                  </tr>
                  <tr>
                    <td><strong>Reports & Attendance</strong></td>
                    <td class="text-center text-success"><v-icon color="success">mdi-check-circle</v-icon></td>
                    <td class="text-center text-success"><v-icon color="success">mdi-check-circle</v-icon></td>
                    <td class="text-center text-success"><v-icon color="success">mdi-check-circle</v-icon></td>
                    <td class="text-center text-success"><v-icon color="success">mdi-check-circle</v-icon></td>
                    <td class="text-center text-success"><v-icon color="success">mdi-check-circle</v-icon></td>
                  </tr>
                  <tr>
                    <td><strong>Publisher S-21 Cards</strong></td>
                    <td class="text-center text-success"><v-icon color="success">mdi-check-circle</v-icon></td>
                    <td class="text-center text-success"><v-icon color="success">mdi-check-circle</v-icon></td>
                    <td class="text-center text-success"><v-icon color="success">mdi-check-circle</v-icon></td>
                    <td class="text-center text-grey"><v-icon color="grey-lighten-1">mdi-minus-circle</v-icon></td>
                    <td class="text-center text-success"><v-icon color="success">mdi-check-circle</v-icon></td>
                  </tr>
                  <tr>
                    <td><strong>Service Year Analysis</strong></td>
                    <td class="text-center text-success"><v-icon color="success">mdi-check-circle</v-icon></td>
                    <td class="text-center text-grey"><v-icon color="grey-lighten-1">mdi-minus-circle</v-icon></td>
                    <td class="text-center text-grey"><v-icon color="grey-lighten-1">mdi-minus-circle</v-icon></td>
                    <td class="text-center text-grey"><v-icon color="grey-lighten-1">mdi-minus-circle</v-icon></td>
                    <td class="text-center text-success"><v-icon color="success">mdi-check-circle</v-icon></td>
                  </tr>
                  <tr>
                    <td><strong>Schedules (Talks, OCLM, Clean, Sound)</strong></td>
                    <td class="text-center text-success"><v-icon color="success">mdi-check-circle</v-icon></td>
                    <td class="text-center text-success"><v-icon color="success">mdi-check-circle</v-icon></td>
                    <td class="text-center text-success"><v-icon color="success">mdi-check-circle</v-icon></td>
                    <td class="text-center text-grey"><v-icon color="grey-lighten-1">mdi-minus-circle</v-icon></td>
                    <td class="text-center text-success"><v-icon color="success">mdi-check-circle</v-icon></td>
                  </tr>
                  <tr>
                    <td><strong>Territory Management (S-13)</strong></td>
                    <td class="text-center text-success"><v-icon color="success">mdi-check-circle</v-icon></td>
                    <td class="text-center text-success"><v-icon color="success">mdi-check-circle</v-icon></td>
                    <td class="text-center text-success"><v-icon color="success">mdi-check-circle</v-icon></td>
                    <td class="text-center text-grey"><v-icon color="grey-lighten-1">mdi-minus-circle</v-icon></td>
                    <td class="text-center text-success"><v-icon color="success">mdi-check-circle</v-icon></td>
                  </tr>
                  <tr>
                    <td><strong>Settings & Management</strong></td>
                    <td class="text-center text-success"><v-icon color="success">mdi-check-circle</v-icon></td>
                    <td class="text-center text-grey"><v-icon color="grey-lighten-1">mdi-minus-circle</v-icon></td>
                    <td class="text-center text-grey"><v-icon color="grey-lighten-1">mdi-minus-circle</v-icon></td>
                    <td class="text-center text-grey"><v-icon color="grey-lighten-1">mdi-minus-circle</v-icon></td>
                    <td class="text-center text-grey"><v-icon color="grey-lighten-1">mdi-minus-circle</v-icon></td>
                  </tr>
                </tbody>
              </v-table>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-window-item>
    </v-window>

    <!-- User Dialogs -->
    <v-dialog v-model="showUserDialog" max-width="650px">
      <v-card class="rounded-xl overflow-hidden">
        <v-card-title class="bg-primary text-white pa-4">
          {{ isEditingUser ? 'Edit User' : 'Add New User' }}
        </v-card-title>
        <v-card-text class="pa-4">
          <v-form ref="userFormRef" v-model="isUserFormValid" @submit.prevent="saveUser">
            <v-text-field v-model="userForm.displayName" label="Full Name" variant="outlined" :rules="[v => !!v || 'Name is required']" class="mb-4" />
            <v-text-field v-model="userForm.email" label="Email (Google Account)" variant="outlined" type="email" :rules="[v => !!v || 'Email is required']" :disabled="isEditingUser" class="mb-4" />
            <v-select v-model="userForm.role" :items="appRoles" label="Access Level" variant="outlined" class="mb-4" />
            <v-select v-model="userForm.spiritualRole" :items="spiritualRoles" label="Spiritual Role" variant="outlined" class="mb-4" />
            <v-select v-model="userForm.groupId" :items="groups" item-title="name" item-value="id" label="Assigned Group" variant="outlined" clearable hint="Restricts MS/Publishers to only see reports and records for their group" persistent-hint />
          </v-form>
        </v-card-text>
        <v-card-actions class="pa-4 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="showUserDialog = false">Cancel</v-btn>
          <v-btn color="primary" variant="flat" @click="saveUser" :loading="savingUser" :disabled="!isUserFormValid">
            {{ isEditingUser ? 'Update' : 'Add' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Activity Log Details Dialog -->
    <v-dialog v-model="showLogDetailDialog" max-width="700px" scrollable>
      <v-card v-if="selectedLog" class="rounded-xl overflow-hidden">
        <v-card-title class="d-flex align-center bg-primary text-white py-3 px-4">
          <v-icon class="mr-2" color="white">mdi-text-box-search-outline</v-icon>
          <span class="text-h6 font-weight-bold">Activity Log Details</span>
          <v-spacer />
          <v-btn icon="mdi-close" variant="text" size="small" color="white" @click="showLogDetailDialog = false" />
        </v-card-title>

        <v-divider />

        <v-card-text style="max-height: 75vh;" class="pa-4">
          <!-- Action & Meta Info Header Card -->
          <v-card variant="tonal" color="primary" class="pa-4 mb-4 rounded-lg">
            <div class="d-flex align-center justify-space-between flex-wrap ga-2 mb-2">
              <v-chip :color="getActionColor(selectedLog.action)" variant="flat" size="small" class="font-weight-bold">
                {{ selectedLog.action }}
              </v-chip>
              <span class="text-caption text-medium-emphasis">
                <v-icon size="small" class="mr-1">mdi-clock-outline</v-icon>
                {{ formatLogTime(selectedLog.timestamp) }}
              </span>
            </div>
            <div class="text-body-1 font-weight-medium mb-1">{{ selectedLog.details }}</div>
            <div class="d-flex align-center ga-4 text-caption text-medium-emphasis flex-wrap mt-2">
              <div><strong>User:</strong> {{ selectedLog.userName || 'Unknown' }}</div>
              <div v-if="selectedLog.month !== null && selectedLog.month !== undefined && months[selectedLog.month]">
                <strong>Period:</strong> {{ months[selectedLog.month]?.name }} {{ selectedLog.year }}
              </div>
            </div>
          </v-card>

          <!-- Structured Comparison (Previous vs New Data) -->
          <div v-if="hasLogData(selectedLog)">
            <div class="text-subtitle-2 font-weight-bold mb-3 d-flex align-center">
              <v-icon size="small" color="primary" class="mr-2">mdi-compare-horizontal</v-icon>
              Data Changes Comparison
            </div>

            <!-- Comparison Grid if both Previous and New Data exist -->
            <v-row v-if="selectedLog.previousData && selectedLog.newData">
              <v-col cols="12">
                <v-table density="compact" class="border rounded-lg">
                  <thead>
                    <tr class="bg-grey-lighten-4">
                      <th class="font-weight-bold">Field</th>
                      <th class="font-weight-bold text-error">Previous Value</th>
                      <th class="font-weight-bold text-success">Updated / Current Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="field in getComparisonFields(selectedLog.previousData, selectedLog.newData)" :key="field.key">
                      <td class="font-weight-medium text-caption">{{ field.label }}</td>
                      <td class="text-caption bg-red-lighten-5 text-error">
                        {{ formatValue(field.oldVal) }}
                      </td>
                      <td class="text-caption bg-green-lighten-5 text-success font-weight-bold">
                        {{ formatValue(field.newVal) }}
                      </td>
                    </tr>
                  </tbody>
                </v-table>
              </v-col>
            </v-row>

            <!-- Single Data Object Display (New Data only - e.g. Creation) -->
            <v-row v-else-if="selectedLog.newData">
              <v-col cols="12">
                <div class="text-caption font-weight-bold text-success mb-2">Current / Created Data:</div>
                <v-table density="compact" class="border rounded-lg">
                  <thead>
                    <tr class="bg-green-lighten-5">
                      <th class="font-weight-bold text-success">Field</th>
                      <th class="font-weight-bold text-success">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(val, key) in filterDisplayData(selectedLog.newData)" :key="key">
                      <td class="font-weight-medium text-caption">{{ formatFieldLabel(key) }}</td>
                      <td class="text-caption font-weight-medium">{{ formatValue(val) }}</td>
                    </tr>
                  </tbody>
                </v-table>
              </v-col>
            </v-row>

            <!-- Single Data Object Display (Previous Data only - e.g. Deletion) -->
            <v-row v-else-if="selectedLog.previousData">
              <v-col cols="12">
                <div class="text-caption font-weight-bold text-error mb-2">Deleted Data:</div>
                <v-table density="compact" class="border rounded-lg">
                  <thead>
                    <tr class="bg-red-lighten-5">
                      <th class="font-weight-bold text-error">Field</th>
                      <th class="font-weight-bold text-error">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(val, key) in filterDisplayData(selectedLog.previousData)" :key="key">
                      <td class="font-weight-medium text-caption">{{ formatFieldLabel(key) }}</td>
                      <td class="text-caption font-weight-medium text-error">{{ formatValue(val) }}</td>
                    </tr>
                  </tbody>
                </v-table>
              </v-col>
            </v-row>
          </div>

          <div v-else class="text-center pa-6 text-medium-emphasis border rounded-lg bg-grey-lighten-4">
            <v-icon size="36" color="grey" class="mb-2">mdi-information-outline</v-icon>
            <div>No item-level data payload recorded for this activity entry.</div>
          </div>
        </v-card-text>

        <v-divider />

        <v-card-actions class="pa-3">
          <v-spacer />
          <v-btn color="primary" variant="flat" class="px-6" @click="showLogDetailDialog = false">
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useTheme } from 'vuetify'
import { collection, getDocs, doc, getDoc, setDoc, deleteDoc, serverTimestamp, query, where } from 'firebase/firestore'
import { db } from '@/config/firebase'
import { useAuthStore } from '@/stores/auth'

import { logActivity } from '@/utils/logging'
import {
  DEFAULT_THEME,
  getSavedTheme,
  applyTheme,
  fetchRemoteTheme,
  saveRemoteTheme
} from '@/utils/theme'

const authStore = useAuthStore()
const activeTab = ref('congregation')

// --- CONGREGATION SETTINGS LOGIC ---
const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const settings = ref({ congregationName: '', midweekMeetingDay: 'Thursday', midweekMeetingTime: '18:30', weekendMeetingTime: '10:30' })
const loadingSettings = ref(true)
const savingSettings = ref(false)
const settingsError = ref(null)
const settingsSuccessMsg = ref(null)

const loadSettings = async () => {
  loadingSettings.value = true
  try {
    const snap = await getDoc(doc(db, 'settings', 'meetings'))
    if (snap.exists()) settings.value = { ...settings.value, ...snap.data() }
    if (!settings.value.congregationName) {
      const congSnap = await getDoc(doc(db, 'settings', 'congregation'))
      if (congSnap.exists() && congSnap.data().congregationName) {
        settings.value.congregationName = congSnap.data().congregationName
      }
    }
    if (settings.value.congregationName && authStore.setCongregationName) {
      authStore.setCongregationName(settings.value.congregationName)
    }
  } catch (err) { settingsError.value = 'Failed to load congregation settings.' }
  finally { loadingSettings.value = false }
}

const saveSettings = async () => {
  savingSettings.value = true
  settingsSuccessMsg.value = null
  try {
    const oldSettings = { ...settings.value }
    await setDoc(doc(db, 'settings', 'meetings'), settings.value)
    await setDoc(doc(db, 'settings', 'congregation'), { congregationName: settings.value.congregationName || '' }, { merge: true })
    if (authStore.setCongregationName) {
      authStore.setCongregationName(settings.value.congregationName || '')
    }
    await logActivity(authStore, 'Settings Updated', 'Updated Congregation Settings', null, null, oldSettings, settings.value)
    settingsSuccessMsg.value = 'Congregation settings updated successfully.'
  } catch (err) { settingsError.value = 'Failed to save settings.' }
  finally { savingSettings.value = false }
}

// --- CONGREGATION APPOINTMENTS LOGIC ---
const congSettings = ref({
  coordinator: '', coordinatorUid: null,
  secretary: '', secretaryUid: null,
  serviceOverseer: '', serviceOverseerUid: null,
  accountsServant: '', accountsServantUid: null,
  territoryServant: '', territoryServantUid: null,
  territoryAssistant: '', territoryAssistantUid: null,
  attendants: []
})
const publishers = ref([])
const loadingCong = ref(true)
const savingCong = ref(false)
const congError = ref(null)
const congSuccessMsg = ref(null)

const brothersSortedByFamily = computed(() => {
  return [...publishers.value]
    .filter(p => p.gender === 'Male' && p.status !== 'Inactive' && p.role !== 'Inactive Publisher' && p.role !== 'Un-Baptized Publisher' && p.role !== 'Removed')
    .sort((a, b) => {
      const familyA = (a.family || '').toLowerCase()
      const familyB = (b.family || '').toLowerCase()
      if (familyA !== familyB) return familyA.localeCompare(familyB)
      return (a.name || '').localeCompare(b.name || '')
    })
    .map(p => ({
      id: p.id,
      name: p.name,
      displayLabel: p.family ? `${p.name} (${p.family})` : p.name
    }))
})

const loadCongSettings = async () => {
  loadingCong.value = true
  try {
    const snap = await getDoc(doc(db, 'settings', 'congregation'))
    if (snap.exists()) congSettings.value = { ...congSettings.value, ...snap.data() }

    if (publishers.value.length === 0) {
      const pubSnap = await getDocs(collection(db, 'publishers'))
      publishers.value = pubSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    }
  } catch (err) { congError.value = 'Failed to load congregation settings.' }
  finally { loadingCong.value = false }
}

const saveCongSettings = async () => {
  savingCong.value = true
  congSuccessMsg.value = null
  try {
    const oldCong = { ...congSettings.value }
    await setDoc(doc(db, 'settings', 'congregation'), congSettings.value, { merge: true })
    await logActivity(authStore, 'Appointments Updated', 'Updated Congregation Appointments', null, null, oldCong, congSettings.value)
    congSuccessMsg.value = 'Appointments updated successfully.'
  } catch (err) { congError.value = 'Failed to save appointments.' }
  finally { savingCong.value = false }
}

const eldersList = computed(() => users.value.filter(u => u.spiritualRole === 'Elder'))
const allQualifiedList = computed(() => users.value.filter(u => ['Elder', 'Ministerial Servant', 'Publisher'].includes(u.spiritualRole)))

const updateName = (field) => {
  const uid = congSettings.value[`${field}Uid`]
  const user = users.value.find(u => u.uid === uid)
  if (user) {
    congSettings.value[field] = user.displayName
  } else {
    congSettings.value[field] = ''
  }
}

// --- MANAGE USERS LOGIC ---
const users = ref([])
const selectedUsers = ref([])
const loadingUsers = ref(true)
const usersError = ref(null)
const usersSuccessMsg = ref(null)
const showUserDialog = ref(false)
const isEditingUser = ref(false)
const savingUser = ref(false)
const groups = ref([])
const userFormRef = ref(null)
const isUserFormValid = ref(false)
const userForm = ref({ id: null, displayName: '', email: '', role: 'editor', spiritualRole: 'Publisher', groupId: null })

const appRoles = [
  { title: 'Admin (Full Access)', value: 'admin' },
  { title: 'Editor (Standard)', value: 'editor' },
  { title: 'Viewer (Read Only)', value: 'viewer' }
]
const spiritualRoles = ['Elder', 'Ministerial Servant', 'Publisher']
const userHeaders = [
  { title: 'User', key: 'displayName', align: 'start' },
  { title: 'Email', key: 'email' },
  { title: 'Access', key: 'role' },
  { title: 'Group', key: 'groupName' },
  { title: 'Spiritual Role', key: 'spiritualRole' },
  { title: 'Status', key: 'status' }
]

const loadUsers = async () => {
  loadingUsers.value = true
  try {
    const groupsSnap = await getDocs(collection(db, 'groups'))
    groups.value = groupsSnap.docs.map(doc => ({ id: doc.id, name: doc.data().name }))

    const snap = await getDocs(collection(db, 'users'))
    users.value = snap.docs.map(d => {
      const data = d.data()
      const groupName = groups.value.find(g => g.id === data.groupId)?.name || null
      return { id: d.id, groupName, ...data }
    })

    if (publishers.value.length === 0) {
      const pubSnap = await getDocs(collection(db, 'publishers'))
      publishers.value = pubSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    }
  } catch (err) { 
    console.error(err)
    usersError.value = 'Failed to load users.' 
  }
  finally { loadingUsers.value = false }
}

const openAddUserDialog = () => {
  isEditingUser.value = false
  userForm.value = { id: null, displayName: '', email: '', role: 'editor', spiritualRole: 'Publisher' }
  showUserDialog.value = true
}

const handleUserRowClick = (e, { item }) => {
  isEditingUser.value = true
  userForm.value = { ...item }
  showUserDialog.value = true
}

const saveUser = async () => {
  savingUser.value = true
  try {
    const emailLower = userForm.value.email.toLowerCase().trim()
    const docId = userForm.value.id || `user_${Date.now()}`
    const userData = { ...userForm.value, email: emailLower }
    const oldUserData = isEditingUser.value ? users.value.find(u => u.id === userForm.value.id) : null
    delete userData.id
    if (!userForm.value.id) userData.createdAt = serverTimestamp()
    
    await setDoc(doc(db, 'users', docId), userData, { merge: true })
    const actionName = userForm.value.id ? 'User Updated' : 'User Created'
    await logActivity(authStore, actionName, `${actionName}: ${userForm.value.displayName} (${userForm.value.email})`, null, null, oldUserData, userData)
    
    usersSuccessMsg.value = userForm.value.id ? 'User updated.' : 'User added.'
    showUserDialog.value = false
    await loadUsers()
  } catch (err) { usersError.value = 'Failed to save user.' }
  finally { savingUser.value = false }
}

const deleteSelectedUsers = async () => {
  if (!confirm('Delete selected users?')) return
  try {
    const promises = selectedUsers.value.map(id => deleteDoc(doc(db, 'users', id)))
    await Promise.all(promises)
    await logActivity(authStore, 'Users Deleted', `Deleted ${selectedUsers.value.length} users`, null, null, { deletedUserIds: selectedUsers.value }, null)
    selectedUsers.value = []
    await loadUsers()
  } catch (err) { usersError.value = 'Failed to delete users.' }
}

const getRoleColor = (r) => r === 'admin' ? 'deep-purple' : (r === 'editor' ? 'info' : 'grey')
const getSpiritualRoleColor = (r) => r === 'Elder' ? 'purple-darken-1' : (r === 'Ministerial Servant' ? 'blue-darken-1' : 'grey')

// --- ACTIVITY LOGS LOGIC ---
const logs = ref([])
const loadingLogs = ref(false)
const showLogDetailDialog = ref(false)
const selectedLog = ref(null)

const currentDate = new Date()
const logMonth = ref(currentDate.getMonth())
const logYear = ref(currentDate.getFullYear())

const months = [
  { name: 'January', value: 0 }, { name: 'February', value: 1 }, { name: 'March', value: 2 },
  { name: 'April', value: 3 }, { name: 'May', value: 4 }, { name: 'June', value: 5 },
  { name: 'July', value: 6 }, { name: 'August', value: 7 }, { name: 'September', value: 8 },
  { name: 'October', value: 9 }, { name: 'November', value: 10 }, { name: 'December', value: 11 }
]
const years = Array.from({ length: 12 }, (_, i) => 2024 + i)

const logHeaders = [
  { title: 'Date/Time', key: 'timestamp', align: 'start' },
  { title: 'User', key: 'userName' },
  { title: 'Action', key: 'action' },
  { title: 'Details', key: 'details' }
]

const openLogDetailDialog = (event, { item }) => {
  selectedLog.value = item
  showLogDetailDialog.value = true
}

const formatLogTime = (timestamp) => {
  if (!timestamp) return '-'
  if (typeof timestamp.toDate === 'function') {
    return timestamp.toDate().toLocaleString()
  }
  if (timestamp.seconds) {
    return new Date(timestamp.seconds * 1000).toLocaleString()
  }
  return String(timestamp)
}

const hasLogData = (log) => {
  return (log.previousData && Object.keys(log.previousData).length > 0) ||
         (log.newData && Object.keys(log.newData).length > 0)
}

const filterDisplayData = (dataObj) => {
  if (!dataObj || typeof dataObj !== 'object') return {}
  const ignoredKeys = ['id', 'docId', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy']
  const clean = {}
  Object.keys(dataObj).forEach(k => {
    if (!ignoredKeys.includes(k) && dataObj[k] !== null && dataObj[k] !== undefined) {
      clean[k] = dataObj[k]
    }
  })
  return clean
}

const formatFieldLabel = (key) => {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
}

const formatValue = (val) => {
  if (val === null || val === undefined) return '-'
  if (typeof val === 'boolean') return val ? 'Yes' : 'No'
  if (typeof val === 'object') return JSON.stringify(val)
  return String(val)
}

const getComparisonFields = (prevObj, newObj) => {
  const cleanPrev = filterDisplayData(prevObj)
  const cleanNew = filterDisplayData(newObj)
  
  const allKeys = new Set([...Object.keys(cleanPrev), ...Object.keys(cleanNew)])
  const result = []
  
  allKeys.forEach(k => {
    const oldVal = cleanPrev[k]
    const newVal = cleanNew[k]
    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      result.push({
        key: k,
        label: formatFieldLabel(k),
        oldVal,
        newVal
      })
    }
  })
  
  if (result.length === 0) {
    allKeys.forEach(k => {
      result.push({
        key: k,
        label: formatFieldLabel(k),
        oldVal: cleanPrev[k],
        newVal: cleanNew[k]
      })
    })
  }
  
  return result
}

const loadLogs = async () => {
  loadingLogs.value = true
  try {
    const snap = await getDocs(collection(db, 'logs'))
    let fetchedLogs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    
    if (logMonth.value !== null) {
      fetchedLogs = fetchedLogs.filter(l => l.month === logMonth.value)
    }
    if (logYear.value !== null) {
      fetchedLogs = fetchedLogs.filter(l => l.year === logYear.value)
    }
    
    logs.value = fetchedLogs.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0))
  } catch (err) {
    console.error('Error loading logs:', err)
  } finally {
    loadingLogs.value = false
  }
}

const cleanupOldLogs = async () => {
  if (!authStore.isAdmin) return
  try {
    const twoMonthsAgo = new Date()
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2)
    
    const oldLogsQuery = query(
      collection(db, 'logs'),
      where('timestamp', '<', twoMonthsAgo)
    )
    
    const snap = await getDocs(oldLogsQuery)
    if (snap.empty) return
    
    const promises = snap.docs.map(d => deleteDoc(doc(db, 'logs', d.id)))
    await Promise.all(promises)
    console.log(`Cleaned up ${snap.size} old logs`)
  } catch (err) {
    console.error('Error cleaning up old logs:', err)
  }
}

const getActionColor = (action) => {
  if (action.includes('Created') || action.includes('Added')) return 'success'
  if (action.includes('Updated')) return 'info'
  if (action.includes('Deleted')) return 'error'
  if (action.includes('Closed')) return 'warning'
  return 'primary'
}

// --- THEME CUSTOMIZATION LOGIC ---
const vuetifyTheme = useTheme()
const selectedThemeMode = ref('light')
const themeConfig = ref(getSavedTheme())
const savingTheme = ref(false)
const themeSuccessMsg = ref(null)
const themeErrorMsg = ref(null)

const colorConfigItems = [
  { key: 'text', label: 'Text (Main Content)', description: 'Primary readable content, headings, card titles, and table values.' },
  { key: 'subtext', label: 'Sub-Texts (Secondary & Muted)', description: 'Captions, subtitles, descriptions, and medium emphasis text.' },
  { key: 'accent', label: 'Accent (Highlights & Tags)', description: 'Badges, alert tags, status highlights, and focus elements.' },
  { key: 'background', label: 'Background (Page Canvas)', description: 'Overall backdrop behind application containers and content.' },
  { key: 'surface', label: 'Surface (Cards & Dialogs)', description: 'Background of elevated cards, dialog modals, and panels.' },
  { key: 'primary', label: 'Primary (Brand Color)', description: 'Main application buttons, active tab indicators, and app bar badge.' },
  { key: 'secondary', label: 'Secondary (Complementary)', description: 'Supporting actions, sub-headings, and gradient accents.' }
]

const themePresets = [
  {
    name: 'Modern Indigo (Default)',
    light: {
      primary: '#6366F1',
      secondary: '#8B5CF6',
      accent: '#F59E0B',
      background: '#F0F2F5',
      surface: '#FFFFFF',
      text: '#1E293B',
      subtext: '#64748B'
    },
    dark: {
      primary: '#818CF8',
      secondary: '#A78BFA',
      accent: '#FBBF24',
      background: '#0F0D1A',
      surface: '#1E1B2E',
      text: '#E2E8F0',
      subtext: '#94A3B8'
    }
  },
  {
    name: 'Emerald Green',
    light: {
      primary: '#0D9488',
      secondary: '#059669',
      accent: '#EAB308',
      background: '#F0FDF4',
      surface: '#FFFFFF',
      text: '#0F172A',
      subtext: '#475569'
    },
    dark: {
      primary: '#2DD4BF',
      secondary: '#34D399',
      accent: '#FACC15',
      background: '#061A14',
      surface: '#0E2E24',
      text: '#F1F5F9',
      subtext: '#94A3B8'
    }
  },
  {
    name: 'Ocean Blue',
    light: {
      primary: '#2563EB',
      secondary: '#3B82F6',
      accent: '#F97316',
      background: '#F8FAFC',
      surface: '#FFFFFF',
      text: '#1E293B',
      subtext: '#64748B'
    },
    dark: {
      primary: '#3B82F6',
      secondary: '#60A5FA',
      accent: '#FB923C',
      background: '#0B1120',
      surface: '#1E293B',
      text: '#F8FAFC',
      subtext: '#94A3B8'
    }
  },
  {
    name: 'Royal Violet',
    light: {
      primary: '#7C3AED',
      secondary: '#9333EA',
      accent: '#EC4899',
      background: '#FAF5FF',
      surface: '#FFFFFF',
      text: '#1F2937',
      subtext: '#6B7280'
    },
    dark: {
      primary: '#A78BFA',
      secondary: '#C084FC',
      accent: '#F472B6',
      background: '#150A26',
      surface: '#24143D',
      text: '#F9FAFB',
      subtext: '#9CA3AF'
    }
  }
]

const activeThemeColors = computed(() => {
  return themeConfig.value[selectedThemeMode.value]
})

const onColorChange = () => {
  applyTheme(vuetifyTheme, themeConfig.value)
}

const toggleSiteThemeMode = () => {
  vuetifyTheme.global.name.value = vuetifyTheme.global.current.value.dark ? 'light' : 'dark'
  localStorage.setItem('theme', vuetifyTheme.global.name.value)
}

const applyPreset = (preset) => {
  if (preset[selectedThemeMode.value]) {
    themeConfig.value[selectedThemeMode.value] = {
      ...themeConfig.value[selectedThemeMode.value],
      ...preset[selectedThemeMode.value]
    }
    applyTheme(vuetifyTheme, themeConfig.value)
  }
}

const handleSaveTheme = async () => {
  savingTheme.value = true
  themeSuccessMsg.value = null
  themeErrorMsg.value = null
  try {
    applyTheme(vuetifyTheme, themeConfig.value)
    await saveRemoteTheme(themeConfig.value)
    await logActivity(authStore, 'Theme Updated', `Updated site theme settings (${selectedThemeMode.value} mode)`, null, null, null, themeConfig.value)
    themeSuccessMsg.value = 'Theme settings saved and applied congregation-wide.'
  } catch (err) {
    console.error('Error saving theme:', err)
    themeErrorMsg.value = 'Failed to save theme settings.'
  } finally {
    savingTheme.value = false
  }
}

const handleResetCurrentMode = () => {
  themeConfig.value[selectedThemeMode.value] = { ...DEFAULT_THEME[selectedThemeMode.value] }
  applyTheme(vuetifyTheme, themeConfig.value)
}

const handleResetAllThemes = () => {
  themeConfig.value = {
    light: { ...DEFAULT_THEME.light },
    dark: { ...DEFAULT_THEME.dark }
  }
  applyTheme(vuetifyTheme, themeConfig.value)
}

// --- HELP TAB LOGIC ---
const openedHelpPanels = ref(['congregation-guide', 'users-guide', 'logs-guide', 'theme-guide', 'rbac-matrix'])

onMounted(async () => {
  loadSettings()
  loadCongSettings()
  loadUsers()
  loadLogs()
  cleanupOldLogs()
  const remoteTheme = await fetchRemoteTheme(vuetifyTheme)
  if (remoteTheme) {
    themeConfig.value = remoteTheme
  }
})
</script>

<style scoped>
.gap-3 { gap: 12px; }
.clickable-rows :deep(tbody tr) {
  cursor: pointer;
}

.about-hero-banner {
  background: linear-gradient(135deg, #6366F1, #8B5CF6);
}

.color-picker-input {
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  width: 36px;
  height: 36px;
  border: 2px solid rgba(128, 128, 128, 0.25);
  border-radius: 8px;
  background: none;
  cursor: pointer;
  padding: 0;
  overflow: hidden;
}

.color-picker-input::-webkit-color-swatch-wrapper {
  padding: 0;
}

.color-picker-input::-webkit-color-swatch {
  border: none;
  border-radius: 6px;
}
</style>
