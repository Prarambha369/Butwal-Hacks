"use client"

import { useRef, useEffect, useState } from "react"
import { Github, Linkedin, Twitter, ExternalLink, Code, Award, Users, Filter } from "lucide-react"
import { members, roleLabels, roleColors, type Member, type MemberRole } from "@/lib/members"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const roleFilters: { value: MemberRole | "all"; label: string }[] = [
  { value: "all", label: "All Members" },
  { value: "founder", label: "Founders" },
  { value: "organizer", label: "Organizers" },
  { value: "mentor", label: "Mentors" },
  { value: "volunteer", label: "Volunteers" },
  { value: "member", label: "Members" },
]

function MemberCard({ member, index }: { member: Member; index: number }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (prefersReducedMotion || !ref.current) return

    import("animejs").then(({ animate }) => {
      animate(ref.current!, {
        opacity: [0, 1],
        translateY: [30, 0],
        duration: 600,
        delay: index * 100,
        ease: "outQuad",
      })
    })
  }, [index])

  return (
    <div
      ref={ref}
      className={cn(
        "group relative rounded-xl border border-border bg-card p-7 transition-all duration-300",
        "hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10"
      )}
    >
      <div className="mb-5 flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-lg font-bold text-primary">
            {member.name.charAt(0)}
          </div>
          <div>
            <h3 className="font-bold text-lg text-foreground">{member.name}</h3>
            <span className={cn("inline-block rounded-full px-3 py-1 text-xs font-semibold", roleColors[member.role])}>
              {roleLabels[member.role]}
            </span>
          </div>
        </div>
      </div>

      <p className="mb-5 text-sm text-muted-foreground leading-relaxed">{member.bio}</p>

      <div className="mb-5 flex flex-wrap gap-2">
        {member.skills.slice(0, 4).map((skill) => (
          <span key={skill} className="rounded-lg bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground">
            {skill}
          </span>
        ))}
      </div>

      <div className="mb-6 flex items-center gap-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Code className="h-4 w-4 text-primary/60" />
          <span className="font-medium">{member.projects} projects</span>
        </div>
        <div className="flex items-center gap-2">
          <Award className="h-4 w-4 text-primary/60" />
          <span className="font-medium">{member.contributions} contributions</span>
        </div>
      </div>

      <div className="flex gap-3">
        {member.github && (
          <a
            href={member.github}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg p-2.5 text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
            aria-label={`${member.name}'s GitHub`}
            title={`${member.name}'s GitHub`}
          >
            <Github className="h-5 w-5" />
          </a>
        )}
        {member.linkedin && (
          <a
            href={member.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg p-2.5 text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
            aria-label={`${member.name}'s LinkedIn`}
            title={`${member.name}'s LinkedIn`}
          >
            <Linkedin className="h-5 w-5" />
          </a>
        )}
        {member.twitter && (
          <a
            href={member.twitter}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg p-2.5 text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
            aria-label={`${member.name}'s Twitter`}
            title={`${member.name}'s Twitter`}
          >
            <Twitter className="h-5 w-5" />
          </a>
        )}
        {member.website && (
          <a
            href={member.website}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg p-2.5 text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
            aria-label={`${member.name}'s website`}
            title={`${member.name}'s website`}
          >
            <ExternalLink className="h-5 w-5" />
          </a>
        )}
      </div>
    </div>
  )
}

export function MemberDirectory() {
  const [filter, setFilter] = useState<MemberRole | "all">("all")
  const headerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (prefersReducedMotion || !headerRef.current) return

    import("animejs").then(({ animate }) => {
      animate(headerRef.current!, {
        opacity: [0, 1],
        translateY: [20, 0],
        duration: 700,
        ease: "outQuad",
      })
    })
  }, [])

  const filteredMembers = filter === "all" ? members : members.filter((m) => m.role === filter)

   return (
     <section className="border-t border-border bg-background py-20">
       <div className="mx-auto max-w-6xl px-4">
         <div ref={headerRef} className="mb-16 text-center">
           <Users className="mx-auto mb-5 h-12 w-12 text-primary" />
           <h2 className="text-5xl font-black tracking-tight text-foreground sm:text-6xl">Our Community</h2>
           <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed">
             Meet the builders, mentors, and organizers making our community thrive.
             Explore members by role and connect with the movement.
           </p>
         </div>

         <div className="mb-12 flex flex-wrap items-center justify-center gap-3">
           <Filter className="h-4 w-4 text-muted-foreground/60" />
           {roleFilters.map((role) => (
             <Button
               key={role.value}
               variant={filter === role.value ? "default" : "outline"}
               size="sm"
               onClick={() => setFilter(role.value)}
               className="text-xs font-semibold transition-all hover:bg-primary/85"
             >
               {role.label}
             </Button>
           ))}
         </div>

         <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
           {filteredMembers.map((member, index) => (
             <MemberCard key={member.id} member={member} index={index} />
           ))}
         </div>
       </div>
     </section>
   )
}
