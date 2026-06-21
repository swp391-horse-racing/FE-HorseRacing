import { useCallback, useEffect, useRef, useState } from 'react'
import { refereeService } from '@/services/refereeService'
import {
  loadAssignedRacesFromApi,
  filterRacesForRefereeOperation,
  REFEREE_INVITATIONS_UPDATED_EVENT,
} from '@/services/refereeInvitationService'
import { useAuthStore } from '@/store/authStore'
import {
  buildTournamentNameMap,
  buildTournamentStatusMap,
  countCheckedInParticipants,
  mapRaceFromApi,
} from '@/utils/refereeRaceUtils'
import { getApiErrorMessage } from '@/utils/apiError'

function mapAssignedRaces(data, { nameById = new Map(), statusById = new Map() } = {}) {
  return data.map((raw, index) => mapRaceFromApi({
    ...raw,
    tournamentName: raw.tournamentName || nameById.get(String(raw.tournamentId)),
    tournamentStatus: statusById.get(String(raw.tournamentId)) ?? '',
  }, index))
}

async function enrichRacesWithCheckInProgress(races) {
  if (!Array.isArray(races) || !races.length) return races

  const enriched = await Promise.all(
    races.map(async (race) => {
      if (!race?.id) return race

      try {
        const participants = await refereeService.getRaceParticipants(race.id)
        const participantCount = participants.length || Number(race.participantCount ?? 0)
        const checkedInCount = countCheckedInParticipants(participants)

        return {
          ...race,
          participantCount,
          totalHorses: participantCount,
          checkedInCount,
          checkedInDisplay: checkedInCount,
        }
      } catch {
        return race
      }
    }),
  )

  return enriched
}

export function useRefereeRaces() {
  const userId = useAuthStore((state) => state.user?.id ?? state.user?.userId)
  const [races, setRaces] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const hasLoadedRef = useRef(false)
  const reloadingRef = useRef(false)

  const reload = useCallback(async ({ silent = false } = {}) => {
    if (reloadingRef.current) return
    reloadingRef.current = true

    const isInitialLoad = !hasLoadedRef.current
    if (isInitialLoad && !silent) {
      setLoading(true)
    } else if (!silent) {
      setRefreshing(true)
    }
    setError('')

    try {
      const data = await loadAssignedRacesFromApi()
      const user = useAuthStore.getState().user
      const allowed = filterRacesForRefereeOperation(data, user)
      const tournamentIds = allowed.map((race) => race.tournamentId)

      let nameById = new Map()
      let statusById = new Map()
      try {
        ;[nameById, statusById] = await Promise.all([
          buildTournamentNameMap(tournamentIds),
          buildTournamentStatusMap(tournamentIds),
        ])
      } catch {
        // dùng dữ liệu race gốc nếu không tải được meta giải
      }

      const mapped = mapAssignedRaces(allowed, { nameById, statusById })
      const withCheckIn = await enrichRacesWithCheckInProgress(mapped)
      setRaces(withCheckIn)
      hasLoadedRef.current = true
    } catch (err) {
      setError(getApiErrorMessage(err) || 'Không tải được danh sách cuộc đua')
      if (!hasLoadedRef.current) {
        setRaces([])
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
      reloadingRef.current = false
    }
  }, [userId])

  useEffect(() => {
    reload()
  }, [reload])

  useEffect(() => {
    const handleInvitationsUpdated = () => reload({ silent: true })
    window.addEventListener(REFEREE_INVITATIONS_UPDATED_EVENT, handleInvitationsUpdated)
    return () => window.removeEventListener(REFEREE_INVITATIONS_UPDATED_EVENT, handleInvitationsUpdated)
  }, [reload])

  return { races, loading, refreshing, error, reload }
}
