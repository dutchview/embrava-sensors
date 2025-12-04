import useSWR from 'swr';
import type { IEvent } from '@/lib/db';

interface EventsResponse {
  events: IEvent[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

interface UseEventsParams {
  page?: number;
  limit?: number;
  deskSignId?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useEvents(params: UseEventsParams = {}) {
  const { page = 1, limit = 20, deskSignId, action, startDate, endDate } = params;

  const searchParams = new URLSearchParams();
  searchParams.set('page', page.toString());
  searchParams.set('limit', limit.toString());

  if (deskSignId) searchParams.set('deskSignId', deskSignId);
  if (action) searchParams.set('action', action);
  if (startDate) searchParams.set('startDate', startDate);
  if (endDate) searchParams.set('endDate', endDate);

  const { data, error, isLoading, mutate } = useSWR<EventsResponse>(
    `/api/events?${searchParams.toString()}`,
    fetcher,
    {
      refreshInterval: 5000, // Refresh every 5 seconds
    }
  );

  return {
    events: data?.events ?? [],
    pagination: data?.pagination,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}
