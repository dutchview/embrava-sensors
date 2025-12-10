'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, User, Clock, Calendar } from 'lucide-react';

interface Employee {
  firstName: string;
  lastName: string;
  email: string;
  employeeId: string;
}

interface Booking {
  id: number;
  rmsBookingId: string;
  firstName: string;
  lastName: string;
  isCheckedIn: boolean;
  startTime: string;
  endTime: string;
  timezone: string;
  badgeNumber: string;
  employeeId: string;
  deskSignId: string;
  employee?: Employee | null;
}

interface WorkplaceBookingsProps {
  workplaceId: string;
}

export function WorkplaceBookings({ workplaceId }: WorkplaceBookingsProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/workplaces/${workplaceId}/bookings`);
      if (!response.ok) {
        throw new Error('Failed to fetch bookings');
      }
      const data = await response.json();
      setBookings(data.bookings || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch bookings');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [workplaceId]);

  const formatTime = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <Skeleton className="h-9 w-24" />
        </div>
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive mb-4">{error}</p>
        <Button onClick={fetchBookings} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={fetchBookings} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {bookings.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No active bookings for this workplace.
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => (
            <Card key={booking.id || booking.rmsBookingId}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-5 w-5" />
                    {booking.firstName} {booking.lastName}
                  </CardTitle>
                  <Badge variant={booking.isCheckedIn ? 'default' : 'secondary'}>
                    {booking.isCheckedIn ? 'Checked In' : 'Not Checked In'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">Date</p>
                      <p className="font-medium">{formatDate(booking.startTime)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">Time</p>
                      <p className="font-medium">
                        {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Badge Number</p>
                    <p className="font-medium font-mono">{booking.badgeNumber || '-'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Booking ID</p>
                    <p className="font-medium font-mono text-xs">{booking.rmsBookingId || '-'}</p>
                  </div>
                </div>

                {booking.employee && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-2">Employee Details (from database)</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Name</p>
                        <p className="font-medium">
                          {booking.employee.firstName} {booking.employee.lastName}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Email</p>
                        <p className="font-medium">{booking.employee.email}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Employee ID</p>
                        <p className="font-medium font-mono">{booking.employee.employeeId}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
