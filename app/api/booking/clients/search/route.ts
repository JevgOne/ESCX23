import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getClientList } from '@/lib/client-queries';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role === 'girl') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const q = url.searchParams.get('q') ?? '';
  const filter = url.searchParams.get('filter') ?? 'all';
  const sort = url.searchParams.get('sort') ?? '';

  if (!q.trim()) {
    return NextResponse.json({ clients: [], total: 0 });
  }

  const { clients, total } = await getClientList({
    search: q,
    filter,
    sort: sort || undefined,
    page: 1,
    pageSize: 10,
  });

  return NextResponse.json({ clients, total });
}
