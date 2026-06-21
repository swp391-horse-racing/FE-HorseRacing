import { useCallback, useEffect, useRef, useState } from 'react'
import { refereeService } from '@/services/refereeService'
import {
  buildTournamentNameMap,
  buildTournamentStatusMap,
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

export function useRefereeRaces() {
  const [races, setRaces] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const hasLoadedRef = useRef(false)

  const reload = useCallback(async ({ silent = false } = {}) => {
    const isInitialLoad = !hasLoadedRef.current
    if (isInitialLoad && !silent) {
      setLoading(true)
    } else if (!silent) {
      setRefreshing(true)
    }
    setError('')

    try {
      const data = await refereeService.getAssignedRaces()
      const tournamentIds = data.map((race) => race.tournamentId)
      setRaces(mapAssignedRaces(data))
      hasLoadedRef.current = true

      if (isInitialLoad) {
        setLoading(false)
      }

      Promise.all([
        buildTournamentNameMap(tournamentIds),
        buildTournamentStatusMap(tournamentIds),
      ])
        .then(([nameById, statusById]) => {
          setRaces(mapAssignedRaces(data, { nameById, statusById }))
        })
        .catch(() => {
          // Giữ danh sách race đã load
        })
    } catch (err) {
      setError(getApiErrorMessage(err) || 'Không tải được danh sách cuộc đua')
      if (!hasLoadedRef.current) {
        setRaces([])
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  return { races, loading, refreshing, error, reload }
}
