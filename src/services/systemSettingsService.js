import axiosClient from '@/api/axiosClient'
import { ENDPOINTS } from '@/api/endpoints'
import { unwrapResponse } from '@/api/response'

function mapDistance(option) {
  const meters = Number(option?.meters ?? 0)
  return {
    meters,
    label: option?.label || (meters > 0 ? `${meters}m` : ''),
    value: option?.label || (meters > 0 ? `${meters}m` : ''),
  }
}

export const systemSettingsService = {
  async getAdminSettings() {
    const settings = await axiosClient.get(ENDPOINTS.systemSettings.admin).then(unwrapResponse)
    return {
      data: {
        ...settings,
        raceDistances: (Array.isArray(settings?.raceDistances) ? settings.raceDistances : [])
          .map(mapDistance)
          .filter((item) => item.meters > 0),
      },
      raw: settings,
    }
  },

  async updateRaceDistances(distancesMeters) {
    const settings = await axiosClient
      .put(ENDPOINTS.systemSettings.raceDistances, { distancesMeters })
      .then(unwrapResponse)

    return {
      data: {
        ...settings,
        raceDistances: (Array.isArray(settings?.raceDistances) ? settings.raceDistances : [])
          .map(mapDistance)
          .filter((item) => item.meters > 0),
      },
      raw: settings,
    }
  },
}
