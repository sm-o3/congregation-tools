import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
    signInWithPopup,
    signOut,
    onAuthStateChanged
} from 'firebase/auth'
import { collection, query, where, getDocs, updateDoc, doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore'
import { auth, googleProvider, db } from '@/config/firebase'

export const useAuthStore = defineStore('auth', () => {
    // State
    const user = ref(null)
    const userRole = ref(null)
    const userSpiritualRole = ref(null)
    const userGroupId = ref(null)
    const congSettings = ref(null)
    const congregationName = ref('')
    const userPublisherId = ref(null)
    const loading = ref(true)
    const error = ref(null)

    // Getters
    const isAuthenticated = computed(() => !!user.value)

    // Auth Role Getters
    const isAdmin = computed(() => userRole.value === 'admin')
    const isEditor = computed(() => userRole.value === 'editor')

    const checkRoleMatch = (targetId, targetName) => {
        if (!user.value) return false
        const u = user.value
        if (targetId) {
            if (u.uid && u.uid === targetId) return true
            if (u.docId && u.docId === targetId) return true
            if (u.migratedFrom && u.migratedFrom === targetId) return true
            if (u.email && typeof targetId === 'string' && u.email.toLowerCase() === targetId.toLowerCase()) return true
            if (u.displayName && typeof targetId === 'string' && u.displayName.trim().toLowerCase() === targetId.trim().toLowerCase()) return true
        }
        if (targetName && u.displayName && typeof targetName === 'string') {
            if (u.displayName.trim().toLowerCase() === targetName.trim().toLowerCase()) return true
        }
        return false
    }

    const isCoordinator = computed(() => {
        if (!congSettings.value) return false
        return checkRoleMatch(congSettings.value.coordinatorUid, congSettings.value.coordinator)
    })

    const isSecretary = computed(() => {
        if (!congSettings.value) return false
        return checkRoleMatch(congSettings.value.secretaryUid, congSettings.value.secretary)
    })

    const isServiceOverseer = computed(() => {
        if (!congSettings.value) return false
        return checkRoleMatch(congSettings.value.serviceOverseerUid, congSettings.value.serviceOverseer)
    })

    const isTerritoryServant = computed(() => {
        if (!congSettings.value) return false
        return checkRoleMatch(congSettings.value.territoryServantUid, congSettings.value.territoryServant)
    })

    const isTerritoryAssistant = computed(() => {
        if (!congSettings.value) return false
        return checkRoleMatch(congSettings.value.territoryAssistantUid, congSettings.value.territoryAssistant)
    })

    const resolveUserPublisher = async (name) => {
        if (!name) return
        try {
            const pubSnap = await getDocs(collection(db, 'publishers'))
            const target = name.trim().toLowerCase()
            const found = pubSnap.docs.find(d => {
                const pName = (d.data().name || '').trim().toLowerCase()
                return pName === target
            })
            if (found) {
                userPublisherId.value = found.id
            }
        } catch (err) {
            console.error('Error resolving user publisher:', err)
        }
    }

    const isAttendant = computed(() => {
        if (!congSettings.value) return false
        const attendants = congSettings.value.attendants || []
        const attendantNames = congSettings.value.attendantNames || []
        const attendantUids = congSettings.value.attendantUids || []
        if (!Array.isArray(attendants) && !Array.isArray(attendantNames)) return false

        if (!user.value) return false
        const u = user.value

        if (u.uid && (attendants.includes(u.uid) || attendantUids.includes(u.uid))) return true
        if (u.docId && attendants.includes(u.docId)) return true
        if (userPublisherId.value && attendants.includes(userPublisherId.value)) return true

        if (u.displayName) {
            const nameLower = u.displayName.trim().toLowerCase()
            if (attendantNames.some(n => typeof n === 'string' && n.trim().toLowerCase() === nameLower)) return true
            if (attendants.some(a => typeof a === 'string' && a.trim().toLowerCase() === nameLower)) return true
        }
        if (u.email) {
            const emailLower = u.email.trim().toLowerCase()
            if (attendants.some(a => typeof a === 'string' && a.trim().toLowerCase() === emailLower)) return true
        }
        return false
    })

    // Service Committee: Coordinator + Secretary + Service Overseer
    const isServiceCommittee = computed(() => {
        return isCoordinator.value || isSecretary.value || isServiceOverseer.value
    })

    // Select to delete permission:
    // Only for Admin (Service Committee: Coordinator, Secretary, Service Overseer), NOT for other elders
    const canDelete = computed(() => {
        if (isServiceCommittee.value) return true

        const hasServiceCommitteeConfigured = congSettings.value && (
            congSettings.value.coordinatorUid || congSettings.value.coordinator ||
            congSettings.value.secretaryUid || congSettings.value.secretary ||
            congSettings.value.serviceOverseerUid || congSettings.value.serviceOverseer
        )
        // Fallback for initial admin when no appointments exist yet
        if (!hasServiceCommitteeConfigured && isAdmin.value) return true

        // Developer / super admin account not designated as Elder
        if (isAdmin.value && userSpiritualRole.value !== 'Elder') return true

        return false
    })

    // Spiritual Role Getters
    const isMS = computed(() => userSpiritualRole.value === 'Ministerial Servant')
    const isPublisher = computed(() => userSpiritualRole.value === 'Publisher')

    // Territory specific management permission:
    // "only for service overseer role elder and territory servent elder/MS and territory assistant"
    const canManageTerritory = computed(() => {
        if (isAdmin.value) return true
        if (isServiceOverseer.value && userSpiritualRole.value === 'Elder') return true
        if (isTerritoryServant.value && (userSpiritualRole.value === 'Elder' || userSpiritualRole.value === 'Ministerial Servant')) return true
        if (isTerritoryAssistant.value) return true
        return false
    })

    // Access controls based on role:
    // Home: Admin, and Editor (Elder).
    // Hidden for Editor - Publisher and Editor - Ministerial Servant roles
    const canViewHome = computed(() => {
        if (isAdmin.value) return true
        if (isEditor.value && (isPublisher.value || isMS.value)) return false
        return isEditor.value || isPublisher.value
    })
    
    // Congregation: Admin and Editor can view Congregation main menu
    const canViewDatabase = computed(() => isAdmin.value || isEditor.value)

    // Congregation -> Overview: Hidden for Editor - Publisher and Editor - Ministerial Servant roles
    const canViewCongregationOverview = computed(() => {
        if (isAdmin.value) return true
        if (isEditor.value && (isPublisher.value || isMS.value)) return false
        return isEditor.value
    })
    
    // Publishers List: Admin, or Editor who is Elder. Hidden for Editor (Publisher) and Editor (Ministerial Servant).
    const canViewPublishersList = computed(() => {
        if (isAdmin.value) return true
        if (isEditor.value && (isPublisher.value || isMS.value)) return false
        return isEditor.value
    })

    // Groups menu (/congregation/groups): Admin only (hidden for Editor)
    const canViewGroups = computed(() => isAdmin.value)

    // Reports: Admin, Editor, Publisher, Service Overseer
    const canViewReports = computed(() => isAdmin.value || isEditor.value || isPublisher.value || isServiceOverseer.value)

    // Reports -> Overview
    const canViewReportsOverview = computed(() => {
        return isAdmin.value || isEditor.value || isPublisher.value || isServiceOverseer.value
    })

    // Reports -> Add Report
    const canViewAddReport = computed(() => {
        return isAdmin.value || isEditor.value
    })

    // Reports -> Add Meeting Attendance: Only for Attendants (for Editor-Publisher and Editor-MS roles)
    const canViewAddMeetingAttendance = computed(() => {
        if (isAdmin.value) return true
        if (isEditor.value && (isPublisher.value || isMS.value)) {
            return isAttendant.value
        }
        return isAdmin.value || isEditor.value
    })

    // Reports -> Reports List
    const canViewReportsList = computed(() => {
        return isAdmin.value || isEditor.value
    })

    // Reports -> Meeting Attendance List: Only for Attendants (for Editor-Publisher and Editor-MS roles)
    const canViewMeetingAttendanceList = computed(() => {
        if (isAdmin.value) return true
        if (isEditor.value && (isPublisher.value || isMS.value)) {
            return isAttendant.value
        }
        return isAdmin.value || isEditor.value
    })
    
    // Publisher Record: View allowed for Admin and Editor. (Edit access is restricted to Admin only)
    const canViewPublisherRecord = computed(() => (isAdmin.value || isEditor.value) && !isPublisher.value)
    const canEditPublisherRecord = computed(() => isAdmin.value)

    const canViewReportAnalyze = computed(() => isAdmin.value || isServiceOverseer.value)
    const canViewSchedule = computed(() => isAdmin.value || isEditor.value)

    // Schedule -> Overview: Hidden for Editor - Publisher role
    const canViewScheduleOverview = computed(() => {
        if (isAdmin.value) return true
        if (isEditor.value && isPublisher.value) return false
        return isEditor.value
    })

    // Schedule -> Cleaning: Hidden for Editor - Publisher role
    const canViewCleaning = computed(() => {
        if (isAdmin.value) return true
        if (isEditor.value && isPublisher.value) return false
        return isEditor.value
    })

    // Schedule -> Sound: Hidden for Editor - Publisher role
    const canViewSound = computed(() => {
        if (isAdmin.value) return true
        if (isEditor.value && isPublisher.value) return false
        return isEditor.value
    })

    // Territory view controls:
    // Territory main menu: Admin, Editor, Territory Servant, Territory Assistant, Service Overseer
    // Hidden for Editor - Publisher role (unless appointed as Territory Assistant)
    const canViewTerritory = computed(() => {
        if (isAdmin.value) return true
        if (isEditor.value && isPublisher.value) {
            return isTerritoryAssistant.value
        }
        return isEditor.value || isTerritoryServant.value || isTerritoryAssistant.value || isServiceOverseer.value
    })
    
    // Territory Overview & S-13: Admin, Service Overseer, Territory Servant, Territory Assistant (hidden for regular Editor)
    const canViewTerritoryOverview = computed(() => {
        if (isAdmin.value) return true
        if (isServiceOverseer.value || isTerritoryServant.value || isTerritoryAssistant.value) return true
        return false
    })
    const canViewTerritoryS13 = computed(() => {
        if (isAdmin.value) return true
        if (isServiceOverseer.value || isTerritoryServant.value || isTerritoryAssistant.value) return true
        return false
    })

    const hasAccess = computed(() => isAdmin.value || isEditor.value || isPublisher.value || isServiceOverseer.value || isTerritoryServant.value || isTerritoryAssistant.value)

    // Actions
    const fetchCongSettings = async () => {
        try {
            const meetSnap = await getDoc(doc(db, 'settings', 'meetings'))
            if (meetSnap.exists() && meetSnap.data().congregationName) {
                congregationName.value = meetSnap.data().congregationName
            }

            const snap = await getDoc(doc(db, 'settings', 'congregation'))
            if (snap.exists()) {
                congSettings.value = snap.data()
                if (snap.data().congregationName && !congregationName.value) {
                    congregationName.value = snap.data().congregationName
                }
            }
        } catch (err) {
            console.error('Error fetching congregation settings:', err)
        }
    }

    const setCongregationName = (name) => {
        congregationName.value = name || ''
        if (congSettings.value) {
            congSettings.value.congregationName = name || ''
        }
    }

    const fetchUserRoleByEmail = async (email, uid) => {
        try {
            // Fetch congregation settings once when fetching user role
            if (!congSettings.value) {
                await fetchCongSettings()
            }

            let userData = null
            let docId = null

            // First, try backwards compatibility: check if a document with their UID exists
            const uidDocSnap = await getDoc(doc(db, 'users', uid))
            if (uidDocSnap.exists()) {
                userData = uidDocSnap.data()
                docId = uidDocSnap.id
            } else {
                // Second, try to find user by email
                const emailToSearch = email ? email.toLowerCase().trim() : ''

                const exactQuery = query(collection(db, 'users'), where('email', '==', email))
                const exactSnap = await getDocs(exactQuery)

                if (!exactSnap.empty) {
                    userData = exactSnap.docs[0].data()
                    docId = exactSnap.docs[0].id
                } else if (emailToSearch !== email) {
                    // Try lowercase just in case
                    const lowerQuery = query(collection(db, 'users'), where('email', '==', emailToSearch))
                    const lowerSnap = await getDocs(lowerQuery)
                    if (!lowerSnap.empty) {
                        userData = lowerSnap.docs[0].data()
                        docId = lowerSnap.docs[0].id
                    }
                }
            }

            if (userData) {
                // If the document ID doesn't match the UID, we need to migrate the document
                // so that Firestore rules can correctly identify the user by UID.
                if (docId !== uid) {
                    try {
                        // Create a new document with the UID as the ID
                        await setDoc(doc(db, 'users', uid), {
                            ...userData,
                            uid: uid,
                            migratedFrom: docId
                        })
                        // Delete the old document
                        await deleteDoc(doc(db, 'users', docId))
                        docId = uid
                    } catch (migrationErr) {
                        console.error('Error migrating user document:', migrationErr)
                        // Fallback to just updating the field if deletion fails due to rules
                        if (!userData.uid) {
                            await updateDoc(doc(db, 'users', docId), { uid: uid })
                        }
                    }
                } else if (!userData.uid) {
                    await updateDoc(doc(db, 'users', docId), { uid: uid })
                }

                userRole.value = userData.role
                userSpiritualRole.value = userData.spiritualRole || 'Publisher' // Default to Publisher if not set
                userGroupId.value = userData.groupId || null
                await resolveUserPublisher(userData.displayName || email)
                return { ...userData, docId }
            } else {
                // User not in database - unauthorized
                userRole.value = null
                userSpiritualRole.value = null
                userGroupId.value = null
                userPublisherId.value = null
                return null
            }
        } catch (err) {
            console.error('Error fetching user role:', err)
            error.value = err.message
            userRole.value = null
            userSpiritualRole.value = null
            userGroupId.value = null
            return null
        }
    }

    const signInWithGoogle = async () => {
        try {
            loading.value = true
            error.value = null

            const result = await signInWithPopup(auth, googleProvider)
            const firebaseUser = result.user

            // Fetch user role from Firestore by email
            const userData = await fetchUserRoleByEmail(firebaseUser.email, firebaseUser.uid)

            if (!userData) {
                // User not authorized - sign them out
                await signOut(auth)
                error.value = 'Access denied. You are not authorized to use this application.'
                user.value = null
                userRole.value = null
                userSpiritualRole.value = null
                userGroupId.value = null
                return false
            }

            user.value = {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName || userData.displayName,
                photoURL: firebaseUser.photoURL,
                docId: userData.docId || null,
                migratedFrom: userData.migratedFrom || null
            }

            return true
        } catch (err) {
            console.error('Sign in error:', err)
            error.value = err.message
            return false
        } finally {
            loading.value = false
        }
    }

    const logout = async () => {
        try {
            await signOut(auth)
            user.value = null
            userRole.value = null
            userSpiritualRole.value = null
            userGroupId.value = null
            userPublisherId.value = null
            congSettings.value = null
            congregationName.value = ''
            error.value = null
        } catch (err) {
            console.error('Logout error:', err)
            error.value = err.message
        }
    }

    const initAuth = () => {
        return new Promise((resolve) => {
            fetchCongSettings()
            onAuthStateChanged(auth, async (firebaseUser) => {
                if (firebaseUser) {
                    const userData = await fetchUserRoleByEmail(firebaseUser.email, firebaseUser.uid)

                    if (userData) {
                        user.value = {
                            uid: firebaseUser.uid,
                            email: firebaseUser.email,
                            displayName: firebaseUser.displayName || userData.displayName,
                            photoURL: firebaseUser.photoURL,
                            docId: userData.docId || null,
                            migratedFrom: userData.migratedFrom || null
                        }
                    } else {
                        // User not authorized
                        await signOut(auth)
                        user.value = null
                        userRole.value = null
                        userSpiritualRole.value = null
                        userGroupId.value = null
                        userPublisherId.value = null
                    }
                } else {
                    user.value = null
                    userRole.value = null
                    userSpiritualRole.value = null
                    userGroupId.value = null
                    userPublisherId.value = null
                }

                loading.value = false
                resolve()
            })
        })
    }

    return {
        // State
        user,
        userRole,
        userSpiritualRole,
        userGroupId,
        userPublisherId,
        congSettings,
        congregationName,
        loading,
        error,
        // Auth Getters
        isAuthenticated,
        isAdmin,
        isCoordinator,
        isSecretary,
        isServiceOverseer,
        isTerritoryServant,
        isTerritoryAssistant,
        isAttendant,
        isServiceCommittee,
        canDelete,
        isEditor,
        isMS,
        isPublisher,
        canManageTerritory,
        hasAccess,
        // RBAC View Getters
        canViewHome,
        canViewDatabase,
        canViewCongregationOverview,
        canViewPublishersList,
        canViewGroups,
        canViewReports,
        canViewReportsOverview,
        canViewAddReport,
        canViewAddMeetingAttendance,
        canViewReportsList,
        canViewMeetingAttendanceList,
        canViewPublisherRecord,
        canEditPublisherRecord,
        canViewReportAnalyze,
        canViewSchedule,
        canViewScheduleOverview,
        canViewCleaning,
        canViewSound,
        canViewTerritory,
        canViewTerritoryOverview,
        canViewTerritoryS13,
        // Actions
        fetchCongSettings,
        setCongregationName,
        signInWithGoogle,
        logout,
        initAuth
    }
})
