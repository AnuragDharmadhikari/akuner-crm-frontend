import { baseApi } from '@/app/baseApi'
import type { ApiResponse } from '@/types/api'
import type {
  ReturnDto,
  CreateReturnRequest,
  CreditNoteDto,
  ApplyCreditNoteRequest,
} from '@/types/returns'

export const returnsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    // All returns — Owner/Manager only
    // GET /api/v1/returns
    getAllReturns: builder.query<ApiResponse<ReturnDto[]>, void>({
      query: () => ({ url: '/returns', method: 'GET' }),
      providesTags: ['Return'],
    }),

    // Single return by ID — Owner/Manager only
    // GET /api/v1/returns/{id}
    getReturnById: builder.query<ApiResponse<ReturnDto>, string>({
      query: (id) => ({ url: `/returns/${id}`, method: 'GET' }),
      providesTags: ['Return'],
    }),

    // Returns by chemist — Owner/Manager only
    // GET /api/v1/returns/chemist/{chemistId}
    getReturnsByChemist: builder.query<ApiResponse<ReturnDto[]>, string>({
      query: (chemistId) => ({
        url: `/returns/chemist/${chemistId}`,
        method: 'GET',
      }),
      providesTags: ['Return'],
    }),

    // Returns by stockist — Owner/Manager only
    // GET /api/v1/returns/stockist/{stockistId}
    getReturnsByStockist: builder.query<ApiResponse<ReturnDto[]>, string>({
      query: (stockistId) => ({
        url: `/returns/stockist/${stockistId}`,
        method: 'GET',
      }),
      providesTags: ['Return'],
    }),

    // Credit notes by chemist — Owner/Manager only
    // GET /api/v1/returns/credit-notes/chemist/{chemistId}
    getCreditNotesByChemist: builder.query<ApiResponse<CreditNoteDto[]>, string>({
      query: (chemistId) => ({
        url: `/returns/credit-notes/chemist/${chemistId}`,
        method: 'GET',
      }),
      providesTags: ['Return'],
    }),

    // Credit notes by stockist — Owner/Manager only
    // GET /api/v1/returns/credit-notes/stockist/{stockistId}
    getCreditNotesByStockist: builder.query<ApiResponse<CreditNoteDto[]>, string>({
      query: (stockistId) => ({
        url: `/returns/credit-notes/stockist/${stockistId}`,
        method: 'GET',
      }),
      providesTags: ['Return'],
    }),

    // Single credit note by ID — Owner/Manager only
    // GET /api/v1/returns/credit-notes/{id}
    getCreditNoteById: builder.query<ApiResponse<CreditNoteDto>, string>({
      query: (id) => ({
        url: `/returns/credit-notes/${id}`,
        method: 'GET',
      }),
      providesTags: ['Return'],
    }),

    // Create return — Owner/Manager only
    // POST /api/v1/returns
    createReturn: builder.mutation<ApiResponse<ReturnDto>, CreateReturnRequest>({
      query: (body) => ({
        url: '/returns',
        method: 'POST',
        data: body,
      }),
      invalidatesTags: ['Return'],
    }),

    // Process return — Owner/Manager only
    // POST /api/v1/returns/{id}/process
    // Generates a credit note automatically
    processReturn: builder.mutation<ApiResponse<ReturnDto>, string>({
      query: (id) => ({
        url: `/returns/${id}/process`,
        method: 'POST',
      }),
      invalidatesTags: ['Return', 'Invoice'],
    }),

    // Reject return — Owner/Manager only
    // POST /api/v1/returns/{id}/reject
    rejectReturn: builder.mutation<ApiResponse<ReturnDto>, string>({
      query: (id) => ({
        url: `/returns/${id}/reject`,
        method: 'POST',
      }),
      invalidatesTags: ['Return'],
    }),

    // Apply credit note to invoice — Owner/Manager only
    // POST /api/v1/returns/credit-notes/{creditNoteId}/apply/{invoiceId}
    applyCreditNote: builder.mutation<ApiResponse<CreditNoteDto>, ApplyCreditNoteRequest>({
      query: ({ creditNoteId, invoiceId }) => ({
        url: `/returns/credit-notes/${creditNoteId}/apply/${invoiceId}`,
        method: 'POST',
      }),
      invalidatesTags: ['Return', 'Invoice'],
    }),

  }),
})

export const {
  useGetAllReturnsQuery,
  useGetReturnByIdQuery,
  useGetReturnsByChemistQuery,
  useGetReturnsByStockistQuery,
  useGetCreditNotesByChemistQuery,
  useGetCreditNotesByStockistQuery,
  useGetCreditNoteByIdQuery,
  useCreateReturnMutation,
  useProcessReturnMutation,
  useRejectReturnMutation,
  useApplyCreditNoteMutation,
} = returnsApi