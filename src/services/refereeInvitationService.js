import { refereeService } from '@/services/refereeService'
import { formatRaceTime } from '@/utils/refereeRaceUtils'

export const REFEREE_INVITATIONS_STORAGE_KEY = 'referee:invitations'
export const REFEREE_INVITATION_RESPONSES_KEY = 'referee:invitation-responses'
export const REFEREE_INVITATIONS_UPDATED_EVENT = 'referee-invitations-updated'

const STATUS = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  DECLINED: 'DECLINED',
}

const STATUS_SORT = { PENDING: 0, ACCEPTED: 1, DECLINED: 2 }

/* -------------------------------------------------------------------------- */
/* Phía trọng tài: lời mời = cuộc đua được admin phân công (lấy từ BE)         */
/* Quyết định chấp nhận/từ chối lưu localStorage theo từng trọng tài           */
/* -------------------------------------------------------------------------- */

let cachedRefereeRaces = []

function userKey(user) {
  return String(user?.id ?? user?.userId ?? user?.email ?? '')
}

function responseKey(raceId, user) {
  return `${raceId}:${userKey(user)}`
}

function readResponses() {
  try {
    const raw = localStorage.getItem(REFEREE_INVITATION_RESPONSES_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeResponses(map) {
  localStorage.setItem(REFEREE_INVITATION_RESPONSES_KEY, JSON.stringify(map))
  notifyInvitationsUpdated()
}

function buildRefereeInvitation(race, user) {
  const responses = readResponses()
  const response = responses[responseKey(race?.id, user)]
  return {
    id: `race-${race?.id}`,
    raceId: String(race?.id ?? ''),
    tournamentId: race?.tournamentId != null ? String(race.tournamentId) : '',
    tournamentName: race?.tournamentName?.trim() || 'Cuộc đua được phân công',
    tournamentLocation: race?.venueName?.trim() || race?.venueAddress?.trim() || '',
    raceName: race?.name?.trim() || 'Cuộc đua',
    raceDate: race?.scheduledStartAt ?? '',
    raceTime: race?.scheduledStartAt ? formatRaceTime(race.scheduledStartAt) : '',
    message: '',
    status: response?.status ?? STATUS.PENDING,
    invitedAt: race?.createdAt ?? race?.scheduledStartAt ?? null,
    respondedAt: response?.respondedAt ?? null,
  }
}

export async function loadAssignedRacesFromApi() {
  try {
    const races = await refereeService.getAssignedRaces()
    cachedRefereeRaces = Array.isArray(races) ? races : []
  } catch {
    cachedRefereeRaces = []
  }
  return cachedRefereeRaces
}

function notifyInvitationsUpdated() {
  window.dispatchEvent(new CustomEvent(REFEREE_INVITATIONS_UPDATED_EVENT))
}

/** Tải cuộc đua được phân công từ BE. Chỉ phát event khi `notify: true`. */
export async function fetchRefereeInvitations({ notify = false } = {}) {
  const races = await loadAssignedRacesFromApi()
  if (notify) notifyInvitationsUpdated()
  return races
}

export function getInvitationsForReferee(user) {
  if (!user) return []
  return cachedRefereeRaces
    .map((race) => buildRefereeInvitation(race, user))
    .sort((a, b) => {
      const orderA = STATUS_SORT[a.status] ?? 9
      const orderB = STATUS_SORT[b.status] ?? 9
      if (orderA !== orderB) return orderA - orderB
      return String(b.invitedAt).localeCompare(String(a.invitedAt))
    })
}

export function getPendingInvitationCountForReferee(user) {
  return getInvitationsForReferee(user).filter((item) => item.status === STATUS.PENDING).length
}

export function respondToInvitation(invitationId, user, nextStatus) {
  if (![STATUS.ACCEPTED, STATUS.DECLINED].includes(nextStatus)) return null
  if (!user) return null

  const raceId = String(invitationId ?? '').replace(/^race-/, '')
  if (!raceId) return null

  const responses = readResponses()
  responses[responseKey(raceId, user)] = {
    status: nextStatus,
    respondedAt: new Date().toISOString(),
  }
  writeResponses(responses)
  return { id: `race-${raceId}`, raceId, status: nextStatus }
}

export function canRefereeOperateRace(raceId, user) {
  if (!raceId || !user) return false
  const responses = readResponses()
  return responses[responseKey(raceId, user)]?.status === STATUS.ACCEPTED
}

export function filterRacesForRefereeOperation(races, user) {
  if (!Array.isArray(races)) return []
  return races.filter((race) => canRefereeOperateRace(race?.id, user))
}

/* -------------------------------------------------------------------------- */
/* Phía admin: quản lý lời mời trong localStorage (đồng bộ trong cùng trình duyệt) */
/* -------------------------------------------------------------------------- */

function readStore() {
  try {
    const raw = localStorage.getItem(REFEREE_INVITATIONS_STORAGE_KEY)
    if (!raw) return { invitations: [] }
    const parsed = JSON.parse(raw)
    return { invitations: Array.isArray(parsed?.invitations) ? parsed.invitations : [] }
  } catch {
    return { invitations: [] }
  }
}

function writeStore(store) {
  localStorage.setItem(REFEREE_INVITATIONS_STORAGE_KEY, JSON.stringify(store))
  window.dispatchEvent(new CustomEvent(REFEREE_INVITATIONS_UPDATED_EVENT))
}

function invitationKey(raceId, refereeId) {
  return `${raceId}:${refereeId}`
}

function mapInvitation(item) {
  return {
    id: item.id,
    tournamentId: item.tournamentId,
    tournamentName: item.tournamentName ?? '',
    tournamentLocation: item.tournamentLocation ?? '',
    raceId: item.raceId,
    raceName: item.raceName ?? '',
    raceDate: item.raceDate ?? '',
    raceTime: item.raceTime ?? '',
    refereeId: String(item.refereeId ?? ''),
    refereeEmail: item.refereeEmail ?? '',
    refereeName: item.refereeName ?? '',
    message: item.message ?? '',
    status: item.status ?? STATUS.PENDING,
    invitedAt: item.invitedAt ?? null,
    respondedAt: item.respondedAt ?? null,
  }
}

export function getInvitationsForRace(raceId) {
  return readStore()
    .invitations.map(mapInvitation)
    .filter((item) => String(item.raceId) === String(raceId))
    .sort((a, b) => String(b.invitedAt).localeCompare(String(a.invitedAt)))
}

export function hasPendingInvitation(raceId, refereeId) {
  const key = invitationKey(raceId, refereeId)
  return readStore().invitations.some(
    (item) =>
      invitationKey(item.raceId, item.refereeId) === key && item.status === STATUS.PENDING,
  )
}

export function getLatestInvitationForReferee(raceId, refereeId) {
  const key = invitationKey(raceId, refereeId)
  const matches = readStore()
    .invitations.filter((item) => invitationKey(item.raceId, item.refereeId) === key)
    .map(mapInvitation)
    .sort((a, b) => String(b.invitedAt).localeCompare(String(a.invitedAt)))

  return matches[0] ?? null
}

export function getInvitationSummaryForRace(raceId) {
  const invitations = getInvitationsForRace(raceId)
  const latestByReferee = new Map()

  invitations.forEach((item) => {
    const existing = latestByReferee.get(item.refereeId)
    if (!existing || String(item.invitedAt) > String(existing.invitedAt)) {
      latestByReferee.set(item.refereeId, item)
    }
  })

  const values = [...latestByReferee.values()]
  return {
    pending: values.filter((item) => item.status === STATUS.PENDING).length,
    accepted: values.filter((item) => item.status === STATUS.ACCEPTED).length,
    declined: values.filter((item) => item.status === STATUS.DECLINED).length,
    acceptedReferee: values.find((item) => item.status === STATUS.ACCEPTED) ?? null,
    pendingReferees: values.filter((item) => item.status === STATUS.PENDING),
  }
}

export function sendRefereeInvitation({ tournament, race, referee, message = '' }) {
  if (!tournament?.id || !race?.id || !referee?.id) return null

  const store = readStore()
  const key = invitationKey(race.id, referee.id)
  const existing = store.invitations.find(
    (item) => invitationKey(item.raceId, item.refereeId) === key && item.status === STATUS.PENDING,
  )
  if (existing) return mapInvitation(existing)

  const declinedIndex = store.invitations.findIndex(
    (item) => invitationKey(item.raceId, item.refereeId) === key && item.status === STATUS.DECLINED,
  )
  if (declinedIndex >= 0) {
    store.invitations[declinedIndex] = {
      ...store.invitations[declinedIndex],
      message: String(message ?? '').trim(),
      status: STATUS.PENDING,
      invitedAt: new Date().toISOString(),
      respondedAt: null,
    }
    writeStore(store)
    return mapInvitation(store.invitations[declinedIndex])
  }

  const invitation = {
    id: `inv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    tournamentId: String(tournament.id),
    tournamentName: tournament.name ?? '',
    tournamentLocation: tournament.location ?? '',
    raceId: String(race.id),
    raceName: race.name ?? '',
    raceDate: race.date ?? '',
    raceTime: race.time ?? '',
    refereeId: String(referee.id),
    refereeEmail: referee.email ?? '',
    refereeName: referee.name ?? '',
    message: String(message ?? '').trim(),
    status: STATUS.PENDING,
    invitedAt: new Date().toISOString(),
    respondedAt: null,
  }

  store.invitations.unshift(invitation)
  writeStore(store)
  return mapInvitation(invitation)
}

export function invitationStatusLabel(status) {
  if (status === STATUS.ACCEPTED) return 'Đã chấp nhận'
  if (status === STATUS.DECLINED) return 'Đã từ chối'
  return 'Chờ phản hồi'
}

export function invitationStatusTone(status) {
  if (status === STATUS.ACCEPTED) return 'green'
  if (status === STATUS.DECLINED) return 'gray'
  return 'gold'
}

export { STATUS as REFEREE_INVITATION_STATUS }
