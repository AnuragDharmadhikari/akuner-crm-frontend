export type SchemeType = 'QUANTITY_FREE' | 'PERCENTAGE_DISCOUNT'

export interface SchemeDto {
  id: string
  productId: string
  productName: string
  productMolecule: string
  chemistId: string | null
  chemistFirmName: string | null
  stockistId: string | null
  stockistFirmName: string | null
  schemeType: SchemeType
  minQuantity: number
  freeQuantity: number | null
  discountPct: number | null
  validFrom: string
  validTo: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateSchemeRequest {
  productId: string
  chemistId?: string
  stockistId?: string
  schemeType: SchemeType
  minQuantity: number
  freeQuantity?: number
  discountPct?: number
  validFrom: string
  validTo: string
}

export interface UpdateSchemeRequest {
  minQuantity?: number
  freeQuantity?: number
  discountPct?: number
  validTo?: string
  isActive?: boolean
}

export interface SchemeApplicationDto {
  id: string
  orderItemId: string
  schemeId: string
  schemeType: SchemeType
  benefitDescription: string
  freeQuantity: number | null
  discountApplied: number | null
  createdAt: string
}