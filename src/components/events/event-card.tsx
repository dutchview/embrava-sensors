'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { IEvent } from '@/lib/db';

interface EventCardProps {
  event: IEvent;
}

const actionColors: Record<string, string> = {
  CREATE: 'bg-green-500',
  UPDATE: 'bg-blue-500',
  CHECKIN: 'bg-purple-500',
  CHECKOUT: 'bg-orange-500',
  CLEANED: 'bg-teal-500',
};

const statusColors: Record<string, string> = {
  AVAILABLE: 'bg-green-500',
  AWAY: 'bg-yellow-500',
  BUSY: 'bg-red-500',
  DND: 'bg-red-700',
  ONCALL: 'bg-orange-500',
  OFFLINE: 'bg-gray-500',
};

export function EventCard({ event }: EventCardProps) {
  const [expanded, setExpanded] = useState(false);

  const eventType = event.booking ? 'Booking' : event.status ? 'Status' : 'Unknown';
  const action = event.booking?.action || event.status?.state || 'N/A';
  const colorClass = event.booking
    ? actionColors[event.booking.action] || 'bg-gray-500'
    : event.status
    ? statusColors[event.status.state] || 'bg-gray-500'
    : 'bg-gray-500';

  return (
    <Card>
      <CardHeader className="py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge className={colorClass}>{action}</Badge>
            <Badge variant="outline">{eventType}</Badge>
            <span className="text-sm text-muted-foreground">
              DeskSign: {event.deskSignId}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {format(new Date(event.dateCreated), 'MMM d, yyyy HH:mm:ss')}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      {expanded && (
        <CardContent className="pt-0">
          {event.booking && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Booking Details</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Booking ID:</span>{' '}
                  {event.booking.id || 'N/A'}
                </div>
                <div>
                  <span className="text-muted-foreground">Desk ID:</span>{' '}
                  {event.booking.deskId || 'N/A'}
                </div>
                <div>
                  <span className="text-muted-foreground">Start:</span>{' '}
                  {event.booking.startTime
                    ? format(new Date(event.booking.startTime), 'MMM d, yyyy HH:mm')
                    : 'N/A'}
                </div>
                <div>
                  <span className="text-muted-foreground">End:</span>{' '}
                  {event.booking.endTime
                    ? format(new Date(event.booking.endTime), 'MMM d, yyyy HH:mm')
                    : 'N/A'}
                </div>
                <div>
                  <span className="text-muted-foreground">Badge #:</span>{' '}
                  {event.booking.badgeNumber || 'N/A'}
                </div>
                <div>
                  <span className="text-muted-foreground">Employee ID:</span>{' '}
                  {event.booking.employeeId || 'N/A'}
                </div>
              </div>
            </div>
          )}
          {event.status && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Status Details</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">State:</span>{' '}
                  {event.status.state}
                </div>
                <div>
                  <span className="text-muted-foreground">Value:</span>{' '}
                  {event.status.value}
                </div>
              </div>
            </div>
          )}
          <div className="mt-4">
            <h4 className="font-semibold text-sm mb-2">Raw Payload</h4>
            <pre className="bg-muted p-3 rounded-md text-xs overflow-auto max-h-64">
              {JSON.stringify(event.rawPayload, null, 2)}
            </pre>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
