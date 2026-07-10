import { getFeaturedProjects } from "@/lib/actions/projects"
import BentoShowcaseGrid from "@/components/home/bento-showcase-grid"

/**
 * BentoShowcaseGridWrapper — server component that fetches the latest
 * 3 projects and renders the BentoShowcaseGrid client component.
 * Returns null when fewer than 2 projects exist (grid needs min 2).
 */
export default async function BentoShowcaseGridWrapper() {
  const projects = await getFeaturedProjects(3)

  if (!projects || projects.length < 2) return null

  return <BentoShowcaseGrid projects={projects} />
}
