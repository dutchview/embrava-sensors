"use client";

import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import type { BookingWithWorkplace } from "@/lib/hooks/use-bookings";

interface BookingTableProps {
  bookings: BookingWithWorkplace[];
  onDelete: () => void;
}

export function BookingTable({ bookings, onDelete }: BookingTableProps) {
  const router = useRouter();

  const handleDelete = async (booking: BookingWithWorkplace) => {
    const name = `${booking.FirstName} ${booking.LastName}`;
    if (!confirm(`Are you sure you want to delete booking for ${name}?`)) {
      return;
    }

    try {
      const response = await fetch(
        `/api/bookings/${booking.RMSBookingID}?deskSignId=${booking.DeskSignID}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete booking");
      }

      toast.success("Booking deleted successfully");
      onDelete();
    } catch (error) {
      console.error("Error deleting booking:", error);
      toast.error("Failed to delete booking");
    }
  };

  if (bookings.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No bookings found. Create your first booking to get started.
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee</TableHead>
            <TableHead>Workplace</TableHead>
            <TableHead>Start Time</TableHead>
            <TableHead>End Time</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[140px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bookings.map((booking) => {
            // Validate dates to prevent invalid date errors
            const startDate = booking.StartTime
              ? new Date(booking.StartTime)
              : null;
            const endDate = booking.EndTime ? new Date(booking.EndTime) : null;
            const now = new Date();

            // Check if dates are valid
            const hasValidDates =
              startDate &&
              endDate &&
              !isNaN(startDate.getTime()) &&
              !isNaN(endDate.getTime());
            const isActive =
              hasValidDates && now >= startDate && now <= endDate;
            const isPast = hasValidDates && now > endDate;

            return (
              <TableRow key={booking.RMSBookingID}>
                <TableCell className="font-medium">
                  {booking.FirstName} {booking.LastName}
                  {booking.IsCheckedIn && (
                    <Badge variant="outline" className="ml-2 text-xs">
                      Checked In
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {booking.workplace?.deskName || booking.DeskSignID}
                </TableCell>
                <TableCell>
                  {startDate && hasValidDates
                    ? format(startDate, "MMM d, yyyy h:mm a")
                    : "N/A"}
                </TableCell>
                <TableCell>
                  {endDate && hasValidDates
                    ? format(endDate, "MMM d, yyyy h:mm a")
                    : "N/A"}
                </TableCell>
                <TableCell>
                  {isActive ? (
                    <Badge variant="default">Active</Badge>
                  ) : isPast ? (
                    <Badge variant="secondary">Past</Badge>
                  ) : (
                    <Badge variant="outline">Upcoming</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        router.push(
                          `/bookings/${booking.RMSBookingID}?deskSignId=${booking.DeskSignID}`
                        )
                      }
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(booking)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
