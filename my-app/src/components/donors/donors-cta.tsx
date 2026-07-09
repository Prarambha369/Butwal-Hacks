import Link from "next/link"

export function DonorsCTA() {
  return (
    <div className="mt-16 rounded-xl border border-border bg-surface p-8 text-center">
      <h3 className="text-2xl font-bold font-heading text-primary">Join Our Community of Supporters</h3>
      <p className="mx-auto mt-3 max-w-2xl text-sm text-secondary">
        Your contribution, no matter the size, helps us create opportunities for aspiring technologists across Nepal.
        Be a part of the change.
      </p>
      <div className="mt-6">
        <Link
          href="/support"
          className="inline-block rounded-lg bg-primary px-8 py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Support Our Mission
        </Link>
      </div>
      <p className="mt-4 text-xs text-secondary">
        All donors are recognized according to their preference. If you wish to remain anonymous, please let us know.
      </p>
    </div>
  )
}
