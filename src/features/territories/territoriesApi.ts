import { baseApi } from '@/app/baseApi'
import type { ApiResponse } from '@/types/api'
import type {
  TerritoryDto,
  CreateTerritoryRequest,
  UpdateTerritoryRequest,
} from '@/types/territory'

export const territoriesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    // All territories — all roles
    // GET /api/v1/territories
    getAllTerritories: builder.query<ApiResponse<TerritoryDto[]>, void>({
      query: () => ({ url: '/territories', method: 'GET' }),
      providesTags: ['Territory'],
    }),

    // Single territory by ID — all roles
    // GET /api/v1/territories/{id}
    getTerritoryById: builder.query<ApiResponse<TerritoryDto>, string>({
      query: (id) => ({ url: `/territories/${id}`, method: 'GET' }),
      providesTags: ['Territory'],
    }),

    // Create territory — Owner/Manager only
    // POST /api/v1/territories
    createTerritory: builder.mutation<ApiResponse<TerritoryDto>, CreateTerritoryRequest>({
      query: (body) => ({
        url: '/territories',
        method: 'POST',
        data: body,
      }),
      invalidatesTags: ['Territory'],
    }),

    // Update territory — Owner/Manager only
    // PUT /api/v1/territories/{id}
    updateTerritory: builder.mutation<ApiResponse<TerritoryDto>, { id: string; body: UpdateTerritoryRequest }>({
      query: ({ id, body }) => ({
        url: `/territories/${id}`,
        method: 'PUT',
        data: body,
      }),
      invalidatesTags: ['Territory'],
    }),

    // Deactivate territory — Owner/Manager only
    // PATCH /api/v1/territories/{id}/deactivate
    deactivateTerritory: builder.mutation<ApiResponse<void>, string>({
      query: (id) => ({
        url: `/territories/${id}/deactivate`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Territory'],
    }),

  }),
})

export const {
  useGetAllTerritoriesQuery,
  useGetTerritoryByIdQuery,
  useCreateTerritoryMutation,
  useUpdateTerritoryMutation,
  useDeactivateTerritoryMutation,
} = territoriesApi