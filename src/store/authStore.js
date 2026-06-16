import { create } from 'zustand'
import { authService } from '@/services/authService'
import { getStoredToken, setStoredToken, removeStoredToken } from '@/utils/tokenStorage'
import { isTokenExpired, getRoleFromToken } from '@/utils/jwtDecode'
import { applyAuthToState, mapAuthResponseToUser } from '@/utils/mapAuthResponse'
import { normalizeRole } from '@/utils/roleRedirect'
import { findTestAccount, findTestAccountByToken } from '@/data/testAccounts'

function persistLogin(auth) {
  const { token, user, role, isAuthenticated } = applyAuthToState(auth)
  if (!token) throw new Error('Không nhận được token từ server')
  setStoredToken(token)
  return { token, user, role, isAuthenticated }
}

function applyMockSession(account) {
  const mockSession = {
    token: account.token,
    user: account.user,
    role: normalizeRole(account.user.role),
    isAuthenticated: true,
  }
  setStoredToken(mockSession.token)
  return mockSession
}

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  role: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) => {
    const role = normalizeRole(user?.role) || get().role
    set({
      user,
      role,
      isAuthenticated: !!get().token && !!user,
    })
  },

  setSession: (token, user) => {
    setStoredToken(token)
    const role = normalizeRole(user?.role) || normalizeRole(getRoleFromToken(token))
    set({
      token,
      user,
      role,
      isAuthenticated: !!token && !!user,
    })
  },

  clearSession: () => {
    removeStoredToken()
    set({
      token: null,
      user: null,
      role: null,
      isAuthenticated: false,
      isLoading: false,
    })
  },

  fetchProfile: async () => {
    const raw = await authService.getMe()
    const user = mapAuthResponseToUser(raw)
    const role = normalizeRole(user?.role)
    set({ user, role, isAuthenticated: true })
    return user
  },

  login: async ({ email, password }) => {
    const mockAccount = findTestAccount(email, password)
    if (mockAccount) {
      const mockSession = applyMockSession(mockAccount)
      set({ ...mockSession, isLoading: false })
      return { auth: mockSession, user: mockSession.user }
    }

    const auth = await authService.login({
      email: email?.trim(),
      password,
    })
    const session = persistLogin(auth)
    set({ ...session, isLoading: false })

    if (!session.user?.email) {
      const user = await get().fetchProfile()
      return { auth, user }
    }
    return { auth, user: session.user }
  },

  loginWithGoogle: async (idToken) => {
    const auth = await authService.loginGoogle(idToken)
    const session = persistLogin(auth)
    set({ ...session, isLoading: false })
    return { auth, user: session.user }
  },

  loginWithFacebook: async (accessToken) => {
    const auth = await authService.loginFacebook(accessToken)
    const session = persistLogin(auth)
    set({ ...session, isLoading: false })
    return { auth, user: session.user }
  },

  register: async (payload) => {
    const auth = await authService.register(payload)
    const session = persistLogin(auth)
    set({ ...session, isLoading: false })
    return { auth, user: session.user }
  },

  logout: async () => {
    try {
      if (getStoredToken()) await authService.logout()
    } finally {
      get().clearSession()
    }
  },

  initAuth: async () => {
    const stored = getStoredToken()

    if (!stored) {
      set({ isLoading: false })
      return
    }

    if (isTokenExpired(stored)) {
      get().clearSession()
      return
    }

    set({
      token: stored,
      isAuthenticated: true,
      isLoading: true,
    })

    const mockAccount = findTestAccountByToken(stored)
    if (mockAccount) {
      const mockSession = applyMockSession(mockAccount)
      set({ ...mockSession, isLoading: false })
      return
    }

    try {
      await get().fetchProfile()
    } catch {
      get().clearSession()
    } finally {
      set({ isLoading: false })
    }
  },
}))
