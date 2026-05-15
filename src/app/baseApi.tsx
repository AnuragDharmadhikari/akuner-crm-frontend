import { createApi } from '@reduxjs/toolkit/query/react'
import { axiosBaseQuery } from '@/shared/api/axiosInstance'

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: axiosBaseQuery,
  tagTypes: [
    'User',
    'Doctor',
    'Territory',
    'Product',
    'Visit',
    'Stockist',
    'Order',
    'Invoice',
    'Payment',
    'Analytics',
    'Chemist',
    'Return',
    'Scheme',
    'Target',
    'Inventory',
  ],
  endpoints: () => ({}),
})