import useSWR from 'swr';
import type { IEmployee } from '@/lib/db';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useEmployees() {
    const { data, error, isLoading, mutate } = useSWR<IEmployee[]>(
        '/api/employees',
        fetcher
    );

    return {
        employees: data ?? [],
        isLoading,
        isError: !!error,
        error,
        mutate,
    };
}

export function useEmployee(id: string | null) {
    const { data, error, isLoading, mutate } = useSWR<IEmployee>(
        id ? `/api/employees/${id}` : null,
        fetcher
    );

    return {
        employee: data,
        isLoading,
        isError: !!error,
        error,
        mutate,
    };
}
