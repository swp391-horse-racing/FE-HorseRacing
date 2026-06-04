const STORAGE_KEY = 'hoser_recent_unlocks'
/** Khớp TTL cache user trên BE (mặc định ~120s) */
export const UNLOCK_CACHE_WAIT_MS = 120_000

function readList() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeList(list) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(-80)))
}

export function markAccountUnlocked(email) {
  const key = email?.trim?.().toLowerCase()
  if (!key) return
  const now = Date.now()
  const list = readList().filter((item) => item.email !== key)
  list.push({ email: key, at: now })
  writeList(list)
}

export function getRecentUnlock(email) {
  const key = email?.trim?.().toLowerCase()
  if (!key) return null
  const entry = readList().find((item) => item.email === key)
  if (!entry) return null
  const age = Date.now() - entry.at
  if (age > UNLOCK_CACHE_WAIT_MS) return null
  return { ...entry, ageMs: age, remainingMs: UNLOCK_CACHE_WAIT_MS - age }
}

export function isLoginLockError(error) {
  const status = error?.response?.status
  const message = String(error?.response?.data?.message ?? '').toLowerCase()
  return status === 403 || (status === 500 && message.includes('internal server'))
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
