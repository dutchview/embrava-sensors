import useSWR from 'swr';
import type { IWorkplace } from '@/lib/db';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useWorkplaces() {
  const { data, error, isLoading, mutate } = useSWR<IWorkplace[]>(
    '/api/workplaces',
    fetcher
  );

  return {
    workplaces: data ?? [],
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

export function useWorkplace(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR<IWorkplace>(
    id ? `/api/workplaces/${id}` : null,
    fetcher
  );

  return {
    workplace: data,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}
