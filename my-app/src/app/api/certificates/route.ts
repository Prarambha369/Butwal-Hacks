import { NextResponse } from 'next/server';
import { createAuthenticatedClient } from '@/utils/supabase/server';
import { parsePagination, paginationMeta } from '@/lib/pagination';

export async function GET(request: Request) {
  try {
    const authClient = await createAuthenticatedClient();
    if (!authClient) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { supabase, userId } = authClient;
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
    });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}