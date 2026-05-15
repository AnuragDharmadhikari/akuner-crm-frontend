// ── Doctor Engagement ─────────────────────────────────────────
export interface DoctorEngagementDto {
  doctorId: string
  doctorName: string
  engagementScore: number
  engagementLevel: string         
  analysis: string                
  analysisMr: string              
  recommendations: string         
  recommendationsMr: string       
}

// ── Visit Briefing ────────────────────────────────────────────
export interface VisitBriefingDto {
  visitId: string
  doctorName: string
  lastVisitSummary: string
  lastVisitSummaryMr: string
  productFocus: string
  productFocusMr: string
  talkingPoints: string
  talkingPointsMr: string
  activeSchemes: string
  activeSchemesMr: string
  visitStrategy: string
  visitStrategyMr: string
}

// ── Payment Risk (Stockist + Chemist share same DTO) ──────────
export interface PaymentRiskDto {
  partyId: string
  partyName: string
  riskLevel: string               
  riskScore: number
  totalOutstanding: number
  averagePaymentDays: string
  riskAnalysis: string            
  riskAnalysisMr: string          
  recommendedAction: string       
  recommendedActionMr: string    
}

// ── Territory Narrative ───────────────────────────────────────
export interface TerritoryNarrativeDto {
  territoryId: string
  territoryName: string
  period: string
  narrative: string
  narrativeMr: string
  strengths: string
  strengthsMr: string
  concerns: string
  concernsMr: string
  recommendations: string
  recommendationsMr: string
}

// ── Order Recommendation ──────────────────────────────────────
export interface OrderRecommendationDto {
  chemistId: string
  chemistName: string
  recommendedProducts: string
  recommendedProductsMr: string
  reasoning: string
  reasoningMr: string
  applicableSchemes: string
  applicableSchemesMr: string
  estimatedOrderValue: string
}

// ── Payment Follow-Up ─────────────────────────────────────────
export interface PaymentFollowUpDto {
  invoiceId: string
  invoiceNumber: string
  billedToName: string
  daysOverdue: number
  outstandingAmount: number
  messageTone: string
  followUpMessage: string
  followUpMessageMr: string
}