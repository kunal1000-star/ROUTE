import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { listUserProviderLimits, upsertUserProviderLimit } from '@/lib/database/queries';

export async function GET() {
  const session = await getServerSession();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const limits = await listUserProviderLimits(session.user.id);
  return NextResponse.json({ limits });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { provider, maxRequestsPerMin } = await req.json();
  if (!provider || typeof maxRequestsPerMin !== 'number') {
    return NextResponse.json({ error: 'provider and maxRequestsPerMin required' }, { status: 400 });
  }
  await upsertUserProviderLimit(session.user.id, provider, maxRequestsPerMin);
  return NextResponse.json({ ok: true });
}
