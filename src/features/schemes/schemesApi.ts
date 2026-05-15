import { baseApi } from '@/app/baseApi'
import type { ApiResponse } from '@/types/api'
import type {
  SchemeDto,
  CreateSchemeRequest,
  UpdateSchemeRequest,
  SchemeApplicationDto,
} from '@/types/scheme'

export const schemesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    // Schemes by chemist — Owner/Manager only
    // GET /api/v1/schemes/chemist/{chemistId}
    getSchemesByChemist: builder.query<ApiResponse<SchemeDto[]>, string>({
      query: (chemistId) => ({
        url: `/schemes/chemist/${chemistId}`,
        method: 'GET',
      }),
      providesTags: ['Scheme'],
    }),

    // Schemes by stockist — Owner/Manager only
    // GET /api/v1/schemes/stockist/{stockistId}
    getSchemesByStockist: builder.query<ApiResponse<SchemeDto[]>, string>({
      query: (stockistId) => ({
        url: `/schemes/stockist/${stockistId}`,
        method: 'GET',
      }),
      providesTags: ['Scheme'],
    }),

    // Single scheme by ID — Owner/Manager only
    // GET /api/v1/schemes/{id}
    getSchemeById: builder.query<ApiResponse<SchemeDto>, string>({
      query: (id) => ({ url: `/schemes/${id}`, method: 'GET' }),
      providesTags: ['Scheme'],
    }),

    // Scheme applications by order — all roles
    // GET /api/v1/schemes/order/{orderId}/applications
    // Shows which schemes were applied to a specific order
    getSchemeApplicationsByOrder: builder.query<ApiResponse<SchemeApplicationDto[]>, string>({
      query: (orderId) => ({
        url: `/schemes/order/${orderId}/applications`,
        method: 'GET',
      }),
      providesTags: ['Scheme'],
    }),

    // Create scheme — Owner/Manager only
    // POST /api/v1/schemes
    createScheme: builder.mutation<ApiResponse<SchemeDto>, CreateSchemeRequest>({
      query: (body) => ({
        url: '/schemes',
        method: 'POST',
        data: body,
      }),
      invalidatesTags: ['Scheme'],
    }),

    // Update scheme — Owner/Manager only
    // PUT /api/v1/schemes/{id}
    updateScheme: builder.mutation<ApiResponse<SchemeDto>, { id: string; body: UpdateSchemeRequest }>({
      query: ({ id, body }) => ({
        url: `/schemes/${id}`,
        method: 'PUT',
        data: body,
      }),
      invalidatesTags: ['Scheme'],
    }),

  }),
})

export const {
  useGetSchemesByChemistQuery,
  useGetSchemesByStockistQuery,
  useGetSchemeByIdQuery,
  useGetSchemeApplicationsByOrderQuery,
  useCreateSchemeMutation,
  useUpdateSchemeMutation,
} = schemesApi