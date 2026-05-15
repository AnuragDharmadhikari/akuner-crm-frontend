import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

// ── 1. Types ─────────────────────────────────────────────────
export interface AuthUser {
  id: string
  username: string
  fullName: string
  email: string
  role: 'OWNER' | 'MANAGER' | 'REP'
}

interface AuthState { 
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean
}

// ── 2. Rehydrate from localStorage ───────────────────────────
const storedToken = localStorage.getItem('vedpharm_token')
const storedUser = localStorage.getItem('vedpharm_user')

const initialState: AuthState = {
  token: storedToken ?? null,
  user: storedUser ? JSON.parse(storedUser) : null,
  isAuthenticated: !!storedToken,
}

// ── 3. Slice ──────────────────────────────────────────────────
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ user: AuthUser; token: string }>) => {
      state.user = action.payload.user
      state.token = action.payload.token
      state.isAuthenticated = true
      localStorage.setItem('vedpharm_token', action.payload.token)
      localStorage.setItem('vedpharm_user', JSON.stringify(action.payload.user))
    },
    logout: (state) => {
      state.user = null
      state.token = null    
      state.isAuthenticated = false
      localStorage.removeItem('vedpharm_token')
      localStorage.removeItem('vedpharm_user')
    },
  },
})

// ── 4. Exports ────────────────────────────────────────────────
export const { setCredentials, logout } = authSlice.actions
export default authSlice.reducer

// ── 5. Selectors ──────────────────────────────────────────────
interface StateWithAuth {
  auth: AuthState
}

export const selectCurrentUser = (state: StateWithAuth) => state.auth.user
export const selectIsAuthenticated = (state: StateWithAuth) => state.auth.isAuthenticated
export const selectCurrentUserRole = (state: StateWithAuth) => state.auth.user?.role
