import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase, Workplace } from '@/lib/db';
import { z } from 'zod';
import mongoose from 'mongoose';

// Validation schema for creating/updating a workplace
const dayAvailabilitySchema = z.tuple([
  z.enum(['true', 'false']),
  z.string().regex(/^\d{2}:\d{2}:\d{2}$/, 'Time must be in HH:mm:ss format'),
  z.string().regex(/^\d{2}:\d{2}:\d{2}$/, 'Time must be in HH:mm:ss format'),
]);

const workplaceSchema = z.object({
  deskSignId: z.string().min(1, 'DeskSignID is required'),
  deskName: z.string().min(1, 'DeskName is required'),
  neighborhood: z.string().optional().default(''),
  floor: z.string().optional().default(''),
  building: z.string().optional().default(''),
  timezone: z.string().optional().default('Europe/Amsterdam'),
  mon: dayAvailabilitySchema.optional(),
  tue: dayAvailabilitySchema.optional(),
  wed: dayAvailabilitySchema.optional(),
  thu: dayAvailabilitySchema.optional(),
  fri: dayAvailabilitySchema.optional(),
  sat: dayAvailabilitySchema.optional(),
  sun: dayAvailabilitySchema.optional(),
});

/**
 * GET /api/workplaces
 *
 * List all workplaces.
 */
export async function GET() {
  try {
    await connectToDatabase();
    const workplaces = await Workplace.find({}).sort({ createdAt: -1 });
    return NextResponse.json(workplaces);
  } catch (error) {
    console.error('Error fetching workplaces:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workplaces' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/workplaces
 *
 * Create a new workplace.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validationResult = workplaceSchema.safeParse(body);
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

    // Check if deskSignId already exists
    const existing = await Workplace.findOne({
      deskSignId: validationResult.data.deskSignId,
    });

    if (existing) {
      return NextResponse.json(
        { error: 'A workplace with this DeskSignID already exists' },
        { status: 409 }
      );
    }

    // Create workplace with a new deskId
    const workplace = new Workplace({
      ...validationResult.data,
      deskId: new mongoose.Types.ObjectId().toString(),
    });

    await workplace.save();

    return NextResponse.json(workplace, { status: 201 });
  } catch (error) {
    console.error('Error creating workplace:', error);
    return NextResponse.json(
      { error: 'Failed to create workplace' },
      { status: 500 }
    );
  }
}
