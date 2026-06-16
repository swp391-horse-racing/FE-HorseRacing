import { horseOwnerAccount } from '@/pages/horse-owner/data'
import { jockeyAccount } from '@/pages/jockey/data'
import { MOCK_REFEREES } from '@/data/adminJudgeMock'

const REFEREE_DEMO_PASSWORD = 'Referee@123'

function buildMockToken(sub, role, email) {
  const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }))
  const payload = btoa(
    JSON.stringify({
      sub,
      role,
      exp: 4100908800,
      email,
    }),
  )
  return `${header}.${payload}.`
}

export const adminAccount = {
  key: 'admin',
  label: 'Admin',
  email: 'admin.demo@horseracing.vn',
  password: 'Admin@123',
  user: {
    id: 'admin-001',
    userId: 'admin-001',
    username: 'admin_demo',
    email: 'admin.demo@horseracing.vn',
    role: 'ADMIN',
    fullName: 'Admin Demo',
    phone: '0901000001',
  },
  token: buildMockToken('admin-001', 'ADMIN', 'admin.demo@horseracing.vn'),
}

export const REFEREE_TEST_ACCOUNTS = MOCK_REFEREES.map((referee) => ({
  key: referee.id,
  label: referee.name,
  email: referee.email,
  password: REFEREE_DEMO_PASSWORD,
  user: {
    id: referee.id,
    userId: referee.id,
    username: referee.email.split('@')[0].replace(/\./g, '_'),
    email: referee.email,
    role: 'REFEREE',
    fullName: referee.name,
    phone: referee.phone,
  },
  token: buildMockToken(referee.id, 'REFEREE', referee.email),
}))

export const TEST_ACCOUNTS = [
  adminAccount,
  ...REFEREE_TEST_ACCOUNTS,
  { ...jockeyAccount, key: 'jockey', label: 'Jockey' },
  { ...horseOwnerAccount, key: 'owner', label: 'Chủ ngựa' },
]

export function findTestAccount(email, password) {
  const normalizedEmail = email?.trim().toLowerCase()
  return TEST_ACCOUNTS.find(
    (account) =>
      account.email.toLowerCase() === normalizedEmail && account.password === password,
  )
}

export function findTestAccountByToken(token) {
  if (!token) return null
  return TEST_ACCOUNTS.find((account) => account.token === token) ?? null
}

export function isMockDemoToken(token) {
  if (!token) return false
  try {
    const header = JSON.parse(atob(token.split('.')[0]))
    return header.alg === 'none'
  } catch {
    return false
  }
}
