import React from 'react';
import { notFound } from 'next/navigation';
import { getProgramBySlug } from '@/lib/content';
import ProgramDetailClient from '@/components/programs/program-detail-client';

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function ProgramDetailPage({ params }: Props) {
  const { slug } = await params;
  const program = getProgramBySlug(slug);

  if (!program) {
    notFound();
  }

  return <ProgramDetailClient program={program} />;
}
