"use client";

import { Button } from "@/components/ui/button";
import { BookingTable } from "@/components/bookings/booking-table";
import { useBookings } from "@/lib/hooks";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function BookingsPage() {
  const router = useRouter();
  const { bookings, isLoading, mutate } = useBookings();

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Bookings</h1>
          <p className="text-muted-foreground mt-2">
            Manage desk bookings from Embrava DMS
          </p>
        </div>
        <Button onClick={() => router.push("/bookings/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Create Booking
        </Button>
      </div>

      <BookingTable bookings={bookings} onDelete={mutate} />
    </div>
  );
}
