import { NextRequest, NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';
import { generateImpactReport } from '@/lib/actions/projects';
import { withRateLimit } from "@/lib/rate-limiter";
import { logger } from "@/lib/logger";

const GET = withRateLimit(async (
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) => {
  const session = await auth0.getSession();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { projectId } = await params;

  try {
    const report = await generateImpactReport(projectId);
    // generateImpactReport returns null when the caller is not entitled to
    // this project. 403 rather than 404 would confirm the project exists, so
    // the same shape is used for both.
    if (report === null) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
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
    logger.error('[api/impact/report]', error);
    // The message is not echoed back: this is a service-role code path and an
    // upstream PostgREST message can carry schema detail.
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}, "user_action")

export { GET }
