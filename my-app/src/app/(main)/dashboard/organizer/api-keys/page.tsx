import { createClient } from '@/utils/supabase';
import { redirect } from 'next/navigation';
import { auth0 } from "@/lib/auth0";
import { ShieldCheck } from 'lucide-react';
import { SectionHeading } from '@/components/ui/section-heading';
import { ApiKeyList } from './api-key-list';
import { GenerateKeyForm } from './generate-key-form';

export const dynamic = "force-dynamic";

export default async function ApiKeysPage() {
  const session = await auth0.getSession();
  const userId = session?.user?.sub;

  if (!userId) redirect('/sign-in');

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('auth0_user_id', userId)
    .single();

  const { data: keys } = await supabase
    .from('api_keys')
    .select('id, name, is_active, last_used_at, created_at')
    .eq('profile_id', profile?.id ?? 'none')
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-primary">API Management</h1>
          <p className="text-sm text-muted-foreground">Generate and manage keys for programmatic access to the Trust Network.</p>
        </div>
        <GenerateKeyForm />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <ApiKeyList keys={keys || []} />
        </div>

        <div className="space-y-6">
          <div className="bh-card p-6 space-y-4">
            <SectionHeading variant="icon" icon={<ShieldCheck size={20} />} color="blue" as="h3">
              Security Notice
            </SectionHeading>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Keys are shown only once at creation. Store them securely. If a key is compromised, revoke it immediately. API keys are hashed with SHA-256 and cannot be recovered.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
