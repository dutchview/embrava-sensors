import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase, Event, Employee } from '@/lib/db';
import { embravaClient } from '@/lib/embrava/client';
import type { EmbravaEvent, BookingRequest } from '@/lib/embrava/types';

/**
 * POST /api/embrava/events
 *
 * Webhook endpoint called BY Embrava to send us events.
 * Events include booking actions and user status changes.
 */
export async function POST(request: NextRequest) {
  // Verify webhook secret
  const secret = request.headers.get('secret');
  const expectedSecret = process.env.WEBHOOK_SECRET;

  if (!expectedSecret || secret !== expectedSecret) {
    console.warn('Unauthorized webhook call - invalid secret');
    const response = { ID: 1, Message: 'Unauthorized' };
    console.log('Sending response:', JSON.stringify(response, null, 2));
    return NextResponse.json(response, { status: 401 });
  }

  try {
    const body: EmbravaEvent = await request.json();
    console.log('Received event from Embrava:', JSON.stringify(body, null, 2));

    // Connect to database
    await connectToDatabase();

    // Create and save the event
    const event = new Event({
      dateCreated: new Date(body.dateCreated),
      deskSignId: body.DeskSignID,
      booking: body.booking
        ? {
          id: body.booking.ID,
          startTime: body.booking.startTime ? new Date(body.booking.startTime) : null,
          endTime: body.booking.endTime ? new Date(body.booking.endTime) : null,
          badgeNumber: body.booking.badgeNumber || '',
          employeeId: body.booking.employeeID || '',
          action: body.booking.Action,
          deskId: body.booking.deskId || '',
        }
        : null,
      status: body.status
        ? {
          state: body.status.state,
          value: parseInt(body.status.value, 10),
        }
        : null,
      rawPayload: body,
    });

    await event.save();
    console.log(`Event saved: ${event._id}`);

    // Check if this is a CREATE action - validate the employee and create booking
    if (body.booking?.Action === 'CREATE' && body.booking?.badgeNumber) {
      const employee = await Employee.findOne({ badgeNumber: body.booking.badgeNumber });

      if (!employee) {
        console.log(`Unknown badge number: ${body.booking.badgeNumber} - rejecting check-in`);
        const response = {
          ID: 1,
          Message: `Unknown user - badge number ${body.booking.badgeNumber} is not registered. Check-in denied.`,
        };
        console.log('Sending response:', JSON.stringify(response, null, 2));
        return NextResponse.json(response);
      }

      console.log(`Employee found: ${employee.firstName} ${employee.lastName} (${employee.email})`);

      // Create booking in Embrava
      const now = new Date();
      const endOfDay = new Date(now);
      endOfDay.setHours(18, 0, 0, 0);

      // Generate a random booking ID
      const bookingId = `BK-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      // Format dates as "yyyy-MM-ddTHH:mm:ssZ"
      const formatDate = (date: Date): string => {
        return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
      };

      const bookingRequest: BookingRequest = {
        DeskSignID: body.DeskSignID,
        BookingID: bookingId,
        FirstName: employee.firstName,
        LastName: employee.lastName,
        StartTime: formatDate(now),
        EndTime: formatDate(endOfDay),
        CheckedIn: 1,
        Cancel: 0,
        BadgeNumber: body.booking.badgeNumber,
        EmployeeId: employee.employeeId,
      };

      try {
        await embravaClient.createBooking(bookingRequest);
        console.log(`Booking created in Embrava: ${bookingId} for ${employee.firstName} ${employee.lastName}`);
      } catch (bookingError) {
        console.error('Failed to create booking in Embrava:', bookingError);
        const response = {
          ID: 1,
          Message: 'Failed to create booking in Embrava',
        };
        console.log('Sending response:', JSON.stringify(response, null, 2));
        return NextResponse.json(response);
      }
    }

    // Return success response in Embrava's expected format
    const response = {
      ID: 0,
      Message: 'Workspace event successfully received',
    };
    console.log('Sending response:', JSON.stringify(response, null, 2));
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error processing event:', error);
    const response = {
      ID: 1,
      Message: 'Error processing event',
    };
    console.log('Sending response:', JSON.stringify(response, null, 2));
    return NextResponse.json(response, { status: 500 });
  }
}
