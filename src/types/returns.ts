export type ReturnStatus = 'PENDING' | 'PROCESSED' | 'REJECTED'
export type ReturnItemCondition = 'SALEABLE' | 'DAMAGED' | 'EXPIRED'
export type CreditNoteStatus = 'OPEN' | 'APPLIED' | 'VOID'

export interface CreditNoteDto {
  id: string
  creditNoteNumber: string
  returnId: string
  returnNumber: string
  chemistId: string | null
  chemistFirmName: string | null
  stockistId: string | null
  stockistFirmName: string | null
  amount: number
  status: CreditNoteStatus
  appliedToInvoiceId: string | null
  appliedToInvoiceNumber: string | null
  createdAt: string
  updatedAt: string
}

export interface ReturnItemDto {
  id: string
  batchId: string
  batchNumber: string
  productId: string
  productName: string
  hsnCode: string
  quantity: number
  condition: ReturnItemCondition
  unitPrice: number
  lineTotal: number
}

export interface ReturnDto {
  id: string
  returnNumber: string
  chemistId: string | null
  chemistFirmName: string | null
  stockistId: string | null
  stockistFirmName: string | null
  returnDate: string
  reason: string
  status: ReturnStatus
  returnItems: ReturnItemDto[]
  creditNote: CreditNoteDto | null
  createdAt: string
  updatedAt: string
}

export interface ReturnItemRequest {
  batchId: string
  quantity: number
  condition: ReturnItemCondition
}

export interface CreateReturnRequest {
  chemistId?: string
  stockistId?: string
  returnDate: string
  reason: string
  returnItems: ReturnItemRequest[]
}

export interface ApplyCreditNoteRequest {
  creditNoteId: string
  invoiceId: string
}