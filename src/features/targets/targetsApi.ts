import { baseApi } from '@/app/baseApi'
import type { ApiResponse } from '@/types/api'
import type {
  CallTargetDto,
  CreateCallTargetRequest,
  UpdateCallTargetRequest,
} from '@/types/target'

export const targetsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    // Targets by rep — all roles
    // GET /api/v1/targets/rep/{repId}
    // REPs use this to see their own targets
    // Owner/Manager use this to view a specific rep's targets
    getTargetsByRep: builder.query<ApiResponse<CallTargetDto[]>, string>({
      query: (repId) => ({
        url: `/targets/rep/${repId}`,
        method: 'GET',
      }),
      providesTags: ['Analytics'],
    }),

    // Single target by ID — all roles
    // GET /api/v1/targets/{id}
    getTargetById: builder.query<ApiResponse<CallTargetDto>, string>({
      query: (id) => ({ url: `/targets/${id}`, method: 'GET' }),
      providesTags: ['Analytics'],
    }),

    // Target by rep + month + year — all roles
    // GET /api/v1/targets/rep/{repId}/month/{month}/year/{year}
    // Used to check if a target exists for a specific period
    getTargetByRepAndPeriod: builder.query<ApiResponse<CallTargetDto>,
      { repId: string; month: number; year: number }
    >({
      query: ({ repId, month, year }) => ({
        url: `/targets/rep/${repId}/month/${month}/year/${year}`,
        method: 'GET',
      }),
      providesTags: ['Analytics'],
    }),

    // Create target — Owner/Manager only
    // POST /api/v1/targets
    createTarget: builder.mutation<ApiResponse<CallTargetDto>, CreateCallTargetRequest>({
      query: (body) => ({
        url: '/targets',
        method: 'POST',
        data: body,
      }),
      invalidatesTags: ['Analytics'],
    }),

    // Update target — Owner/Manager only
    // PUT /api/v1/targets/{id}
    updateTarget: builder.mutation<ApiResponse<CallTargetDto>, { id: string; body: UpdateCallTargetRequest }>({
      query: ({ id, body }) => ({
        url: `/targets/${id}`,
        method: 'PUT',
        data: body,
      }),
      invalidatesTags: ['Analytics'],
    }),

  }),
})

export const {
  useGetTargetsByRepQuery,
  useGetTargetByIdQuery,
  useGetTargetByRepAndPeriodQuery,
  useCreateTargetMutation,
  useUpdateTargetMutation,
} = targetsApi