import { baseApi } from '@/app/baseApi'
import type { ApiResponse } from '@/types/api'
import type {
  DoctorEngagementDto,
  VisitBriefingDto,
  PaymentRiskDto,
  TerritoryNarrativeDto,
  OrderRecommendationDto,
  PaymentFollowUpDto,
} from '@/types/ai'

export const aiApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    // Doctor engagement analysis — all roles
    // GET /api/v1/ai/doctors/{id}/engagement
    // Cached 24h in Redis per doctor
    // Returns bilingual engagement score + analysis + recommendations
    getDoctorEngagement: builder.query<ApiResponse<DoctorEngagementDto>, string>({
      query: (doctorId) => ({
        url: `/ai/doctors/${doctorId}/engagement`,
        method: 'GET',
      }),
    }),

    // Visit briefing — all roles
    // GET /api/v1/ai/visits/{id}/briefing
    // Cached 1h in Redis per visit
    // Returns bilingual pre-visit coaching — last summary, product focus,
    // talking points, active schemes, visit strategy
    getVisitBriefing: builder.query<ApiResponse<VisitBriefingDto>, string>({
      query: (visitId) => ({
        url: `/ai/visits/${visitId}/briefing`,
        method: 'GET',
      }),
    }),

    // Stockist payment risk — Owner only
    // GET /api/v1/ai/stockists/{id}/payment-risk
    // Cached 6h in Redis per stockist
    // Returns risk score, level, bilingual analysis + recommended action
    getStockistPaymentRisk: builder.query<ApiResponse<PaymentRiskDto>, string>({
      query: (stockistId) => ({
        url: `/ai/stockists/${stockistId}/payment-risk`,
        method: 'GET',
      }),
    }),

    // Chemist payment risk — Owner only
    // GET /api/v1/ai/chemists/{id}/payment-risk
    // Cached 6h in Redis per chemist
    getChemistPaymentRisk: builder.query<ApiResponse<PaymentRiskDto>, string>({
      query: (chemistId) => ({
        url: `/ai/chemists/${chemistId}/payment-risk`,
        method: 'GET',
      }),
    }),

    // Territory narrative — Owner/Manager only
    // GET /api/v1/ai/territories/{id}/narrative
    // Cached 12h in Redis per territory
    // Returns bilingual territory performance story —
    // strengths, concerns, recommendations
    getTerritoryNarrative: builder.query<ApiResponse<TerritoryNarrativeDto>, string>({
      query: (territoryId) => ({
        url: `/ai/territories/${territoryId}/narrative`,
        method: 'GET',
      }),
    }),

    // Order recommendation for chemist — Owner/Manager only
    // GET /api/v1/ai/orders/recommend/{chemistId}
    // Cached 6h in Redis per chemist
    // Returns recommended products + applicable schemes + estimated order value
    getOrderRecommendation: builder.query<ApiResponse<OrderRecommendationDto>, string>({
      query: (chemistId) => ({
        url: `/ai/orders/recommend/${chemistId}`,
        method: 'GET',
      }),
    }),

    // Payment follow-up message — Owner/Manager only
    // GET /api/v1/ai/invoices/{id}/follow-up
    // Cached 24h in Redis per invoice
    // Returns bilingual follow-up message for overdue invoices
    getPaymentFollowUp: builder.query<ApiResponse<PaymentFollowUpDto>, string>({
      query: (invoiceId) => ({
        url: `/ai/invoices/${invoiceId}/follow-up`,
        method: 'GET',
      }),
    }),

  }),
})

export const {
  useGetDoctorEngagementQuery,
  useGetVisitBriefingQuery,
  useGetStockistPaymentRiskQuery,
  useGetChemistPaymentRiskQuery,
  useGetTerritoryNarrativeQuery,
  useGetOrderRecommendationQuery,
  useGetPaymentFollowUpQuery,
} = aiApi