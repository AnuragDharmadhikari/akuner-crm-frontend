export type DoctorTier = 'A' | 'B' | 'C'

export interface DoctorDto {
  id: string
  fullName: string
  specialty: string
  hospitalName: string | null
  phone: string | null
  email: string | null
  tier: DoctorTier
  city: string
  state: string
  territoryId: string | null
  territoryName: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateDoctorRequest {
  fullName: string
  specialty: string
  hospitalName?: string
  tier: DoctorTier
  phone?: string
  email?: string
  city: string
  state: string
  territoryId?: string
}

export interface UpdateDoctorRequest {
  fullName: string
  specialty: string
  hospitalName?: string
  tier: DoctorTier
  phone?: string
  email?: string
  city: string
  state: string
  territoryId?: string
  isActive?: boolean
}