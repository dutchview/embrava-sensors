import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase, Event } from '@/lib/db';

/**
 * DELETE /api/events
 *
 * Delete all events from the database.
 *
 * Returns the count of deleted events.
 */
export async function DELETE() {
  try {
    await connectToDatabase();

    const result = await Event.deleteMany({});

    return NextResponse.json({
      success: true,
      deletedCount: result.deletedCount,
      message: `Successfully deleted ${result.deletedCount} events`,
    });
  } catch (error) {
    console.error('Error deleting events:', error);
    return NextResponse.json(
      { error: 'Failed to delete events' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/events
 *
 * List events with pagination and optional filters.
 *
 * Query parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 * - deskSignId: Filter by DeskSignID
 * - action: Filter by booking action (CREATE, UPDATE, CHECKIN, CHECKOUT, CLEANED)
 * - startDate: Filter events after this date (ISO string)
 * - endDate: Filter events before this date (ISO string)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Pagination
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;

    // Filters
    const deskSignId = searchParams.get('deskSignId');
    const action = searchParams.get('action');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build query
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: Record<string, any> = {};

    if (deskSignId) {
      query.deskSignId = deskSignId;
    }

    if (action) {
      query['booking.action'] = action;
    }

    if (startDate || endDate) {
      query.dateCreated = {};
      if (startDate) {
        query.dateCreated.$gte = new Date(startDate);
      }
      if (endDate) {
        query.dateCreated.$lte = new Date(endDate);
      }
    }

    await connectToDatabase();

    // Execute query with pagination
    const [events, totalCount] = await Promise.all([
      Event.find(query)
        .sort({ dateCreated: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Event.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      events,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}
