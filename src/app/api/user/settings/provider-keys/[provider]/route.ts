import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { deleteUserProviderKey } from '@/lib/database/queries';

export async function DELETE(_: Request, { params }: { params: { provider: string } }) {
  const session = await getServerSession();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await deleteUserProviderKey(session.user.id, params.provider as any);
  return NextResponse.json({ ok: true });
}
