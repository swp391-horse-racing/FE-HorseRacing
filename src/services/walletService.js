import axiosClient from '@/api/axiosClient'
import { ENDPOINTS } from '@/api/endpoints'
import { unwrapResponse } from '@/api/response'

const WALLET_CACHE_TTL_MS = 60_000
const walletCache = {
  user: { data: null, at: 0 },
  admin: { data: null, at: 0 },
}

function readCache(key) {
  const entry = walletCache[key]
  if (!entry?.data || Date.now() - entry.at > WALLET_CACHE_TTL_MS) return null
  return entry.data
}

function writeCache(key, data) {
  walletCache[key] = { data, at: Date.now() }
}

export function invalidateWalletCache(mode = 'all') {
  if (mode === 'all' || mode === 'user') walletCache.user = { data: null, at: 0 }
  if (mode === 'all' || mode === 'admin') walletCache.admin = { data: null, at: 0 }
}

async function fetchWallet(endpoint, cacheKey) {
  const cached = readCache(cacheKey)
  if (cached) return cached

  const data = await axiosClient.get(endpoint).then(unwrapResponse)
  writeCache(cacheKey, data)
  return data
}

export function peekWalletBalance(walletMode = 'user') {
  const key = walletMode === 'admin' ? 'admin' : 'user'
  const cached = readCache(key)
  if (!cached) return null
  return cached?.availableBalance ?? cached?.totalBalance ?? 0
}

export const walletService = {
  getMyWallet: () => fetchWallet(ENDPOINTS.wallet.me, 'user'),

  getMyTransactions: () => axiosClient.get(ENDPOINTS.wallet.transactions).then(unwrapResponse),

  getAdminWallet: () => fetchWallet(ENDPOINTS.wallet.admin, 'admin'),

  getAdminTransactions: () =>
    axiosClient.get(ENDPOINTS.wallet.adminTransactions).then(unwrapResponse),

  createDepositOrder: (payload) =>
    axiosClient.post(ENDPOINTS.wallet.depositOrders, payload).then(unwrapResponse),

  createWithdrawal: (payload) =>
    axiosClient.post(ENDPOINTS.wallet.withdrawals, payload).then(unwrapResponse),
}
