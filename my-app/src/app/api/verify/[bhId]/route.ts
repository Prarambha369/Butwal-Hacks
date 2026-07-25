import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bhId: string }> }
) {
  const { bhId } = await params;
  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('full_name, bh_id, role, xp')
    .eq('bh_id', bhId)
    .single();

  if (error || !profile) {
    return NextResponse.json(
      { verified: false, message: 'Invalid BH-ID' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    verified: true,
    profile: {
      name: profile.full_name,
      id: profile.bh_id,
      role: profile.role,
      xp: profile.xp,
    },
  }, {
    headers: { "Cache-Control": "public, max-age=300, s-maxage=600" },
  });
}
