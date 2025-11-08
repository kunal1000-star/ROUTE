import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { listUserProviderKeyStatus, upsertUserProviderKey } from '@/lib/database/queries';
import { testProviderKey } from '@/lib/ai/test-keys';

export async function GET() {
  const session = await getServerSession();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const status = await listUserProviderKeyStatus(session.user.id);
  return NextResponse.json({ providers: status });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { provider, apiKey } = await req.json();
  if (!provider || !apiKey) return NextResponse.json({ error: 'provider and apiKey required' }, { status: 400 });

  const ok = await testProviderKey(provider, apiKey);
  if (!ok) return NextResponse.json({ error: 'Invalid API key' }, { status: 400 });

  await upsertUserProviderKey(session.user.id, provider, apiKey);
  return NextResponse.json({ ok: true });
}
