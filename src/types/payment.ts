export type PaymentMode = 'CASH' | 'CHEQUE' | 'NEFT' | 'UPI' | 'RTGS'

export interface PaymentAllocationDto {
  id: string
  invoiceId: string
  invoiceNumber: string
  invoiceGrandTotal: number
  allocatedAmount: number
  remainingAmount: number
}

export interface PaymentDto {
  id: string
  paymentNumber: string
  stockistId: string | null
  stockistFirmName: string | null
  chemistId: string | null
  chemistFirmName: string | null
  paymentDate: string
  amount: number
  paymentMode: PaymentMode
  referenceNumber: string | null
  notes: string | null
  allocations: PaymentAllocationDto[]
  createdAt: string
  updatedAt: string
}

export interface PaymentAllocationRequest {
  invoiceId: string
  allocatedAmount: number
}

export interface CreatePaymentRequest {
  stockistId?: string
  chemistId?: string
  paymentDate: string
  amount: number
  paymentMode: PaymentMode
  referenceNumber?: string
  notes?: string
  allocations: PaymentAllocationRequest[]
}