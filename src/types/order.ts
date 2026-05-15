export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'DISPATCHED'
export type FulfillmentType = 'VIA_STOCKIST' | 'DIRECT'

export interface OrderItemDto {
  id: string
  productId: string
  productName: string
  hsnCode: string
  quantity: number
  unitPrice: number
  discountPct: number
  schemeDiscountPct: number
  freeQuantity: number
  lineTotal: number
}

export interface OrderDto {
  id: string
  repId: string
  repName: string
  chemistId: string
  chemistFirmName: string
  chemistGstin: string | null
  chemistState: string
  stockistId: string | null
  stockistFirmName: string | null
  stockistGstin: string | null
  stockistState: string | null
  fulfillmentType: FulfillmentType
  orderDate: string
  status: OrderStatus
  totalAmount: number
  orderItems: OrderItemDto[]
  createdAt: string
  updatedAt: string
}

export interface OrderItemRequest {
  productId: string
  quantity: number
  discountPct?: number
}

export interface CreateOrderRequest {
  repId: string
  chemistId: string
  stockistId?: string
  fulfillmentType: FulfillmentType
  orderDate: string          
  orderItems: OrderItemRequest[]
}

export interface UpdateOrderRequest {
  orderItems: OrderItemRequest[]
}