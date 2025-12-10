import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase, Workplace, Employee } from '@/lib/db';
import { embravaClient } from '@/lib/embrava/client';
import type { BookingResponse, BookingRequest } from '@/lib/embrava/types';

interface EnrichedBooking extends BookingResponse {
  employee?: {
    firstName: string;
    lastName: string;
    email: string;
    employeeId: string;
  } | null;
}

/**
 * GET /api/workplaces/[id]/bookings
 *
 * Get current bookings for a specific workplace by its ID or deskSignId.
 * Fetches directly from Embrava API and enriches with employee information.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    // Fetch bookings from Embrava
    const bookings = await embravaClient.getBookings(workplace.deskSignId);

    // Enrich bookings with employee information
    const enrichedBookings: EnrichedBooking[] = await Promise.all(
      bookings.map(async (booking) => {
        let employee = null;

        if (booking.badgeNumber) {
          const foundEmployee = await Employee.findOne({
            badgeNumber: booking.badgeNumber,
          }).lean();

          if (foundEmployee) {
            employee = {
              firstName: foundEmployee.firstName,
              lastName: foundEmployee.lastName,
              email: foundEmployee.email,
              employeeId: foundEmployee.employeeId,
            };
          }
        }

        return {
          ...booking,
          employee,
        };
      })
    );

    return NextResponse.json({
      bookings: enrichedBookings,
      deskSignId: workplace.deskSignId,
      deskName: workplace.deskName,
    });
  } catch (error) {
    console.error('Error fetching workplace bookings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}

interface CreateBookingBody {
  bookingId: string;
  firstName: string;
  lastName: string;
  badgeNumber: string;
  employeeId: string;
  startTime: string;
  endTime: string;
}

/**
 * POST /api/workplaces/[id]/bookings
 *
 * Create a new booking for a specific workplace.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: CreateBookingBody = await request.json();

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

    // Build the booking request
    const bookingRequest: BookingRequest = {
      DeskSignID: workplace.deskSignId,
      BookingID: body.bookingId,
      FirstName: body.firstName,
      LastName: body.lastName,
      StartTime: body.startTime,
      EndTime: body.endTime,
      BadgeNumber: body.badgeNumber,
      EmployeeId: body.employeeId,
      CheckedIn: 0,
      Cancel: 0,
    };

    console.log('Creating new booking:', JSON.stringify(bookingRequest, null, 2));

    await embravaClient.createBooking(bookingRequest);

    return NextResponse.json({
      success: true,
      message: 'Booking created successfully',
      bookingId: body.bookingId,
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    );
  }
}
