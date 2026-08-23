import { RoseSpinner } from "@/components/ui/rose-loader";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-background/80">
      <RoseSpinner size="lg" />
      <p className="animate-pulse text-xs font-mono uppercase tracking-widest opacity-50">
        Initializing Trust Network...
      </p>
    </div>
  );
}
