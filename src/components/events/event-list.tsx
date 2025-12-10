'use client';

import { useEvents } from '@/lib/hooks/use-events';
import { EventCard } from './event-card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useState } from 'react';
import { RefreshCw, Trash2 } from 'lucide-react';

const ACTIONS = ['CREATE', 'UPDATE', 'CHECKIN', 'CHECKOUT', 'CLEANED'];

export function EventList() {
  const [page, setPage] = useState(1);
  const [deskSignId, setDeskSignId] = useState('');
  const [action, setAction] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { events, pagination, isLoading, mutate } = useEvents({
    page,
    limit: 20,
    deskSignId: deskSignId || undefined,
    action: action || undefined,
  });

  const handleRefresh = () => {
    mutate();
  };

  const handleDeleteAll = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch('/api/events', { method: 'DELETE' });
      if (!response.ok) {
        throw new Error('Failed to delete events');
      }
      setDeleteDialogOpen(false);
      setPage(1);
      mutate();
    } catch (error) {
      console.error('Error deleting events:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <Input
          placeholder="Filter by DeskSignID"
          value={deskSignId}
          onChange={(e) => {
            setDeskSignId(e.target.value);
            setPage(1);
          }}
          className="w-48"
        />
        <Select
          value={action}
          onValueChange={(value) => {
            setAction(value === 'all' ? '' : value);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All actions</SelectItem>
            {ACTIONS.map((a) => (
              <SelectItem key={a} value={a}>
                {a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4" />
        </Button>
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive" size="sm">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete All
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete All Events</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete all events? This action cannot be undone.
                {pagination && pagination.totalCount > 0 && (
                  <span className="block mt-2 font-medium text-foreground">
                    {pagination.totalCount} events will be permanently deleted.
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteAll}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete All'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {pagination && (
          <span className="text-sm text-muted-foreground ml-auto">
            Showing {events.length} of {pagination.totalCount} events
          </span>
        )}
      </div>

      {/* Events */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No events found. Events will appear here when Embrava sends them.
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
