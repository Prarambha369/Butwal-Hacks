import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-md">
        <h1 className="text-8xl font-extrabold tracking-tight text-primary">404</h1>
        <h2 className="text-2xl font-semibold text-primary">Page Not Found</h2>
        <p className="text-secondary">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex gap-4 justify-center pt-4">
          <Button asChild>
            <Link href="/">Back to Home</Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link href="/community">Explore Community</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
