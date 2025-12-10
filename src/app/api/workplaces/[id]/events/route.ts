import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase, Event, Workplace } from '@/lib/db';

/**
 * GET /api/workplaces/[id]/events
 *
 * Get events for a specific workplace by its ID or deskSignId.
 *
 * Query parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;

    // Pagination
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;

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

    // Query events by deskSignId
    const query = { deskSignId: workplace.deskSignId };

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
    console.error('Error fetching workplace events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}
