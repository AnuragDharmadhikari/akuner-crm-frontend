import { baseApi } from '@/app/baseApi'
import type { ApiResponse } from '@/types/api'
import type { PaymentDto, CreatePaymentRequest } from '@/types/payment'

export const paymentsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    // All payments — Owner/Manager only
    // GET /api/v1/payments
    getAllPayments: builder.query<ApiResponse<PaymentDto[]>, void>({
      query: () => ({ url: '/payments', method: 'GET' }),
      providesTags: ['Payment'],
    }),

    // Single payment by ID — Owner/Manager only
    // GET /api/v1/payments/{id}
    getPaymentById: builder.query<ApiResponse<PaymentDto>, string>({
      query: (id) => ({ url: `/payments/${id}`, method: 'GET' }),
      providesTags: ['Payment'],
    }),

    // Payments by stockist — Owner/Manager only
    // GET /api/v1/payments/stockist/{stockistId}
    getPaymentsByStockist: builder.query<ApiResponse<PaymentDto[]>, string>({
      query: (stockistId) => ({
        url: `/payments/stockist/${stockistId}`,
        method: 'GET',
      }),
      providesTags: ['Payment'],
    }),

    // Payments by chemist — Owner/Manager only
    // GET /api/v1/payments/chemist/{chemistId}
    getPaymentsByChemist: builder.query<ApiResponse<PaymentDto[]>, string>({
      query: (chemistId) => ({
        url: `/payments/chemist/${chemistId}`,
        method: 'GET',
      }),
      providesTags: ['Payment'],
    }),

    // Create payment with invoice allocations — Owner/Manager only
    // POST /api/v1/payments
    // Body includes allocations[] to split payment across multiple invoices
    createPayment: builder.mutation<ApiResponse<PaymentDto>, CreatePaymentRequest>({
      query: (body) => ({
        url: '/payments',
        method: 'POST',
        data: body,
      }),
      // Invalidates both Payment and Invoice tags since payment
      // affects invoice outstanding amounts
      invalidatesTags: ['Payment', 'Invoice'],
    }),

  }),
})

export const {
  useGetAllPaymentsQuery,
  useGetPaymentByIdQuery,
  useGetPaymentsByStockistQuery,
  useGetPaymentsByChemistQuery,
  useCreatePaymentMutation,
} = paymentsApi