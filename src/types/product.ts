export type GstRate = 'GST_5' | 'GST_12' | 'GST_18'

export interface ProductDto {
  id: string
  name: string
  molecule: string
  category: string        
  hsnCode: string
  gstRate: GstRate
  gstRateValue: number    
  mrp: number
  dealerPrice: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateProductRequest {
  name: string
  molecule: string
  category: string        
  hsnCode: string
  gstRate: GstRate
  mrp: number
  dealerPrice: number
}

export interface UpdateProductRequest {
  name: string
  molecule: string
  category: string       
  hsnCode: string
  gstRate: GstRate
  mrp: number
  dealerPrice: number
  isActive?: boolean
}