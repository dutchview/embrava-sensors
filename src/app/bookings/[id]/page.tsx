"use client";

import { use, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Trash2,
  Calendar,
  Clock,
  User,
  MapPin,
  CreditCard,
  CheckCircle2,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import type { BookingResponse } from "@/lib/embrava/types";

export default function BookingDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const deskSignId = searchParams.get("deskSignId");
  const router = useRouter();
  const [booking, setBooking] = useState<BookingResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        // Fetch all bookings and find the one we need
        const response = await fetch("/api/bookings");
        if (!response.ok) throw new Error("Failed to fetch bookings");

        const bookings = await response.json();
        const found = bookings.find(
          (b: BookingResponse) => b.RMSBookingID === id
        );

        setBooking(found || null);
      } catch (error) {
        console.error("Error fetching booking:", error);
        toast.error("Failed to load booking details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBooking();
  }, [id]);

  const handleDelete = async () => {
    if (!booking || !deskSignId) return;

    const name = `${booking.FirstName} ${booking.LastName}`;
    if (!confirm(`Are you sure you want to delete booking for ${name}?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(
        `/api/bookings/${booking.RMSBookingID}?deskSignId=${deskSignId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete booking");
      }

      toast.success("Booking deleted successfully");
      router.push("/bookings");
    } catch (error) {
      console.error("Error deleting booking:", error);
      toast.error("Failed to delete booking");
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <Skeleton className="h-8 w-48 mb-8" />
        <Skeleton className="h-96 w-full max-w-3xl" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="container mx-auto py-8">
        <Button
          variant="ghost"
          onClick={() => router.push("/bookings")}
          className="mb-8"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Bookings
        </Button>
        <div className="text-center">
          <h1 className="text-2xl font-bold">Booking not found</h1>
          <p className="text-muted-foreground mt-2">
            The booking you're looking for doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  const startDate = new Date(booking.StartTime);
  const endDate = new Date(booking.EndTime);
  const now = new Date();
  const isActive = now >= startDate && now <= endDate;
  const isPast = now > endDate;

  return (
    <div className="container mx-auto py-8">
      <Button
        variant="ghost"
        onClick={() => router.push("/bookings")}
        className="mb-8"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Bookings
      </Button>

      <div className="max-w-3xl">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold">Booking Details</h1>
            <p className="text-muted-foreground mt-2">
              ID: {booking.RMSBookingID}
            </p>
          </div>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Booking
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {booking.FirstName} {booking.LastName}
              </CardTitle>
              <div className="flex gap-2">
                {booking.IsCheckedIn && (
                  <Badge variant="default">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Checked In
                  </Badge>
                )}
                {isActive ? (
                  <Badge variant="default">Active</Badge>
                ) : isPast ? (
                  <Badge variant="secondary">Past</Badge>
                ) : (
                  <Badge variant="outline">Upcoming</Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
              {/* Employee Info */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Employee ID</p>
                    <p className="text-sm text-muted-foreground">
                      {booking.EmployeeId || "N/A"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CreditCard className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Badge Number</p>
                    <p className="text-sm text-muted-foreground">
                      {booking.BadgeNumber || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Desk Sign ID</p>
                  <p className="text-sm text-muted-foreground">
                    {booking.DeskSignID}
                  </p>
                </div>
              </div>

              {/* Timing */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Start Time</p>
                    <p className="text-sm text-muted-foreground">
                      {format(startDate, "PPPP")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(startDate, "p")}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">End Time</p>
                    <p className="text-sm text-muted-foreground">
                      {format(endDate, "PPPP")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(endDate, "p")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Timezone */}
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Timezone</p>
                  <p className="text-sm text-muted-foreground">
                    {booking.Timezone}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
