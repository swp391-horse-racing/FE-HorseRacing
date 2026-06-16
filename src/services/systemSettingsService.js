import axiosClient from '@/api/axiosClient'
import { ENDPOINTS } from '@/api/endpoints'
import { unwrapResponse } from '@/api/response'

const DEFAULT_TOURNAMENT_RULES_KEY = 'admin:default-tournament-rules'

export const DEFAULT_TOURNAMENT_RULES = `1. Ngựa phải có giấy chứng nhận sức khỏe hợp lệ.
2. Jockey phải có chứng chỉ FIA.
3. Kiểm tra doping bắt buộc.`

function mapDistance(option) {
  const meters = Number(option?.meters ?? 0)
  return {
    meters,
    label: option?.label || (meters > 0 ? `${meters}m` : ''),
    value: option?.label || (meters > 0 ? `${meters}m` : ''),
  }
}

function readStoredDefaultRules() {
  try {
    const stored = localStorage.getItem(DEFAULT_TOURNAMENT_RULES_KEY)
    return stored == null ? null : stored
  } catch {
    return null
  }
}

function writeStoredDefaultRules(rules) {
  localStorage.setItem(DEFAULT_TOURNAMENT_RULES_KEY, rules)
}

function resolveDefaultRules(apiRules) {
  const storedRules = readStoredDefaultRules()
  if (storedRules != null) return storedRules
  if (typeof apiRules === 'string' && apiRules.trim()) return apiRules
  return DEFAULT_TOURNAMENT_RULES
}

function mapSettings(settings) {
  const defaultTournamentRules = resolveDefaultRules(settings?.defaultTournamentRules)

  return {
    data: {
      ...settings,
      defaultTournamentRules,
      raceDistances: (Array.isArray(settings?.raceDistances) ? settings.raceDistances : [])
        .map(mapDistance)
        .filter((item) => item.meters > 0),
    },
    raw: settings,
  }
}

export const systemSettingsService = {
  async getAdminSettings() {
    const settings = await axiosClient.get(ENDPOINTS.systemSettings.admin).then(unwrapResponse)
    return mapSettings(settings)
  },

  async updateRaceDistances(distancesMeters) {
    const settings = await axiosClient
      .put(ENDPOINTS.systemSettings.raceDistances, { distancesMeters })
      .then(unwrapResponse)

    return mapSettings(settings)
  },

  async updateDefaultRules(defaultTournamentRules) {
    const trimmedRules = String(defaultTournamentRules ?? '').trim()
    writeStoredDefaultRules(trimmedRules)

    try {
      const settings = await axiosClient.get(ENDPOINTS.systemSettings.admin).then(unwrapResponse)
      return mapSettings({
        ...settings,
        defaultTournamentRules: trimmedRules,
      })
    } catch {
      return mapSettings({
        defaultTournamentRules: trimmedRules,
        raceDistances: [],
      })
    }
  },
}
