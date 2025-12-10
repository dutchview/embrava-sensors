'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { RefreshCw } from 'lucide-react';
import { EventCard } from '@/components/events/event-card';
import type { IEvent } from '@/lib/db';

interface Pagination {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface WorkplaceEventsProps {
  workplaceId: string;
}

export function WorkplaceEvents({ workplaceId }: WorkplaceEventsProps) {
  const [events, setEvents] = useState<IEvent[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/workplaces/${workplaceId}/events?page=${page}&limit=20`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      const data = await response.json();
      setEvents(data.events || []);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch events');
    } finally {
      setIsLoading(false);
    }
  }, [workplaceId, page]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    const interval = setInterval(fetchEvents, 5000);
    return () => clearInterval(interval);
  }, [fetchEvents]);

  if (isLoading && events.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-9 w-24" />
        </div>
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive mb-4">{error}</p>
        <Button onClick={fetchEvents} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        {pagination && (
          <Badge variant="secondary">
            {pagination.totalCount} events
          </Badge>
        )}
        <Button onClick={fetchEvents} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No events found for this workplace.
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <EventCard key={event._id?.toString()} event={event} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-4">
          <Button
            variant="outline"
            onClick={() => setPage(page - 1)}
            disabled={!pagination.hasPrevPage}
          >
            Previous
          </Button>
          <span className="flex items-center px-4 text-sm">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage(page + 1)}
            disabled={!pagination.hasNextPage}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
