'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useEmployees } from '@/lib/hooks/use-employees';
import { Plus, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface NewBookingDialogProps {
  workplaceId: string;
  deskSignId: string;
  onBookingCreated: () => void;
}

export function NewBookingDialog({
  workplaceId,
  deskSignId,
  onBookingCreated,
}: NewBookingDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { employees, isLoading: employeesLoading } = useEmployees();

  // Generate a new booking ID when dialog opens
  const [bookingId, setBookingId] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setBookingId(`BK-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);
      setSelectedEmployeeId('');
      setSelectedDate(new Date());
      setStartTime('09:00');
      setEndTime('18:00');
      setError(null);
    }
  }, [open]);

  const selectedEmployee = employees.find(
    (e) => e._id?.toString() === selectedEmployeeId
  );

  const validateForm = (): string | null => {
    if (!selectedEmployeeId) {
      return 'Please select an employee';
    }
    if (!selectedDate) {
      return 'Please select a date';
    }
    if (!startTime || !endTime) {
      return 'Please select start and end times';
    }

    // Create full datetime objects for comparison
    const startDateTime = new Date(selectedDate);
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    startDateTime.setHours(startHours, startMinutes, 0, 0);

    const endDateTime = new Date(selectedDate);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    endDateTime.setHours(endHours, endMinutes, 0, 0);

    if (endDateTime <= startDateTime) {
      return 'End time must be after start time';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!selectedEmployee || !selectedDate) return;

    setIsSubmitting(true);
    setError(null);

    // Build datetime strings
    const startDateTime = new Date(selectedDate);
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    startDateTime.setHours(startHours, startMinutes, 0, 0);

    const endDateTime = new Date(selectedDate);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    endDateTime.setHours(endHours, endMinutes, 0, 0);

    const formatDateTime = (date: Date): string => {
      return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
    };

    try {
      const response = await fetch(`/api/workplaces/${workplaceId}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          firstName: selectedEmployee.firstName,
          lastName: selectedEmployee.lastName,
          badgeNumber: selectedEmployee.badgeNumber,
          employeeId: selectedEmployee.employeeId,
          startTime: formatDateTime(startDateTime),
          endTime: formatDateTime(endDateTime),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create booking');
      }

      setOpen(false);
      onBookingCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create booking');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate time options (every 15 minutes)
  const timeOptions = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      const time = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      timeOptions.push(time);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          New Booking
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Booking</DialogTitle>
          <DialogDescription>
            Create a new booking for this workplace.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* DeskSignId - readonly */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="deskSignId" className="text-right">
                DeskSign ID
              </Label>
              <Input
                id="deskSignId"
                value={deskSignId}
                readOnly
                className="col-span-3 bg-muted"
              />
            </div>

            {/* BookingId - readonly */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="bookingId" className="text-right">
                Booking ID
              </Label>
              <Input
                id="bookingId"
                value={bookingId}
                readOnly
                className="col-span-3 bg-muted font-mono text-sm"
              />
            </div>

            {/* Employee selector */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="employee" className="text-right">
                Employee *
              </Label>
              <Select
                value={selectedEmployeeId}
                onValueChange={setSelectedEmployeeId}
                disabled={employeesLoading}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select an employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem
                      key={employee._id?.toString()}
                      value={employee._id?.toString() || ''}
                    >
                      {employee.firstName} {employee.lastName} ({employee.employeeId})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Show selected employee details */}
            {selectedEmployee && (
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="col-span-1" />
                <div className="col-span-3 text-sm text-muted-foreground">
                  Badge: {selectedEmployee.badgeNumber}
                </div>
              </div>
            )}

            {/* Date picker */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'col-span-3 justify-start text-left font-normal',
                      !selectedDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Time pickers */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Start Time *</Label>
              <Select value={startTime} onValueChange={setStartTime}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select start time" />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map((time) => (
                    <SelectItem key={`start-${time}`} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">End Time *</Label>
              <Select value={endTime} onValueChange={setEndTime}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select end time" />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map((time) => (
                    <SelectItem key={`end-${time}`} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Error message */}
            {error && (
              <div className="col-span-4 text-sm text-destructive text-center">
                {error}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Booking'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
