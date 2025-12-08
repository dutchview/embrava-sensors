import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase, Workplace } from '@/lib/db';
import type { WorkspaceRequest, WorkspaceResponse } from '@/lib/embrava/types';

/**
 * POST /api/embrava/workspace
 *
 * Webhook endpoint called BY Embrava to lookup workspace details.
 * This is the PULL integration - Embrava sends us a DeskSignID and
 * we respond with the workspace configuration.
 */
export async function POST(request: NextRequest) {
  // Verify webhook secret
  const secret = request.headers.get('secret');
  const expectedSecret = process.env.WEBHOOK_SECRET;

  if (!expectedSecret || secret !== expectedSecret) {
    console.warn('Unauthorized webhook call - invalid secret');
    const response = { error: 'Unauthorized' };
    console.log('Sending response:', JSON.stringify(response, null, 2));
    return NextResponse.json(response, { status: 401 });
  }

  try {
    const body: WorkspaceRequest = await request.json();
    const deskSignId = body.DeskSignID;

    console.log(`Workspace lookup request for DeskSignID: ${deskSignId}`);

    // Connect to database
    await connectToDatabase();

    // Find workplace by DeskSignID
    const workplace = await Workplace.findOne({ deskSignId });

    if (!workplace) {
      console.log(`No workplace found for DeskSignID: ${deskSignId}`);
      // Return a default/empty response when workspace is not found
      const defaultResponse: WorkspaceResponse = {
        DeskID: '',
        DeskName: 'Unknown',
        Neighborhood: '',
        Floor: '',
        Building: '',
        Timezone: 'UTC',
        Mon: ['false', '00:00:00', '00:00:00'],
        Tue: ['false', '00:00:00', '00:00:00'],
        Wed: ['false', '00:00:00', '00:00:00'],
        Thu: ['false', '00:00:00', '00:00:00'],
        Fri: ['false', '00:00:00', '00:00:00'],
        Sat: ['false', '00:00:00', '00:00:00'],
        Sun: ['false', '00:00:00', '00:00:00'],
      };
      console.log('Sending response:', JSON.stringify(defaultResponse, null, 2));
      return NextResponse.json(defaultResponse);
    }

    console.log(`Found workplace: ${workplace.deskName} (${workplace.deskId})`);

    // Return workspace details in Embrava's expected format
    const response: WorkspaceResponse = {
      DeskID: workplace.deskId,
      DeskName: workplace.deskName,
      Neighborhood: workplace.neighborhood,
      Floor: workplace.floor,
      Building: workplace.building,
      Timezone: workplace.timezone,
      Mon: workplace.mon as [string, string, string],
      Tue: workplace.tue as [string, string, string],
      Wed: workplace.wed as [string, string, string],
      Thu: workplace.thu as [string, string, string],
      Fri: workplace.fri as [string, string, string],
      Sat: workplace.sat as [string, string, string],
      Sun: workplace.sun as [string, string, string],
    };

    console.log('Sending response:', JSON.stringify(response, null, 2));
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error processing workspace request:', error);
    const response = { error: 'Internal server error' };
    console.log('Sending response:', JSON.stringify(response, null, 2));
    return NextResponse.json(response, { status: 500 });
  }
}
