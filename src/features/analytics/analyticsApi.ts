import { baseApi } from '@/app/baseApi'
import type { ApiResponse } from '@/types/api'
import type {
  RevenueSummaryDto,
  GstLiabilityDto,
  OutstandingInvoiceDto,
  OpenCreditNoteTotalDto,
  TopPerformerDto,
  RepPerformanceDto,
  ProductVelocityDto,
  InventoryValueDto,
  NearExpiryValueDto,
  TargetAchievementDto,
  ReturnsSummaryDto,
  AiUsageSummaryDto,
} from '@/types/analytics'

export const analyticsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    // Revenue summary by month — Owner/Manager only
    // GET /api/v1/analytics/revenue/summary
    getRevenueSummary: builder.query<ApiResponse<RevenueSummaryDto[]>, void>({
      query: () => ({
        url: '/analytics/revenue/summary',
        method: 'GET',
      }),
      providesTags: ['Analytics'],
    }),

    // GST liability by month — Owner/Manager only
    // GET /api/v1/analytics/gst/liability
    getGstLiability: builder.query<ApiResponse<GstLiabilityDto[]>, void>({
      query: () => ({
        url: '/analytics/gst/liability',
        method: 'GET',
      }),
      providesTags: ['Analytics'],
    }),

    // Outstanding invoices — Owner/Manager only
    // GET /api/v1/analytics/invoices/outstanding
    getOutstandingInvoices: builder.query<ApiResponse<OutstandingInvoiceDto[]>, void>({
      query: () => ({
        url: '/analytics/invoices/outstanding',
        method: 'GET',
      }),
      providesTags: ['Analytics'],
    }),

    // Open credit note total — Owner/Manager only
    // GET /api/v1/analytics/credit-notes/open-total
    getOpenCreditNoteTotal: builder.query<ApiResponse<OpenCreditNoteTotalDto>, void>({
      query: () => ({
        url: '/analytics/credit-notes/open-total',
        method: 'GET',
      }),
      providesTags: ['Analytics'],
    }),

    // Top performing stockists — Owner/Manager only
    // GET /api/v1/analytics/stockists/top
    getTopStockists: builder.query<ApiResponse<TopPerformerDto[]>, void>({
      query: () => ({
        url: '/analytics/stockists/top',
        method: 'GET',
      }),
      providesTags: ['Analytics'],
    }),

    // Top performing chemists — Owner/Manager only
    // GET /api/v1/analytics/chemists/top
    getTopChemists: builder.query<ApiResponse<TopPerformerDto[]>, void>({
      query: () => ({
        url: '/analytics/chemists/top',
        method: 'GET',
      }),
      providesTags: ['Analytics'],
    }),

    // Rep performance — Owner/Manager only
    // GET /api/v1/analytics/reps/performance
    getRepPerformance: builder.query<ApiResponse<RepPerformanceDto[]>, void>({
      query: () => ({
        url: '/analytics/reps/performance',
        method: 'GET',
      }),
      providesTags: ['Analytics'],
    }),

    // Product velocity — Owner/Manager only
    // GET /api/v1/analytics/products/velocity
    getProductVelocity: builder.query<ApiResponse<ProductVelocityDto[]>, void>({
      query: () => ({
        url: '/analytics/products/velocity',
        method: 'GET',
      }),
      providesTags: ['Analytics'],
    }),

    // Inventory value — Owner/Manager only
    // GET /api/v1/analytics/inventory/value
    getInventoryValue: builder.query<ApiResponse<InventoryValueDto[]>, void>({
      query: () => ({
        url: '/analytics/inventory/value',
        method: 'GET',
      }),
      providesTags: ['Analytics'],
    }),

    // Near expiry inventory value — Owner/Manager only
    // GET /api/v1/analytics/inventory/near-expiry-value
    getNearExpiryValue: builder.query<ApiResponse<NearExpiryValueDto[]>, void>({
      query: () => ({
        url: '/analytics/inventory/near-expiry-value',
        method: 'GET',
      }),
      providesTags: ['Analytics'],
    }),

    // Target achievement by month/year — Owner/Manager only
    // GET /api/v1/analytics/targets/achievement
    // Optional query params: month, year
    getTargetAchievement: builder.query<ApiResponse<TargetAchievementDto[]>,
      { month?: number; year?: number } | void
    >({
      query: (params) => ({
        url: '/analytics/targets/achievement',
        method: 'GET',
        params: params ?? {},
      }),
      providesTags: ['Analytics'],
    }),

    // Returns summary by month — Owner/Manager only
    // GET /api/v1/analytics/returns/summary
    getReturnsSummary: builder.query<ApiResponse<ReturnsSummaryDto[]>, void>({
      query: () => ({
        url: '/analytics/returns/summary',
        method: 'GET',
      }),
      providesTags: ['Analytics'],
    }),

    // AI usage summary — Owner only
    // GET /api/v1/analytics/ai/usage
    getAiUsageSummary: builder.query<ApiResponse<AiUsageSummaryDto>, void>({
      query: () => ({
        url: '/analytics/ai/usage',
        method: 'GET',
      }),
      providesTags: ['Analytics'],
    }),

  }),
})

export const {
  useGetRevenueSummaryQuery,
  useGetGstLiabilityQuery,
  useGetOutstandingInvoicesQuery,
  useGetOpenCreditNoteTotalQuery,
  useGetTopStockistsQuery,
  useGetTopChemistsQuery,
  useGetRepPerformanceQuery,
  useGetProductVelocityQuery,
  useGetInventoryValueQuery,
  useGetNearExpiryValueQuery,
  useGetTargetAchievementQuery,
  useGetReturnsSummaryQuery,
  useGetAiUsageSummaryQuery,
} = analyticsApi