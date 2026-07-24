import { NextResponse } from 'next/server';
import { createServiceClient } from '@/utils/supabase/service';
import { auth0 } from '@/lib/auth0';
import { parsePagination, paginationMeta } from '@/lib/pagination';

export async function GET(request: Request) {
  try {
    const session = await auth0.getSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const supabase = createServiceClient();
    const userId = session.user.sub;
    const { limit, offset } = parsePagination(request);

    const { data, error } = await supabase
      .from('certificates')
      .select('*')
      .eq('auth0_user_id', userId)
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return NextResponse.json({
      certificates: data,
      pagination: paginationMeta(limit, offset, data?.length ?? 0),
    }, {
      headers: { "Cache-Control": "private, max-age=60" },
    });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}