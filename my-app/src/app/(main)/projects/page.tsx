import React from 'react';
import SiteHeader from '@/components/site-header';
import Footer from '@/components/sections/Footer';
import ProjectGrid from '@/components/projects/project-grid';
import FeaturedProjects from '@/components/projects/featured-projects';

export default function ProjectsPage() {
  return (
    <div className="min-h-screen bg-background text-primary pt-24 pb-20 px-4">
      <SiteHeader />
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-5xl md:text-7xl font-black tracking-tight font-heading">
            Project <span className="text-bh-red-500">Showcase</span>
          </h1>
          <p className="text-xl text-secondary max-w-2xl mx-auto">
            Explore the innovations built by our community of hackers in Lumbini Province.
          </p>
        </div>
        <FeaturedProjects />
        <ProjectGrid />
      </div>
      <Footer />
    </div>
  );
}
