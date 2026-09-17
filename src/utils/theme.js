import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '@/config/firebase'

export const DEFAULT_THEME = {
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
}

const STORAGE_KEY = 'cong_custom_theme_config'

export function getSavedTheme() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      return {
        light: { ...DEFAULT_THEME.light, ...(parsed.light || {}) },
        dark: { ...DEFAULT_THEME.dark, ...(parsed.dark || {}) }
      }
    }
  } catch (e) {
    console.error('Error reading saved theme:', e)
  }
  return {
    light: { ...DEFAULT_THEME.light },
    dark: { ...DEFAULT_THEME.dark }
  }
}

export function saveThemeLocally(config) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
  } catch (e) {
    console.error('Error saving theme locally:', e)
  }
}

export function applyTheme(vuetifyTheme, config) {
  if (!vuetifyTheme || !config) return

  ['light', 'dark'].forEach((mode) => {
    const colors = config[mode]
    if (!colors) return
    const themeObj = vuetifyTheme.themes?.value?.[mode]
    if (!themeObj) return

    if (colors.primary) themeObj.colors.primary = colors.primary
    if (colors.secondary) themeObj.colors.secondary = colors.secondary
    if (colors.accent) themeObj.colors.accent = colors.accent
    if (colors.background) themeObj.colors.background = colors.background
    if (colors.surface) themeObj.colors.surface = colors.surface
    if (colors.text) {
      themeObj.colors['on-surface'] = colors.text
      themeObj.colors['on-background'] = colors.text
    }
    if (colors.subtext) {
      themeObj.colors['subtext'] = colors.subtext
    }
  })

  // Apply CSS custom properties for subtexts and text colors
  if (config.light?.subtext) {
    document.documentElement.style.setProperty('--app-subtext-light', config.light.subtext)
  }
  if (config.dark?.subtext) {
    document.documentElement.style.setProperty('--app-subtext-dark', config.dark.subtext)
  }
  if (config.light?.text) {
    document.documentElement.style.setProperty('--app-text-light', config.light.text)
  }
  if (config.dark?.text) {
    document.documentElement.style.setProperty('--app-text-dark', config.dark.text)
  }
  if (config.light?.background) {
    document.documentElement.style.setProperty('--app-bg-light', config.light.background)
  }
  if (config.dark?.background) {
    document.documentElement.style.setProperty('--app-bg-dark', config.dark.background)
  }
}

export async function fetchRemoteTheme(vuetifyTheme) {
  try {
    const snap = await getDoc(doc(db, 'settings', 'theme'))
    if (snap.exists()) {
      const data = snap.data()
      const merged = {
        light: { ...DEFAULT_THEME.light, ...(data.light || {}) },
        dark: { ...DEFAULT_THEME.dark, ...(data.dark || {}) }
      }
      saveThemeLocally(merged)
      if (vuetifyTheme) {
        applyTheme(vuetifyTheme, merged)
      }
      return merged
    }
  } catch (err) {
    console.error('Error fetching remote theme:', err)
  }
  return null
}

export async function saveRemoteTheme(config) {
  saveThemeLocally(config)
  await setDoc(doc(db, 'settings', 'theme'), config, { merge: true })
}
