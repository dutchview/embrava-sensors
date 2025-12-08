import { NextRequest, NextResponse } from 'next/server';
import { embravaClient } from '@/lib/embrava';

/**
 * DELETE /api/bookings/[id]
 *
 * Delete a booking by ID.
 * URL format: /api/bookings/[id]?deskSignId=xxx
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: bookingId } = await params;
        const { searchParams } = new URL(request.url);
        const deskSignId = searchParams.get('deskSignId');

        if (!deskSignId) {
            return NextResponse.json(
                { error: 'deskSignId query parameter is required' },
                { status: 400 }
            );
        }

        // Delete booking via Embrava API
        await embravaClient.deleteBooking(bookingId, deskSignId);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting booking:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to delete booking' },
            { status: 500 }
        );
    }
}
