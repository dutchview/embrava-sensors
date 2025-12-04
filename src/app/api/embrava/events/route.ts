import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase, Event } from '@/lib/db';
import type { EmbravaEvent } from '@/lib/embrava/types';

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
    return NextResponse.json(
      { ID: 1, Message: 'Unauthorized' },
      { status: 401 }
    );
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

    // Return success response in Embrava's expected format
    return NextResponse.json({
      ID: 0,
      Message: 'Workspace event successfully received',
    });
  } catch (error) {
    console.error('Error processing event:', error);
    return NextResponse.json(
      {
        ID: 1,
        Message: 'Error processing event',
      },
      { status: 500 }
    );
  }
}
