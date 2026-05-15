export interface TerritoryDto {
  id: string
  name: string
  state: string
  zone: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateTerritoryRequest {
  name: string
  state: string
  zone?: string
}

export interface UpdateTerritoryRequest {
  name: string
  state: string
  zone?: string
  isActive?: boolean
}
