export type UserRole = 'OWNER' | 'MANAGER' | 'REP'

export interface UserDto {
  id: string
  fullName: string
  email: string
  role: UserRole
  phone: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface UpdateUserRequest {
  fullName?: string
  phone?: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}
