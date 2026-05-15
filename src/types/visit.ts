export type VisitStatus = 'PLANNED' | 'COMPLETED' | 'MISSED'

export interface VisitProductDto {
  id: string
  productId: string
  productName: string
  hsnCode: string
  batchId: string | null
  batchNumber: string | null
  samplesGiven: number | null
  feedback: string | null
}

export interface VisitDto {
  id: string
  repId: string
  repName: string
  doctorId: string
  doctorName: string
  doctorSpecialty: string
  visitDate: string
  status: VisitStatus
  notes: string | null
  aiSummary: string | null
  visitProducts: VisitProductDto[]
  createdAt: string
  updatedAt: string
}

export interface VisitProductRequest {
  productId: string
  batchId?: string
  samplesGiven?: number
  feedback?: string
}

export interface CreateVisitRequest {
  repId: string
  doctorId: string
  visitDate: string
  status: VisitStatus
  notes?: string
  products?: VisitProductRequest[]
}

export interface UpdateVisitRequest {
  status?: VisitStatus
  notes?: string
  products?: VisitProductRequest[]
}