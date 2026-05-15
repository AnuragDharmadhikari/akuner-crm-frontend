import { baseApi } from '@/app/baseApi'
import type { ApiResponse } from '@/types/api'
import type {
  ChemistDto,
  CreateChemistRequest,
  UpdateChemistRequest,
} from '@/types/chemist'

export const chemistsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    // All chemists — Owner/Manager only
    // GET /api/v1/chemists
    getAllChemists: builder.query<ApiResponse<ChemistDto[]>, void>({
      query: () => ({ url: '/chemists', method: 'GET' }),
      providesTags: ['Chemist'],
    }),

    // Single chemist by ID — all roles
    // GET /api/v1/chemists/{id}
    getChemistById: builder.query<ApiResponse<ChemistDto>, string>({
      query: (id) => ({ url: `/chemists/${id}`, method: 'GET' }),
      providesTags: ['Chemist'],
    }),

    // Chemists by rep — all roles
    // GET /api/v1/chemists/rep/{repId}
    getChemistsByRep: builder.query<ApiResponse<ChemistDto[]>, string>({
      query: (repId) => ({ url: `/chemists/rep/${repId}`, method: 'GET' }),
      providesTags: ['Chemist'],
    }),

    // Create chemist — all roles
    // POST /api/v1/chemists
    createChemist: builder.mutation<ApiResponse<ChemistDto>, CreateChemistRequest>({
      query: (body) => ({
        url: '/chemists',
        method: 'POST',
        data: body,
      }),
      invalidatesTags: ['Chemist'],
    }),

    // Update chemist — all roles
    // PUT /api/v1/chemists/{id}
    updateChemist: builder.mutation<ApiResponse<ChemistDto>, { id: string; body: UpdateChemistRequest }>({
      query: ({ id, body }) => ({
        url: `/chemists/${id}`,
        method: 'PUT',
        data: body,
      }),
      invalidatesTags: ['Chemist'],
    }),

    // Deactivate chemist — Owner/Manager only
    // PATCH /api/v1/chemists/{id}/deactivate
    deactivateChemist: builder.mutation<ApiResponse<void>, string>({
      query: (id) => ({
        url: `/chemists/${id}/deactivate`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Chemist'],
    }),

  }),
})

export const {
  useGetAllChemistsQuery,
  useGetChemistByIdQuery,
  useGetChemistsByRepQuery,
  useCreateChemistMutation,
  useUpdateChemistMutation,
  useDeactivateChemistMutation,
} = chemistsApi