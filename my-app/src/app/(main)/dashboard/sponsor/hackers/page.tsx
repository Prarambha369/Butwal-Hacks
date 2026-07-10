import { auth0 } from "@/lib/auth0";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Search, Code2, ExternalLink } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SponsorHackersPage() {
  const session = await auth0.getSession();
  const userId = session?.user?.sub;
  if (!userId) redirect("/sign-in");

  const supabase = await createClient();

  // Fetch all hacker profiles with their projects
  const { data: hackers } = await supabase
    .from("profiles")
    .select(`
      id,
      full_name,
      email,
      bio,
      avatar_url,
      bh_id,
      skills,
      github_username,
      projects (
        id,
        title,
        description,
        tech_stack,
        github_url
      )
    `)
    .eq("role", "hacker")
    .order("xp", { ascending: false })
    .limit(50);

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-primary">Discover Hackers</h1>
        <p className="text-secondary text-sm mt-1">
          Browse active community members and their projects. Reach out to potential recruits.
        </p>
      </div>

      {(!hackers || hackers.length === 0) ? (
        <div className="lg-surface rounded-2xl border border-glass p-12 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-surface/10 flex items-center justify-center mb-4">
            <Search size={24} className="text-secondary" />
          </div>
          <h3 className="text-base font-bold text-primary mb-1">No hackers found</h3>
          <p className="text-sm text-secondary">Hackers will appear here once they join the platform.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {hackers.map((hacker) => (
            <div
              key={hacker.id}
              className="lg-surface rounded-2xl border border-glass p-5 space-y-4 hover:border-bh-red-500/30 transition-all"
            >
              {/* Identity row */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-surface/20 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
                  {hacker.full_name?.charAt(0) || "?"}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-primary truncate">
                      {hacker.full_name || "Anonymous"}
                    </h3>
                    {hacker.bh_id && (
                      <span className="text-[10px] font-mono text-secondary/60 flex-shrink-0">
                        {hacker.bh_id}
                      </span>
                    )}
                  </div>
                  {hacker.bio && (
                    <p className="text-xs text-secondary mt-0.5 line-clamp-2">{hacker.bio}</p>
                  )}
                </div>
              </div>

              {/* Skills */}
              {hacker.skills && Array.isArray(hacker.skills) && hacker.skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {hacker.skills.slice(0, 6).map((skill: string) => (
                    <span
                      key={skill}
                      className="px-2 py-0.5 rounded-md bg-surface/10 border border-glass text-[10px] font-medium text-secondary"
                    >
                      {skill}
                    </span>
                  ))}
                  {hacker.skills.length > 6 && (
                    <span className="px-2 py-0.5 text-[10px] text-secondary/60">
                      +{hacker.skills.length - 6} more
                    </span>
                  )}
                </div>
              )}

              {/* Projects */}
              {hacker.projects && Array.isArray(hacker.projects) && hacker.projects.length > 0 && (
                <div className="border-t border-glass pt-3 space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-secondary/60">Projects</p>
                  {hacker.projects.slice(0, 2).map((project: { id: string; title: string; description: string | null; tech_stack: string[] | null; github_url: string | null }) => (
                    <div key={project.id} className="flex items-start gap-2">
                      <Code2 size={12} className="text-secondary mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-primary truncate">{project.title}</p>
                        {project.description && (
                          <p className="text-[11px] text-secondary line-clamp-1">{project.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Contact */}
              <div className="flex items-center gap-2 pt-1">
                {hacker.github_username && (
                  <a
                    href={`https://github.com/${hacker.github_username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-secondary hover:text-bh-red-500 transition-colors"
                  >
                    <ExternalLink size={10} />
                    GitHub
                  </a>
                )}
                {hacker.email && (
                  <a
                    href={`mailto:${hacker.email}`}
                    className="inline-flex items-center gap-1 text-xs text-secondary hover:text-bh-red-500 transition-colors ml-auto"
                  >
                    <ExternalLink size={10} />
                    Contact
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
