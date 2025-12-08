import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase, Workplace } from '@/lib/db';
import { embravaClient } from '@/lib/embrava';
import type { BookingResponse } from '@/lib/embrava/types';
import { randomUUID } from 'crypto';

/**
 * GET /api/bookings
 *
 * Get all bookings across all workplaces.
 */
export async function GET() {
    try {
        await connectToDatabase();

        // Get all workplaces
        const workplaces = await Workplace.find({});

        // Fetch bookings for each workplace
        const allBookings: (BookingResponse & { workplace?: { deskName: string; deskId: string } })[] = [];

        for (const workplace of workplaces) {
            try {
                const bookings = await embravaClient.getBookings(workplace.deskSignId);

                // Add workplace info to each booking
                const bookingsWithWorkplace = bookings.map((booking) => ({
                    ...booking,
                    workplace: {
                        deskName: workplace.deskName,
                        deskId: workplace.deskId,
                    },
                }));

                allBookings.push(...bookingsWithWorkplace);
            } catch (error) {
                console.error(`Error fetching bookings for ${workplace.deskSignId}:`, error);
                // Continue with other workplaces
            }
        }

        // Sort by start time (most recent first)
        allBookings.sort((a, b) => {
            const dateA = a.StartTime ? new Date(a.StartTime).getTime() : 0;
            const dateB = b.StartTime ? new Date(b.StartTime).getTime() : 0;
            return dateB - dateA;
        });

        return NextResponse.json(allBookings);
    } catch (error) {
        console.error('Error fetching bookings:', error);
        return NextResponse.json(
            { error: 'Failed to fetch bookings' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/bookings
 *
 * Create a new booking.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate required fields
        const { deskSignId, firstName, lastName, startTime, endTime, badgeNumber, employeeId } = body;

        if (!deskSignId || !firstName || !lastName || !startTime || !endTime) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        await connectToDatabase();

        // Verify workplace exists
        const workplace = await Workplace.findOne({ deskSignId });
        if (!workplace) {
            return NextResponse.json(
                { error: 'Workplace not found' },
                { status: 404 }
            );
        }
        // Generate booking ID as UUID
        const bookingId = randomUUID();

        // Format datetime to Embrava's expected format: "yyyy-MM-ddTHH:mm:ssZ" (no milliseconds)
        const formatDateTime = (dateTimeLocal: string) => {
            // dateTimeLocal is in format "2025-12-08T08:00"
            // Convert to "2025-12-08T08:00:00Z" (without milliseconds)
            const date = new Date(dateTimeLocal);
            const isoString = date.toISOString(); // "2025-12-08T08:00:00.000Z"
            return isoString.replace(/\.\d{3}Z$/, 'Z'); // Remove .000 -> "2025-12-08T08:00:00Z"
        };

        // Create booking via Embrava API
        await embravaClient.createBooking({
            DeskSignID: deskSignId,
            BookingID: bookingId,
            FirstName: firstName,
            LastName: lastName,
            StartTime: formatDateTime(startTime),
            EndTime: formatDateTime(endTime),
            CheckedIn: 0,
            Cancel: 0,
            BadgeNumber: badgeNumber || '',
            EmployeeId: employeeId || '',
        });

        return NextResponse.json({ success: true, bookingId }, { status: 201 });
    } catch (error) {
        console.error('Error creating booking:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to create booking' },
            { status: 500 }
        );
    }
}
