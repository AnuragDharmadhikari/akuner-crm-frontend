import { baseApi } from '@/app/baseApi'
import type { ApiResponse } from '@/types/api'
import type { VisitDto, CreateVisitRequest, UpdateVisitRequest } from '@/types/visit'

export const visitApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // All visits — Owner/Manager only
    // GET /api/v1/visits
    getAllVisits: builder.query<ApiResponse<VisitDto[]>, void>({
      query: () => ({ url: '/visits', method: 'GET' }),
      providesTags: ['Visit'],
    }),

    // Single visit by ID — all roles
    // GET /api/v1/visits/{id}
    getVisitById: builder.query<ApiResponse<VisitDto>, string>({
      query: (id) => ({ url: `/visits/${id}`, method: 'GET' }),
      providesTags: ['Visit'],
    }),

    // Visits by rep — all roles
    // GET /api/v1/visits/rep/{repId}
    // REPs use this to see their own visits
    // Owner/Manager use this to filter by a specific rep
    getVisitsByRep: builder.query<ApiResponse<VisitDto[]>, string>({
      query: (repId) => ({ url: `/visits/rep/${repId}`, method: 'GET' }),
      providesTags: ['Visit'],
    }),

    // Create visit — all roles
    // POST /api/v1/visits
    createVisit: builder.mutation<ApiResponse<VisitDto>, CreateVisitRequest>({
      query: (body) => ({
        url: '/visits',
        method: 'POST',
        data: body,
      }),
      // Invalidates Visit tag so all visit lists auto-refetch
      invalidatesTags: ['Visit'],
    }),

    // Update visit — all roles
    // PUT /api/v1/visits/{id}
    updateVisit: builder.mutation<ApiResponse<VisitDto>, { id: string; body: UpdateVisitRequest }>({
      query: ({ id, body }) => ({
        url: `/visits/${id}`,
        method: 'PUT',
        data: body,
      }),
      invalidatesTags: ['Visit'],
    }),
  }),
})

export const {
  useGetAllVisitsQuery,
  useGetVisitByIdQuery,
  useGetVisitsByRepQuery,
  useCreateVisitMutation,
  useUpdateVisitMutation,
} = visitApi
