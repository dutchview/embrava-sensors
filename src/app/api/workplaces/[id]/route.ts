import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase, Workplace } from '@/lib/db';
import { z } from 'zod';

// Validation schema for updating a workplace
const dayAvailabilitySchema = z.tuple([
  z.enum(['true', 'false']),
  z.string().regex(/^\d{2}:\d{2}:\d{2}$/, 'Time must be in HH:mm:ss format'),
  z.string().regex(/^\d{2}:\d{2}:\d{2}$/, 'Time must be in HH:mm:ss format'),
]);

const updateWorkplaceSchema = z.object({
  deskSignId: z.string().min(1, 'DeskSignID is required').optional(),
  deskName: z.string().min(1, 'DeskName is required').optional(),
  neighborhood: z.string().optional(),
  floor: z.string().optional(),
  building: z.string().optional(),
  timezone: z.string().optional(),
  mon: dayAvailabilitySchema.optional(),
  tue: dayAvailabilitySchema.optional(),
  wed: dayAvailabilitySchema.optional(),
  thu: dayAvailabilitySchema.optional(),
  fri: dayAvailabilitySchema.optional(),
  sat: dayAvailabilitySchema.optional(),
  sun: dayAvailabilitySchema.optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/workplaces/[id]
 *
 * Get a single workplace by ID.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    await connectToDatabase();

    // Try to find by MongoDB _id first, then by deskId
    let workplace = await Workplace.findById(id).catch(() => null);

    if (!workplace) {
      workplace = await Workplace.findOne({ deskId: id });
    }

    if (!workplace) {
      return NextResponse.json(
        { error: 'Workplace not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(workplace);
  } catch (error) {
    console.error('Error fetching workplace:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workplace' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/workplaces/[id]
 *
 * Update a workplace.
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validate input
    const validationResult = updateWorkplaceSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Try to find by MongoDB _id first, then by deskId
    let workplace = await Workplace.findById(id).catch(() => null);

    if (!workplace) {
      workplace = await Workplace.findOne({ deskId: id });
    }

    if (!workplace) {
      return NextResponse.json(
        { error: 'Workplace not found' },
        { status: 404 }
      );
    }

    // Check if updating deskSignId to one that already exists
    if (
      validationResult.data.deskSignId &&
      validationResult.data.deskSignId !== workplace.deskSignId
    ) {
      const existing = await Workplace.findOne({
        deskSignId: validationResult.data.deskSignId,
        _id: { $ne: workplace._id },
      });

      if (existing) {
        return NextResponse.json(
          { error: 'A workplace with this DeskSignID already exists' },
          { status: 409 }
        );
      }
    }

    // Update workplace
    Object.assign(workplace, validationResult.data);
    await workplace.save();

    return NextResponse.json(workplace);
  } catch (error) {
    console.error('Error updating workplace:', error);
    return NextResponse.json(
      { error: 'Failed to update workplace' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/workplaces/[id]
 *
 * Delete a workplace.
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    await connectToDatabase();

    // Try to delete by MongoDB _id first, then by deskId
    let result = await Workplace.findByIdAndDelete(id).catch(() => null);

    if (!result) {
      result = await Workplace.findOneAndDelete({ deskId: id });
    }

    if (!result) {
      return NextResponse.json(
        { error: 'Workplace not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Workplace deleted successfully' });
  } catch (error) {
    console.error('Error deleting workplace:', error);
    return NextResponse.json(
      { error: 'Failed to delete workplace' },
      { status: 500 }
    );
  }
}
