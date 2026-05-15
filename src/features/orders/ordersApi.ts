import { baseApi } from '@/app/baseApi'
import type { ApiResponse } from '@/types/api'
import type { OrderDto, CreateOrderRequest, UpdateOrderRequest } from '@/types/order'

export const ordersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // All orders — Owner/Manager only
    // GET /api/v1/orders
    getAllOrders: builder.query<ApiResponse<OrderDto[]>, void>({
      query: () => ({ url: '/orders', method: 'GET' }),
      providesTags: ['Order'],
    }),

    // Single order by ID — all roles
    // GET /api/v1/orders/{id}
    getOrderById: builder.query<ApiResponse<OrderDto>, string>({
      query: (id) => ({ url: `/orders/${id}`, method: 'GET' }),
      providesTags: ['Order'],
    }),

    // Orders by rep — all roles
    // GET /api/v1/orders/rep/{repId}
    getOrdersByRep: builder.query<ApiResponse<OrderDto[]>, string>({
      query: (repId) => ({ url: `/orders/rep/${repId}`, method: 'GET' }),
      providesTags: ['Order'],
    }),

    // Orders by chemist — all roles
    // GET /api/v1/orders/chemist/{chemistId}
    getOrdersByChemist: builder.query<ApiResponse<OrderDto[]>, string>({
      query: (chemistId) => ({
        url: `/orders/chemist/${chemistId}`,
        method: 'GET',
      }),
      providesTags: ['Order'],
    }),

    // Orders by stockist — Owner/Manager only
    // GET /api/v1/orders/stockist/{stockistId}
    getOrdersByStockist: builder.query<ApiResponse<OrderDto[]>, string>({
      query: (stockistId) => ({
        url: `/orders/stockist/${stockistId}`,
        method: 'GET',
      }),
      providesTags: ['Order'],
    }),

    // Create order — all roles
    // POST /api/v1/orders
    createOrder: builder.mutation<ApiResponse<OrderDto>, CreateOrderRequest>({
      query: (body) => ({
        url: '/orders',
        method: 'POST',
        data: body,
      }),
      invalidatesTags: ['Order'],
    }),

    // Update order items — PENDING status only, all roles
    // PUT /api/v1/orders/{id}
    updateOrder: builder.mutation<ApiResponse<OrderDto>, { id: string; body: UpdateOrderRequest }>({
      query: ({ id, body }) => ({
        url: `/orders/${id}`,
        method: 'PUT',
        data: body,
      }),
      invalidatesTags: ['Order'],
    }),

    // Update order status — Owner/Manager only
    // PATCH /api/v1/orders/{id}/status
    // Body: { status: 'CONFIRMED' | 'DISPATCHED' }
    // In ordersApi.ts change updateOrderStatus to:
    updateOrderStatus: builder.mutation<ApiResponse<OrderDto>, { id: string; status: string }>({
      query: ({ id, status }) => ({
        url: `/orders/${id}/status`,
        method: 'PATCH',
        params: { status }, // ← params not data
      }),
      invalidatesTags: ['Order'],
    }),
  }),
})

export const {
  useGetAllOrdersQuery,
  useGetOrderByIdQuery,
  useGetOrdersByRepQuery,
  useGetOrdersByChemistQuery,
  useGetOrdersByStockistQuery,
  useCreateOrderMutation,
  useUpdateOrderMutation,
  useUpdateOrderStatusMutation,
} = ordersApi
