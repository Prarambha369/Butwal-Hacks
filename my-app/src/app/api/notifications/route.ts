import { NextResponse } from 'next/server';
import { createServiceClient } from '@/utils/supabase';
import { auth0 } from '@/lib/auth0';


export async function GET(request: Request) {
  try {
    const session = await auth0.getSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const supabase = createServiceClient();
    const userId = session.user.sub;
    const u = new URL(request.url);
    const limit = Math.min(200, Math.max(1, parseInt(u.searchParams.get("limit") ?? "", 10) || 50));
    const offset = Math.max(0, parseInt(u.searchParams.get("offset") ?? "", 10) || 0);

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('auth0_user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return NextResponse.json({
      notifications: data,
      pagination: { limit, offset, hasMore: (data?.length ?? 0) >= limit },
    }, {
      headers: { "Cache-Control": "private, max-age=30" },
    });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}