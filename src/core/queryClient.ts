import { QueryClient } from '@tanstack/react-query';

/**
 * No automatic retries: the Flutter app surfaces failures immediately with a
 * Retry affordance rather than silently retrying behind the user's back.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, staleTime: 0, refetchOnReconnect: true },
    mutations: { retry: false },
  },
});
