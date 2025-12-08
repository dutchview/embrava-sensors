import useSWR from 'swr';
import type { BookingResponse } from '@/lib/embrava/types';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export type BookingWithWorkplace = BookingResponse & {
    workplace?: {
        deskName: string;
        deskId: string;
    };
};

export function useBookings() {
    const { data, error, isLoading, mutate } = useSWR<BookingWithWorkplace[]>(
        '/api/bookings',
        fetcher
    );

    return {
        bookings: data ?? [],
        isLoading,
        isError: !!error,
        error,
        mutate,
    };
}
