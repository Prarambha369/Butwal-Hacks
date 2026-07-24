"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Send, Github, ExternalLink, Code2, Image as ImageIcon, Calendar, Tags, Sparkles, Loader2 } from 'lucide-react';
import { RoseSpinner } from '@/components/ui/rose-loader';
import { submitProject } from '@/lib/actions/projects';
import { toast } from 'sonner';
import posthog from 'posthog-js';
import { createClient } from '@/utils/supabase/client';
import { useUser } from '@auth0/nextjs-auth0/client';

import { CloudinaryUpload } from '@/components/cloudinary-upload';

const projectSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  coverImage: z.string().optional(),
  demoUrl: z.string().url("Please enter a valid demo URL").optional().or(z.literal('')),
  githubUrl: z.string().url("Please enter a valid GitHub URL").optional().or(z.literal('')),
  videoUrl: z.string().optional(),
  techStack: z.string().min(1, "Please provide at least one tech stack item"),
  eventId: z.string().optional(),
  teamId: z.string().optional(),
  category: z.string().optional(),
});

interface EventOption {
  id: string;
  title: string;
}

export default function ProjectSubmissionForm() {
  const router = useRouter();
  const supabase = createClient();
  const { user } = useUser();
  const [events, setEvents] = useState<EventOption[]>([]);
  const [generatingPitch, setGeneratingPitch] = useState(false);
  const { register, handleSubmit, setValue, getValues, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: '',
      description: '',
      techStack: '',
      demoUrl: '',
      githubUrl: '',
      eventId: '',
      teamId: '',
      category: '',
    }
  });

  const [techTags, setTechTags] = useState<string[]>([]);
  const [coverImage, setCoverImage] = useState('');
  const [bhId, setBhId] = useState<string | undefined>();
  const [usedAiPitch, setUsedAiPitch] = useState(false);

  // Fetch hacker's registered events + bh_id for the event selector and Cloudinary metadata
  useEffect(() => {
    const userId = user?.sub;
    if (!userId) return;
    const fetchEvents = async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, bh_id')
        .eq('auth0_user_id', userId)
        .single();
      if (!profile) return;
      setBhId(profile.bh_id ?? undefined);

      const { data: registrations } = await supabase
        .from('event_registrations')
        .select('event_id')
        .eq('profile_id', profile.id);

      const eventIds = registrations?.map(r => r.event_id) || [];
      if (eventIds.length === 0) return;

      const { data: eventData } = await supabase
        .from('events')
        .select('id, title')
        .in('id', eventIds);

      setEvents(eventData || []);
    };
    fetchEvents();
  }, [user?.sub]);

  const handleTechInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = e.currentTarget.value.trim();
      if (val && !techTags.includes(val)) {
        setTechTags([...techTags, val]);
        setValue('techStack', techTags.concat(val).join(','));
      }
      e.currentTarget.value = '';
    }
  };

  const onSubmit = async (data: z.infer<typeof projectSchema>) => {
    try {
      const result = await submitProject({
        title: data.title,
        description: data.description,
        demoUrl: data.demoUrl || '',
        githubUrl: data.githubUrl || '',
        coverImage: coverImage || undefined,
        techStack: techTags,
        category: (data.category || null) as any,
        eventId: data.eventId || null,
        teamId: data.teamId || null,
      });
      if (result.success) {
        toast.success("Project submitted successfully!");
        // Track if the description was AI-generated (from the pitch generator)
        try {
          posthog.capture('project_submitted', {
            title: data.title,
            category: data.category || null,
            usedAiPitch,
          });
        } catch { /* analytics best-effort */ }
        router.push('/dashboard/hacker/projects');
        router.refresh();
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to submit project");
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bh-card p-8 shadow-2xl animate-[fadeInUp_0.4s_ease-out]">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-lg bg-bh-red-600 text-primary">
            <Code2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-primary">Submit Your Project</h2>
            <p className="text-sm text-muted-foreground">Show the community what you&apos;ve built.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground ml-1">Project Title</label>
            <input 
              {...register('title')}
              className="w-full bg-surface-hover border border-border rounded-lg px-4 py-3 text-primary focus:ring-2 focus:ring-[#FE0000] focus:outline-none outline-none transition-all"
              placeholder="e.g. AgriTech Smart Monitor"
            />
            {errors.title && <p className="text-xs text-primary-red ml-1">{errors.title.message as string}</p>}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-muted-foreground ml-1">Description</label>
              <button
                type="button"
                onClick={async () => {
                  const values = getValues();
                  if (!values.title || values.title.length < 3) {
                    toast.error("Enter a project title first (min 3 chars).");
                    return;
                  }
                  const techStack = techTags.length > 0 ? techTags : [];
                  const currentDescription = values.description?.trim() || '';

                  setGeneratingPitch(true);
                  try {
                    const res = await fetch('/api/ai/pitch-generator', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        title: values.title,
                        description: currentDescription || 'Use title and tech stack to generate.',
                        techStack,
                        category: values.category || undefined,
                      }),
                    });
                    if (!res.ok) {
                      const err = await res.json().catch(() => ({}));
                      toast.error(err.error || 'Failed to generate pitch');
                      return;
                    }
                    const data = await res.json();
                    setValue('description', data.pitch);
                    setUsedAiPitch(true);
                    toast.success('AI pitch generated! Review and edit before submitting.');
                    try {
                      posthog.capture('pitch_generated', {
                        title: values.title,
                        category: values.category || undefined,
                        techStack: techStack,
                        model: data.model,
                        hadExistingDescription: currentDescription.length > 0,
                      });
                    } catch { /* analytics best-effort */ }
                  } catch {
                    toast.error('Failed to generate pitch. Check your connection and try again.');
                  } finally {
                    setGeneratingPitch(false);
                  }
                }}
                disabled={generatingPitch}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-red/10 text-primary-red text-[10px] font-bold hover:bg-primary-red/20 transition-all disabled:opacity-50"
              >
                {generatingPitch ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3" />
                )}
                {generatingPitch ? 'Generating...' : 'Generate with AI'}
              </button>
            </div>
            <textarea 
              {...register('description')}
              rows={4}
              className="w-full bg-surface-hover border border-border rounded-lg px-4 py-3 text-primary focus:ring-2 focus:ring-[#FE0000] focus:outline-none outline-none transition-all"
              placeholder="What does your project do? What problem does it solve?"
            />
            {errors.description && <p className="text-xs text-primary-red ml-1">{errors.description.message as string}</p>}
          </div>

          {/* Category selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground ml-1 flex items-center gap-2">
              <Tags className="w-3 h-3" /> Category
            </label>
            <select
              {...register('category')}
              className="w-full bg-surface-hover border border-border rounded-lg px-4 py-3 text-primary focus:ring-2 focus:ring-[#FE0000] focus:outline-none outline-none transition-all"
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
          <div className="md:col-span-2 space-y-2">
            <label className="text-sm font-medium text-muted-foreground ml-1 flex items-center gap-2">
              <ImageIcon className="w-3 h-3" /> Cover Image
            </label>
            <CloudinaryUpload
              onUpload={(url) => setCoverImage(url)}
              onError={(msg) => toast.error(msg)}
              label="Upload Cover Image"
              currentImage={coverImage}
              entityType="project_cover"
              bhId={bhId}
              uploaderAuth0Id={user?.sub}
            />
          </div>

          {/* Event selector — show only if user has registered events */}
          {events.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground ml-1 flex items-center gap-2">
                <Calendar className="w-3 h-3" /> Event (optional)
              </label>
              <select
                {...register('eventId')}
                className="w-full bg-surface-hover border border-border rounded-lg px-4 py-3 text-primary focus:ring-2 focus:ring-[#FE0000] focus:outline-none outline-none transition-all"
              >
                <option value="">Select an event...</option>
                {events.map(e => (
                  <option key={e.id} value={e.id}>{e.title}</option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground ml-1 flex items-center gap-2">
                <ExternalLink className="w-3 h-3" /> Demo URL
              </label>
              <input 
                {...register('demoUrl')}
                className="w-full bg-surface-hover border border-border rounded-lg px-4 py-3 text-primary focus:ring-2 focus:ring-[#FE0000] focus:outline-none outline-none transition-all"
                placeholder="https://demo.myapp.com"
              />
              {errors.demoUrl && <p className="text-xs text-primary-red ml-1">{errors.demoUrl.message as string}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground ml-1 flex items-center gap-2">
                <Github className="w-3 h-3" /> GitHub Repository
              </label>
              <input 
                {...register('githubUrl')}
                className="w-full bg-surface-hover border border-border rounded-lg px-4 py-3 text-primary focus:ring-2 focus:ring-[#FE0000] focus:outline-none outline-none transition-all"
                placeholder="https://github.com/user/repo"
              />
              {errors.githubUrl && <p className="text-xs text-primary-red ml-1">{errors.githubUrl.message as string}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground ml-1">Tech Stack (Press Enter to add)</label>
            <div className="flex flex-wrap gap-2 p-2 bg-surface-hover border border-border rounded-lg focus-within:ring-2 focus-within:ring-[#FE0000] focus-within:outline-none transition-all">
              {techTags.map((tag, i) => (
                <span key={i} className="px-2 py-1 bg-deep-red/20 text-primary-red text-xs rounded-lg border border-primary-red/30 flex items-center gap-1">
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
            {errors.techStack && <p className="text-xs text-primary-red ml-1">{errors.techStack.message as string}</p>}
          </div>

          <button 
            disabled={isSubmitting}
            type="submit" 
            className={`w-full py-4 bg-bh-red-600 hover:bg-primary-red text-primary rounded-lg font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary-red/20 ${isSubmitting ? 'bh-btn-disabled' : ''}`}
          >
            {isSubmitting ? (
              <RoseSpinner size="sm" />
            ) : (
              <>
                <Send className="w-5 h-5" /> Submit Project
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
