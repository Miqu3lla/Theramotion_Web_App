import { QueryClient } from '@tanstack/react-query'

//tanstack query setup
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, //5 minutes until expiry
      retry: 1,
    },
  },
})
