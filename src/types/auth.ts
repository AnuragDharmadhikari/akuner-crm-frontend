export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  fullName: string
  email: string
  password: string
  role: 'OWNER' | 'MANAGER' | 'REP'
  phone?: string
}

// This matches the real backend AuthResponse exactly
export interface AuthResponse {
  accessToken: string
  tokenType: string
  expiresIn: number
}