import React from 'react';
import { notFound } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import TeamPortfolio from '@/components/teams/team-portfolio';

export default async function TeamPortfolioPage({ params }: { params: Promise<{ team_id: string }> }) {
  const { team_id } = await params;
  const supabase = await createClient();

  const { data: team, error } = await supabase
    .from('teams')
    .select('id')
    .eq('id', team_id)
    .single();

  if (error || !team) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background text-primary pt-24 pb-20 px-4">
      <div className="max-w-6xl mx-auto space-y-12">
        <TeamPortfolio teamId={team_id} />
      </div>
    </div>
  );
}
