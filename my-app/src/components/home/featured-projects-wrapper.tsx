import dynamic from 'next/dynamic';
import { getFeaturedProjects } from '@/lib/actions/projects';

// Dynamic import splits the FeaturedProjects client component (lucide-react,
// cloudinaryUrl, Project type) from the initial bundle — it only loads after
// the Suspense boundary resolves (data fetch completes).
const FeaturedProjects = dynamic(() => import('@/components/home/featured-projects'));

export default async function FeaturedProjectsWrapper() {
  const projects = await getFeaturedProjects();
  return <FeaturedProjects projects={projects} />;
}
