import { NextRequest, NextResponse } from 'next/server';
import { registerWebhooks } from '@/lib/embrava/webhooks';

export async function POST(request: NextRequest) {
  const adminToken = process.env.ADMIN_TOKEN;
  if (!adminToken) {
    return NextResponse.json({ error: 'ADMIN_TOKEN is not configured' }, { status: 500 });
  }

  const authHeader = request.headers.get('authorization');
  const expected = `Bearer ${adminToken}`;
  if (authHeader !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const baseUrl = process.env.WEBHOOK_BASE_URL;
  if (!baseUrl) {
    return NextResponse.json({ error: 'WEBHOOK_BASE_URL is not set' }, { status: 500 });
  }

  try {
    await registerWebhooks(baseUrl);
    return NextResponse.json({ ok: true, baseUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Webhook registration failed:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
