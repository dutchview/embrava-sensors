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

    // Handle CREATE, CHECKIN, and CHECKOUT actions - all require valid badge number
    const action = body.booking?.Action;
    if (action === 'CREATE' || action === 'CHECKIN' || action === 'CHECKOUT') {
      // Check for badge number
      if (!body.booking?.badgeNumber) {
        console.log(`Missing badge number for ${action} action`);
        const response = {
          ID: 1,
          Message: `Badge number is required for ${action.toLowerCase()} action.`,
        };
        console.log('Sending response:', JSON.stringify(response, null, 2));
        return NextResponse.json(response);
      }

      // Validate badge number exists in our system
      const employee = await Employee.findOne({ badgeNumber: body.booking.badgeNumber });

      if (!employee) {
        console.log(`Unknown badge number: ${body.booking.badgeNumber} - rejecting ${action.toLowerCase()}`);
        const response = {
          ID: 1,
          Message: `Unknown user - badge number ${body.booking.badgeNumber} is not registered.`,
        };
        console.log('Sending response:', JSON.stringify(response, null, 2));
        return NextResponse.json(response);
      }

      console.log(`Employee found: ${employee.firstName} ${employee.lastName} (${employee.email})`);

      // Format dates as "yyyy-MM-ddTHH:mm:ssZ"
      const formatDate = (date: Date): string => {
        return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
      };

      // Calculate end time: default 18:00, but extend to 22:00 if checking in within 2 hours of 18:00
      const getEndTime = (now: Date): Date => {
        const endTime = new Date(now);
        const hour = now.getHours();

        // If checking in at 16:00 or later (within 2 hours of 18:00), extend to 22:00
        if (hour >= 16) {
          endTime.setHours(22, 0, 0, 0);
        } else {
          endTime.setHours(18, 0, 0, 0);
        }

        return endTime;
      };

      const now = new Date();

      try {
        if (action === 'CREATE') {
          // For CREATE: Find existing future booking for this badge number today and check in
          const bookings = await embravaClient.getBookings(body.DeskSignID);

          // Get start of today in local time
          const startOfToday = new Date(now);
          startOfToday.setHours(0, 0, 0, 0);
          const endOfToday = new Date(now);
          endOfToday.setHours(23, 59, 59, 999);

          // Filter bookings for this badge number that are today and in the future (or ongoing)
          const futureBookingsForUser = bookings
            .filter((booking) => {
              const bookingStart = new Date(booking.startTime);
              const bookingEnd = new Date(booking.endTime);
              return (
                booking.badgeNumber === body.booking!.badgeNumber &&
                bookingStart >= startOfToday &&
                bookingStart <= endOfToday &&
                bookingEnd >= now // Booking hasn't ended yet
              );
            })
            .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

          if (futureBookingsForUser.length > 0) {
            // Take the most recent (earliest starting) future booking
            const bookingToCheckIn = futureBookingsForUser[0];
            console.log(`Found existing booking to check in: ${bookingToCheckIn.rmsBookingId}`);

            const bookingRequest: BookingRequest = {
              DeskSignID: body.DeskSignID,
              BookingID: bookingToCheckIn.rmsBookingId,
              FirstName: employee.firstName,
              LastName: employee.lastName,
              StartTime: formatDate(now), // Update start time to now
              EndTime: bookingToCheckIn.endTime,
              CheckedIn: 1,
              Cancel: 0,
              BadgeNumber: body.booking.badgeNumber,
              EmployeeId: employee.employeeId,
            };

            await embravaClient.createBooking(bookingRequest);
            console.log(`Check-in booking sent to Embrava: ${bookingToCheckIn.rmsBookingId} for ${employee.firstName} ${employee.lastName}`);
          } else {
            // No existing booking found, create a new one
            console.log('No existing booking found, creating new booking');
            const endTime = getEndTime(now);

            const bookingId = `BK-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

            const bookingRequest: BookingRequest = {
              DeskSignID: body.DeskSignID,
              BookingID: bookingId,
              FirstName: employee.firstName,
              LastName: employee.lastName,
              StartTime: formatDate(now),
              EndTime: formatDate(endTime),
              CheckedIn: 1,
              Cancel: 0,
              BadgeNumber: body.booking.badgeNumber,
              EmployeeId: employee.employeeId,
            };

            await embravaClient.createBooking(bookingRequest);
            console.log(`New check-in booking sent to Embrava: ${bookingId} for ${employee.firstName} ${employee.lastName}`);
          }
        } else if (action === 'CHECKIN') {
          // For CHECKIN: Update the existing booking with CheckedIn=1
          const hasValidBookingId = body.booking.ID && body.booking.ID !== '0';
          const bookingId = hasValidBookingId
            ? body.booking.ID
            : `BK-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

          const endTime = getEndTime(now);

          const bookingRequest: BookingRequest = {
            DeskSignID: body.DeskSignID,
            BookingID: bookingId,
            FirstName: employee.firstName,
            LastName: employee.lastName,
            StartTime: formatDate(now),
            EndTime: formatDate(endTime),
            CheckedIn: 1,
            Cancel: 0,
            BadgeNumber: body.booking.badgeNumber,
            EmployeeId: employee.employeeId,
          };

          await embravaClient.createBooking(bookingRequest);
          console.log(`Check-in booking sent to Embrava: ${bookingId} for ${employee.firstName} ${employee.lastName}`);
        } else if (action === 'CHECKOUT') {
          // For CHECKOUT: Cancel the booking by setting Cancelled=1
          const hasValidBookingId = body.booking.ID && body.booking.ID !== '0';

          if (!hasValidBookingId) {
            console.log('No valid booking ID for checkout');
            const response = {
              ID: 1,
              Message: 'Cannot check out - no valid booking ID provided.',
            };
            console.log('Sending response:', JSON.stringify(response, null, 2));
            return NextResponse.json(response);
          }

          const bookingRequest: BookingRequest = {
            DeskSignID: body.DeskSignID,
            BookingID: body.booking.ID,
            FirstName: employee.firstName,
            LastName: employee.lastName,
            StartTime: body.booking.startTime || formatDate(now),
            EndTime: body.booking.endTime || formatDate(now),
            CheckedIn: 0,
            Cancel: 1,
            BadgeNumber: body.booking.badgeNumber,
            EmployeeId: employee.employeeId,
          };

          await embravaClient.createBooking(bookingRequest);
          console.log(`Check-out (cancel) booking sent to Embrava: ${body.booking.ID} for ${employee.firstName} ${employee.lastName}`);
        }
      } catch (bookingError) {
        console.error('Failed to send booking to Embrava:', bookingError);
        const response = {
          ID: 1,
          Message: 'Failed to send booking to Embrava',
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
