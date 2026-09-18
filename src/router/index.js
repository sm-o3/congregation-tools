import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
    {
        path: '/login',
        name: 'Login',
        component: () => import('@/views/Login.vue'),
        meta: { requiresAuth: false }
    },
    {
        path: '/',
        name: 'Home',
        component: () => import('@/views/Home.vue'),
        meta: { requiresAuth: true, rbacCheck: 'canViewHome' }
    },
    {
        path: '/profile',
        name: 'Profile',
        component: () => import('@/views/Profile.vue'),
        meta: { requiresAuth: true }
    },
    // Admin routes
    {
        path: '/admin/settings',
        name: 'Settings',
        component: () => import('@/views/admin/Settings.vue'),
        meta: { requiresAuth: true, requiresAdmin: true }
    },
    // Congregation routes (formerly Database)
    {
        path: '/congregation/overview',
        name: 'CongregationOverview',
        component: () => import('@/views/database/Overview.vue'),
        meta: { requiresAuth: true, rbacCheck: 'canViewDatabase' }
    },
    { path: '/database/overview', redirect: '/congregation/overview' },
    {
        path: '/congregation/publishers',
        name: 'PublishersList',
        component: () => import('@/views/database/PublishersList.vue'),
        meta: { requiresAuth: true, rbacCheck: 'canViewPublishersList' }
    },
    { path: '/database/publishers', redirect: '/congregation/publishers' },
    {
        path: '/congregation/groups',
        name: 'Groups',
        component: () => import('@/views/database/Groups.vue'),
        meta: { requiresAuth: true, rbacCheck: 'canViewGroups' }
    },
    { path: '/database/groups', redirect: '/congregation/groups' },
    {
        path: '/congregation/groups-list',
        name: 'GroupsList',
        component: () => import('@/views/database/GroupsList.vue'),
        meta: { requiresAuth: true, rbacCheck: 'canViewDatabase' }
    },
    { path: '/database/groups-list', redirect: '/congregation/groups-list' },
    {
        path: '/congregation/emergency-contacts',
        name: 'EmergencyContacts',
        component: () => import('@/views/database/EmergencyContacts.vue'),
        meta: { requiresAuth: true, rbacCheck: 'canViewDatabase' }
    },
    { path: '/database/emergency-contacts', redirect: '/congregation/emergency-contacts' },
    // Reports routes
    {
        path: '/reports/overview',
        name: 'ReportsOverview',
        component: () => import('@/views/reports/Overview.vue'),
        meta: { requiresAuth: true, rbacCheck: 'canViewReports' }
    },
    {
        path: '/reports/add',
        name: 'AddReport',
        component: () => import('@/views/reports/AddReport.vue'),
        meta: { requiresAuth: true, rbacCheck: 'canViewReports' }
    },
    {
        path: '/reports/add-meeting-attendance',
        name: 'AddMeetingAttendance',
        component: () => import('@/views/reports/AddMeetingAttendance.vue'),
        meta: { requiresAuth: true, rbacCheck: 'canViewReports' }
    },
    {
        path: '/reports/list',
        name: 'ReportsList',
        component: () => import('@/views/reports/ReportsList.vue'),
        meta: { requiresAuth: true, rbacCheck: 'canViewReports' }
    },
    {
        path: '/reports/meeting-attendance-list',
        name: 'MeetingAttendanceList',
        component: () => import('@/views/reports/MeetingAttendanceList.vue'),
        meta: { requiresAuth: true, rbacCheck: 'canViewReports' }
    },
    {
        path: '/reports/publisher-record',
        name: 'PublisherRecord',
        component: () => import('@/views/reports/PublisherRecord.vue'),
        meta: { requiresAuth: true, rbacCheck: 'canViewPublisherRecord' }
    },
    {
        path: '/reports/analyze',
        name: 'ReportAnalyze',
        component: () => import('@/views/reports/ReportAnalyze.vue'),
        meta: { requiresAuth: true, rbacCheck: 'canViewReportAnalyze' }
    },
    { path: '/reports/rp-analyze', redirect: '/reports/analyze' },
    // Schedule routes
    {
        path: '/schedule/overview',
        name: 'ScheduleOverview',
        component: () => import('@/views/schedule/Overview.vue'),
        meta: { requiresAuth: true, rbacCheck: 'canViewSchedule' }
    },
    {
        path: '/schedule/public-talks',
        name: 'PublicTalks',
        component: () => import('@/views/schedule/PublicTalksMain.vue'),
        meta: { requiresAuth: true, rbacCheck: 'canViewSchedule' }
    },
    {
        path: '/schedule/s99',
        redirect: '/schedule/public-talks',
        meta: { requiresAuth: true, rbacCheck: 'canViewSchedule', requiresAdmin: true }
    },
    {
        path: '/schedule/oclm',
        name: 'OCLM',
        component: () => import('@/views/schedule/OCLM.vue'),
        meta: { requiresAuth: true, rbacCheck: 'canViewSchedule' }
    },
    {
        path: '/schedule/cleaning',
        name: 'Cleaning',
        component: () => import('@/views/schedule/CleaningMain.vue'),
        meta: { requiresAuth: true, rbacCheck: 'canViewSchedule' }
    },
    {
        path: '/schedule/sound',
        name: 'Sound',
        component: () => import('@/views/schedule/SoundMain.vue'),
        meta: { requiresAuth: true, rbacCheck: 'canViewSchedule' }
    },
    // Territory routes
    {
        path: '/territory/overview',
        name: 'TerritoryOverview',
        component: () => import('@/views/territory/Overview.vue'),
        meta: { requiresAuth: true, rbacCheck: 'canViewTerritoryOverview' }
    },
    {
        path: '/territory/list',
        name: 'TerritoryList',
        component: () => import('@/views/territory/TerritoryList.vue'),
        meta: { requiresAuth: true, rbacCheck: 'canViewTerritory' }
    },
    {
        path: '/territory/s13',
        name: 'S13',
        component: () => import('@/views/territory/S13.vue'),
        meta: { requiresAuth: true, rbacCheck: 'canViewTerritoryS13' }
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

// Navigation guard
router.beforeEach(async (to, from, next) => {
    const authStore = useAuthStore()

    // Wait for auth to finish loading
    if (authStore.loading) {
        // Wait for auth state to be determined
        await new Promise((resolve) => {
            const unwatch = authStore.$subscribe((mutation, state) => {
                if (!state.loading) {
                    unwatch()
                    resolve()
                }
            })
            // Also check immediately in case loading already finished
            if (!authStore.loading) {
                unwatch()
                resolve()
            }
        })
    }

    if (to.meta.requiresAuth) {
        if (!authStore.isAuthenticated) {
            next('/login')
        } else if (!authStore.hasAccess) {
            // User is authenticated but not authorized
            next('/login')
        } else if (to.meta.requiresAdmin && !authStore.isAdmin) {
            // Needs admin but user is not admin
            next('/') // Redirect to home or another safe page
        } else if (to.meta.rbacCheck && !authStore[to.meta.rbacCheck]) {
            // Check specific RBAC rules
            if (to.meta.rbacCheck === 'canViewHome' && !authStore.canViewHome) {
                if (authStore.canViewReports) next('/reports/overview')
                else next('/login')
            } else if (to.path.startsWith('/territory/') && authStore.canViewTerritory) {
                next('/territory/list')
            } else if (to.path.startsWith('/congregation/') && authStore.canViewDatabase) {
                next('/congregation/overview')
            } else {
                next('/')
            }
        } else {
            next()
        }
    } else {
        // Login page - redirect if already authenticated
        if (to.path === '/login' && authStore.isAuthenticated && authStore.hasAccess) {
            if (!authStore.canViewHome && authStore.canViewReports) {
                next('/reports/overview')
            } else {
                next('/')
            }
        } else {
            next()
        }
    }
})

export default router
