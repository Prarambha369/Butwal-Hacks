"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, AlertTriangle, X } from 'lucide-react';
import { deleteProject } from '@/lib/actions/projects';
import { toast } from 'sonner';
import { RoseSpinner } from '@/components/ui/rose-loader';

export default function DeleteProjectButton({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const result = await deleteProject(projectId);
      if (result.success) {
        toast.success("Project deleted successfully");
        router.refresh();
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to delete project");
    } finally {
      setDeleting(false);
      setShowConfirm(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="p-2 rounded-lg hover:bg-bh-red-500/20 text-secondary hover:text-bh-red-500 transition-colors"
        title="Delete project"
      >
        <Trash2 size={16} />
      </button>

      {/* Confirmation dialog overlay */}
      {showConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
          onClick={() => setShowConfirm(false)}
        >
          <div
            className="lg-surface rounded-3xl border border-glass p-8 max-w-md w-full shadow-2xl animate-[fadeInUp_0.2s_ease-out] space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-bh-red-500/20 text-bh-red-500">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-primary">Delete Project</h3>
                  <p className="text-sm text-secondary opacity-60">This action cannot be undone.</p>
                </div>
              </div>
              <button
                onClick={() => setShowConfirm(false)}
                className="p-1 rounded-lg hover:bg-surface/10 text-secondary hover:text-primary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-secondary">
              Are you sure you want to delete this project? All likes and associated data will be permanently removed.
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={deleting}
                className="flex-1 py-3 rounded-2xl bg-surface/10 hover:bg-surface/20 text-secondary font-medium transition-all text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-3 rounded-2xl bg-bh-red-600 hover:bg-bh-red-500 text-primary font-bold transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
              >
                {deleting ? (
                  <RoseSpinner size="sm" />
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" /> Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
