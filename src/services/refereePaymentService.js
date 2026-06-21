export const REFEREE_PAYOUTS_STORAGE_KEY = 'referee:race-payouts'
export const REFEREE_PAYOUTS_UPDATED_EVENT = 'referee-payments-updated'

function readStore() {
  try {
    const raw = localStorage.getItem(REFEREE_PAYOUTS_STORAGE_KEY)
    if (!raw) return { byRaceId: {} }
    const parsed = JSON.parse(raw)
    return parsed?.byRaceId ? parsed : { byRaceId: {} }
  } catch {
    return { byRaceId: {} }
  }
}

function writeStore(store) {
  localStorage.setItem(REFEREE_PAYOUTS_STORAGE_KEY, JSON.stringify(store))
  window.dispatchEvent(new CustomEvent(REFEREE_PAYOUTS_UPDATED_EVENT))
}

function mapPayout(record, raceId) {
  if (!record?.paid) {
    return {
      raceId: raceId ?? null,
      refereeId: null,
      refereeName: '',
      amount: 0,
      paid: false,
      paidAt: null,
    }
  }

  return {
    raceId: record.raceId ?? raceId ?? null,
    refereeId: record.refereeId ?? null,
    refereeName: record.refereeName ?? '',
    amount: Number(record.amount ?? 0),
    paid: true,
    paidAt: record.paidAt ?? null,
  }
}

export const refereePaymentService = {
  getRacePayoutStatus(raceId) {
    const record = readStore().byRaceId[String(raceId)] ?? null
    return Promise.resolve(mapPayout(record, raceId))
  },

  payRefereeForRace(raceId, { refereeId, amount, refereeName, refereeEmail, race, tournament }) {
    const store = readStore()
    const key = String(raceId)
    const existing = store.byRaceId[key]
    if (existing?.paid) {
      return Promise.resolve(mapPayout(existing, raceId))
    }

    const record = {
      raceId: Number(raceId),
      refereeId: String(refereeId),
      refereeName: refereeName ?? '',
      refereeEmail: refereeEmail ?? '',
      tournamentId: tournament?.id != null ? String(tournament.id) : '',
      tournamentName: tournament?.name ?? '',
      raceName: race?.name ?? '',
      amount: Number(amount),
      paid: true,
      paidAt: new Date().toISOString(),
    }

    store.byRaceId[key] = record
    writeStore(store)
    return Promise.resolve(mapPayout(record, raceId))
  },

  getRefereePayoutsForUser(user) {
    if (!user) return []

    const refereeId = String(user.id ?? user.userId ?? '')
    const email = user.email?.trim().toLowerCase()

    return Object.values(readStore().byRaceId)
      .filter(
        (item) =>
          item?.paid &&
          (String(item.refereeId) === refereeId ||
            (email && item.refereeEmail?.trim().toLowerCase() === email)),
      )
      .sort((first, second) => String(second.paidAt).localeCompare(String(first.paidAt)))
  },

  getRefereePayoutTotal(user) {
    return refereePaymentService
      .getRefereePayoutsForUser(user)
      .reduce((sum, item) => sum + Number(item.amount ?? 0), 0)
  },
}
