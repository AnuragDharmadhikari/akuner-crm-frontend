export interface RevenueSummaryDto {
  month: string
  totalRevenue: number
  invoiceCount: number
  averageInvoiceValue: number
}

export interface GstLiabilityDto {
  month: string
  totalCgst: number
  totalSgst: number
  totalIgst: number
  totalTaxLiability: number
}

export interface OutstandingInvoiceDto {
  invoiceId: string
  invoiceNumber: string
  billedToName: string
  grandTotal: number
  totalPaid: number
  totalCreditApplied: number
  outstandingAmount: number
  status: string
  daysSinceIssued: number
}

export interface TopPerformerDto {
  id: string
  name: string
  state: string
  totalRevenue: number
  invoiceCount: number
}

export interface RepPerformanceDto {
  repId: string
  repName: string
  totalVisits: number
  completedVisits: number
  totalOrders: number
  totalRevenue: number
  targetVisits: number | null
  achievementPct: number | null
}

export interface InventoryValueDto {
  productId: string
  productName: string
  hsnCode: string
  dealerPrice: number
  totalCurrentUnits: number
  totalInventoryValue: number
}

export interface NearExpiryValueDto {
  batchId: string
  batchNumber: string
  productId: string
  productName: string
  expiryDate: string
  daysUntilExpiry: number
  currentQuantity: number
  dealerPrice: number
  valueAtRisk: number
}

export interface TargetAchievementDto {
  repId: string
  repName: string
  month: number
  year: number
  targetVisits: number
  actualVisits: number
  remainingVisits: number   
  achievementPct: number | null
  targetMet: boolean
}

export interface ReturnsSummaryDto {
  month: string
  totalReturnCount: number
  processedReturnCount: number
  rejectedReturnCount: number
  totalReturnValue: number
  chemistReturnValue: number
  stockistReturnValue: number
}

export interface OpenCreditNoteTotalDto {
  totalOpenValue: number
  openCount: number
  stockistOpenValue: number
  chemistOpenValue: number
}

export interface ProductVelocityDto {
  productId: string
  productName: string
  molecule: string
  hsnCode: string
  totalUnitsSold: number
  totalFreeUnits: number
  totalUnitsDeducted: number
  totalRevenue: number
}

export interface AiUsageSummaryDto {
  totalCostUsd: number
  featureCallCounts: Record<string, number>
  currency: string
}