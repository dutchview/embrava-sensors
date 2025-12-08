"use client";

import { BookingForm } from "@/components/bookings/booking-form";

export default function NewBookingPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Create Booking</h1>
        <p className="text-muted-foreground mt-2">
          Create a new desk booking in Embrava DMS
        </p>
      </div>

      <div className="max-w-2xl">
        <BookingForm />
      </div>
    </div>
  );
}
