import { baseApi } from '@/app/baseApi'
import type { ApiResponse } from '@/types/api'
import type {
  BatchDto,
  CreateBatchRequest,
  AdjustStockRequest,
  StockMovementDto,
} from '@/types/inventory'

export const inventoryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    // Batches by product — all roles
    // GET /api/v1/inventory/batches/product/{productId}
    getBatchesByProduct: builder.query<ApiResponse<BatchDto[]>, string>({
      query: (productId) => ({
        url: `/inventory/batches/product/${productId}`,
        method: 'GET',
      }),
      providesTags: ['Product'],
    }),

    // Near expiry batches — Owner/Manager only
    // GET /api/v1/inventory/batches/near-expiry
    // Backend flags batches expiring within 90 days
    getNearExpiryBatches: builder.query<ApiResponse<BatchDto[]>, void>({
      query: () => ({
        url: '/inventory/batches/near-expiry',
        method: 'GET',
      }),
      providesTags: ['Product'],
    }),

    // Expired batches with remaining stock — Owner/Manager only
    // GET /api/v1/inventory/batches/expired
    getExpiredBatches: builder.query<ApiResponse<BatchDto[]>, void>({
      query: () => ({
        url: '/inventory/batches/expired',
        method: 'GET',
      }),
      providesTags: ['Product'],
    }),

    // Single batch by ID — all roles
    // GET /api/v1/inventory/batches/{id}
    getBatchById: builder.query<ApiResponse<BatchDto>, string>({
      query: (id) => ({
        url: `/inventory/batches/${id}`,
        method: 'GET',
      }),
      providesTags: ['Product'],
    }),

    // Stock movements by batch — all roles
    // GET /api/v1/inventory/batches/{batchId}/movements
    // Shows full audit trail — SALE, SAMPLE, RETURN, ADJUSTMENT, EXPIRY_WRITEOFF
    getMovementsByBatch: builder.query<ApiResponse<StockMovementDto[]>, string>({
      query: (batchId) => ({
        url: `/inventory/batches/${batchId}/movements`,
        method: 'GET',
      }),
      providesTags: ['Product'],
    }),

    // Add batch — Owner/Manager only
    // POST /api/v1/inventory/batches
    addBatch: builder.mutation<ApiResponse<BatchDto>, CreateBatchRequest>({
      query: (body) => ({
        url: '/inventory/batches',
        method: 'POST',
        data: body,
      }),
      invalidatesTags: ['Product'],
    }),

    // Adjust stock — Owner/Manager only
    // PATCH /api/v1/inventory/batches/{batchId}/adjust
    // Used for manual stock corrections with a reason
    adjustStock: builder.mutation<ApiResponse<BatchDto>, { batchId: string; body: AdjustStockRequest }>({
      query: ({ batchId, body }) => ({
        url: `/inventory/batches/${batchId}/adjust`,
        method: 'PATCH',
        data: body,
      }),
      invalidatesTags: ['Product'],
    }),

    // Write off expired batch — Owner/Manager only
    // PATCH /api/v1/inventory/batches/{batchId}/writeoff
    // Zeroes out expired stock and logs an EXPIRY_WRITEOFF movement
    writeOffBatch: builder.mutation<ApiResponse<BatchDto>, string>({
      query: (batchId) => ({
        url: `/inventory/batches/${batchId}/writeoff`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Product'],
    }),

  }),
})

export const {
  useGetBatchesByProductQuery,
  useGetNearExpiryBatchesQuery,
  useGetExpiredBatchesQuery,
  useGetBatchByIdQuery,
  useGetMovementsByBatchQuery,
  useAddBatchMutation,
  useAdjustStockMutation,
  useWriteOffBatchMutation,
} = inventoryApi