"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Save, Github, ExternalLink, Image as ImageIcon, Tags } from 'lucide-react';
import { RoseSpinner } from '@/components/ui/rose-loader';
import { updateProject } from '@/lib/actions/projects';
import { toast } from 'sonner';
import { CloudinaryUpload } from '@/components/cloudinary-upload';

const projectSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  demoUrl: z.string().url("Please enter a valid demo URL").optional().or(z.literal('')),
  githubUrl: z.string().url("Please enter a valid GitHub URL").optional().or(z.literal('')),
  techStack: z.string().min(1, "Please provide at least one tech stack item"),
  category: z.string().optional(),
});

interface ProjectData {
  id: string;
  title: string;
  description: string;
  cover_image?: string | null;
  demo_url?: string | null;
  github_url?: string | null;
  tech_stack: string[];
  category?: string | null;
  event_id?: string | null;
}

export default function EditProjectForm({ project }: { project: ProjectData }) {
  const router = useRouter();
  const [techTags, setTechTags] = useState<string[]>(project.tech_stack || []);
  const [coverImage, setCoverImage] = useState(project.cover_image || '');
  const [category, setCategory] = useState(project.category || '');

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: project.title,
      description: project.description,
      demoUrl: project.demo_url || '',
      githubUrl: project.github_url || '',
      techStack: (project.tech_stack || []).join(','),
    }
  });

  const handleTechInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = e.currentTarget.value.trim();
      if (val && !techTags.includes(val)) {
        const nextTags = [...techTags, val];
        setTechTags(nextTags);
        setValue('techStack', nextTags.join(','));
      }
      e.currentTarget.value = '';
    }
  };

  const onSubmit = async (data: z.infer<typeof projectSchema>) => {
    try {
      const result = await updateProject(project.id, {
        title: data.title,
        description: data.description,
        demoUrl: data.demoUrl || '',
        githubUrl: data.githubUrl || '',
        techStack: techTags,
        category: category || null,
        coverImage: coverImage || undefined,
      });
      if (result.success) {
        toast.success("Project updated successfully! ✅");
        router.push('/dashboard/hacker/projects');
        router.refresh();
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to update project");
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="lg-surface p-8 rounded-3xl border border-glass shadow-2xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-secondary ml-1">Project Title</label>
            <input 
              {...register('title')}
              className="w-full bg-surface/10 border border-glass rounded-xl px-4 py-3 text-primary focus:ring-2 focus:ring-red-600 outline-none transition-all"
              placeholder="e.g. AgriTech Smart Monitor"
            />
            {errors.title && <p className="text-xs text-bh-red-500 ml-1">{errors.title.message as string}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-secondary ml-1">Description</label>
            <textarea 
              {...register('description')}
              rows={4}
              className="w-full bg-surface/10 border border-glass rounded-xl px-4 py-3 text-primary focus:ring-2 focus:ring-red-600 outline-none transition-all"
              placeholder="What does your project do? What problem does it solve?"
            />
            {errors.description && <p className="text-xs text-bh-red-500 ml-1">{errors.description.message as string}</p>}
          </div>

          {/* Category selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-secondary ml-1 flex items-center gap-2">
              <Tags className="w-3 h-3" /> Category
            </label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full bg-surface/10 border border-glass rounded-xl px-4 py-3 text-primary focus:ring-2 focus:ring-red-600 outline-none transition-all"
            >
              <option value="">Select a category...</option>
              <option value="Web App">Web App</option>
              <option value="Mobile App">Mobile App</option>
              <option value="AI/ML">AI/ML</option>
              <option value="Data Science">Data Science</option>
              <option value="Blockchain">Blockchain</option>
              <option value="Hardware/IoT">Hardware/IoT</option>
              <option value="DevOps/Tools">DevOps/Tools</option>
              <option value="Game Dev">Game Dev</option>
              <option value="Open Source Tool">Open Source Tool</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Cover Image Upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-secondary ml-1 flex items-center gap-2">
              <ImageIcon className="w-3 h-3" /> Cover Image
            </label>
            <CloudinaryUpload
              onUpload={(url) => setCoverImage(url)}
              onError={(msg) => toast.error(msg)}
              label="Upload Cover Image"
              currentImage={coverImage}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-secondary ml-1 flex items-center gap-2">
                <ExternalLink className="w-3 h-3" /> Demo URL
              </label>
              <input 
                {...register('demoUrl')}
                className="w-full bg-surface/10 border border-glass rounded-xl px-4 py-3 text-primary focus:ring-2 focus:ring-red-600 outline-none transition-all"
                placeholder="https://demo.myapp.com"
              />
              {errors.demoUrl && <p className="text-xs text-bh-red-500 ml-1">{errors.demoUrl.message as string}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-secondary ml-1 flex items-center gap-2">
                <Github className="w-3 h-3" /> GitHub Repository
              </label>
              <input 
                {...register('githubUrl')}
                className="w-full bg-surface/10 border border-glass rounded-xl px-4 py-3 text-primary focus:ring-2 focus:ring-red-600 outline-none transition-all"
                placeholder="https://github.com/user/repo"
              />
              {errors.githubUrl && <p className="text-xs text-bh-red-500 ml-1">{errors.githubUrl.message as string}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-secondary ml-1">Tech Stack (Press Enter to add)</label>
            <div className="flex flex-wrap gap-2 p-2 bg-surface/10 border border-glass rounded-xl focus-within:ring-2 focus-within:ring-red-600 transition-all">
              {techTags.map((tag, i) => (
                <span key={i} className="px-2 py-1 bg-bh-red-600/20 text-bh-red-500 text-xs rounded-lg border border-red-600/30 flex items-center gap-1">
                  {tag}
                  <button 
                    type="button" 
                    onClick={() => {
                      const nextTags = techTags.filter((_, idx) => idx !== i);
                      setTechTags(nextTags);
                      setValue('techStack', nextTags.join(','));
                    }}
                    className="hover:text-primary"
                  >
                    ×
                  </button>
                </span>
              ))}
              <input 
                onKeyDown={handleTechInput}
                className="flex-1 bg-transparent border-none outline-none text-primary text-sm p-1 min-w-[120px]"
                placeholder="React, TypeScript, Supabase..."
              />
            </div>
            {errors.techStack && <p className="text-xs text-bh-red-500 ml-1">{errors.techStack.message as string}</p>}
          </div>

          <div className="flex items-center gap-4 pt-2">
            <button 
              disabled={isSubmitting}
              type="submit" 
              className="flex-1 py-4 bg-bh-red-600 hover:bg-bh-red-500 text-primary rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-bh-red-500/20 disabled:opacity-50"
            >
              {isSubmitting ? (
                <RoseSpinner size="sm" />
              ) : (
                <>
                  <Save className="w-5 h-5" /> Save Changes
                </>
              )}
            </button>
            <Link
              href="/dashboard/hacker/projects"
              className="py-4 px-6 bg-surface/10 hover:bg-surface/20 text-secondary rounded-2xl font-medium transition-all text-sm"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
