import { NextRequest, NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';
import { generateImpactReport } from '@/lib/actions/projects';
import { withRateLimit } from "@/lib/rate-limiter";

const GET = withRateLimit(async (
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) => {
  const session = await auth0.getSession();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { projectId } = await params;

  try {
    const report = await generateImpactReport(projectId);
    return NextResponse.json(report, {
      headers: { "Cache-Control": "private, max-age=60" },
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Project not found') {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}, "user_action")

export { GET }
