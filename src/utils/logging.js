import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/config/firebase'

const sanitizeData = (data) => {
  if (data === null || data === undefined) return null
  try {
    return JSON.parse(JSON.stringify(data))
  } catch (err) {
    return String(data)
  }
}

/**
 * Logs a user activity to Firestore
 * @param {Object} authStore - The user's auth store
 * @param {String} action - The action performed (e.g., "Report Created")
 * @param {String} details - Additional details about the action
 * @param {Number} [month] - Related month (0-11)
 * @param {Number} [year] - Related year
 * @param {Object} [previousData] - Data state before the action
 * @param {Object} [newData] - Data state after the action
 */
export const logActivity = async (
  authStore,
  action,
  details,
  month = null,
  year = null,
  previousData = null,
  newData = null
) => {
  try {
    const payload = {
      timestamp: serverTimestamp(),
      userId: authStore?.user?.uid || 'Unknown',
      userName: authStore?.user?.displayName || authStore?.user?.email || 'Unknown',
      action,
      details,
      month: month !== null ? month : null,
      year: year !== null ? year : null
    }

    const cleanPrev = sanitizeData(previousData)
    const cleanNew = sanitizeData(newData)

    if (cleanPrev !== null) payload.previousData = cleanPrev
    if (cleanNew !== null) payload.newData = cleanNew

    await addDoc(collection(db, 'logs'), payload)
  } catch (error) {
    console.error('Error logging activity:', error)
  }
}
