import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase, Workplace } from '@/lib/db';
import { embravaClient } from '@/lib/embrava/client';
import type { BookingRequest } from '@/lib/embrava/types';

interface BookingActionBody {
  action: 'cancel' | 'checkin' | 'checkout';
  firstName: string;
  lastName: string;
  badgeNumber: string;
  employeeId: string;
  startTime: string;
  endTime: string;
}

/**
 * POST /api/workplaces/[id]/bookings/[bookingId]
 *
 * Perform an action on a booking (cancel, checkin, checkout).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; bookingId: string }> }
) {
  try {
    const { id, bookingId } = await params;
    const body: BookingActionBody = await request.json();

    await connectToDatabase();

    // Find the workplace to get the deskSignId
    const workplace = await Workplace.findOne({
      $or: [
        { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null },
        { deskSignId: id },
      ],
    });

    if (!workplace) {
      return NextResponse.json(
        { error: 'Workplace not found' },
        { status: 404 }
      );
    }

    // Build the booking request based on the action
    const bookingRequest: BookingRequest = {
      DeskSignID: workplace.deskSignId,
      BookingID: bookingId,
      FirstName: body.firstName,
      LastName: body.lastName,
      StartTime: body.startTime,
      EndTime: body.endTime,
      BadgeNumber: body.badgeNumber,
      EmployeeId: body.employeeId,
      CheckedIn: body.action === 'checkin' ? 1 : 0,
      Cancel: body.action === 'cancel' ? 1 : 0,
    };

    console.log(`Performing ${body.action} on booking ${bookingId}:`, JSON.stringify(bookingRequest, null, 2));

    await embravaClient.createBooking(bookingRequest);

    const actionLabels = {
      cancel: 'cancelled',
      checkin: 'checked in',
      checkout: 'checked out',
    };

    return NextResponse.json({
      success: true,
      message: `Booking ${actionLabels[body.action]} successfully`,
    });
  } catch (error) {
    console.error('Error performing booking action:', error);
    return NextResponse.json(
      { error: 'Failed to perform booking action' },
      { status: 500 }
    );
  }
}
