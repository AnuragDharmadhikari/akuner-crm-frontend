import { baseApi } from '@/app/baseApi'
import type { ApiResponse } from '@/types/api'
import type {
  StockistDto,
  CreateStockistRequest,
  UpdateStockistRequest,
} from '@/types/stockist'

export const stockistsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    // All stockists — Owner/Manager only
    // GET /api/v1/stockists
    getAllStockists: builder.query<ApiResponse<StockistDto[]>, void>({
      query: () => ({ url: '/stockists', method: 'GET' }),
      providesTags: ['Stockist'],
    }),

    // Single stockist by ID — Owner/Manager only
    // GET /api/v1/stockists/{id}
    getStockistById: builder.query<ApiResponse<StockistDto>, string>({
      query: (id) => ({ url: `/stockists/${id}`, method: 'GET' }),
      providesTags: ['Stockist'],
    }),

    // Stockists by rep — Owner/Manager only
    // GET /api/v1/stockists/rep/{repId}
    getStockistsByRep: builder.query<ApiResponse<StockistDto[]>, string>({
      query: (repId) => ({
        url: `/stockists/rep/${repId}`,
        method: 'GET',
      }),
      providesTags: ['Stockist'],
    }),

    // Create stockist — Owner/Manager only
    // POST /api/v1/stockists
    createStockist: builder.mutation<ApiResponse<StockistDto>, CreateStockistRequest>({
      query: (body) => ({
        url: '/stockists',
        method: 'POST',
        data: body,
      }),
      invalidatesTags: ['Stockist'],
    }),

    // Update stockist — Owner/Manager only
    // PUT /api/v1/stockists/{id}
    updateStockist: builder.mutation<ApiResponse<StockistDto>, { id: string; body: UpdateStockistRequest }>({
      query: ({ id, body }) => ({
        url: `/stockists/${id}`,
        method: 'PUT',
        data: body,
      }),
      invalidatesTags: ['Stockist'],
    }),

    // Deactivate stockist — Owner/Manager only
    // PATCH /api/v1/stockists/{id}/deactivate
    deactivateStockist: builder.mutation<ApiResponse<void>, string>({
      query: (id) => ({
        url: `/stockists/${id}/deactivate`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Stockist'],
    }),

  }),
})

export const {
  useGetAllStockistsQuery,
  useGetStockistByIdQuery,
  useGetStockistsByRepQuery,
  useCreateStockistMutation,
  useUpdateStockistMutation,
  useDeactivateStockistMutation,
} = stockistsApi