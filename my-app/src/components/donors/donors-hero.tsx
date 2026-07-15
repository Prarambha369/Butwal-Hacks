import Breadcrumbs from "@/components/breadcrumbs"

export function DonorsHero() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-14 sm:py-16">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Donors" }]} />
      <div className="text-center">
        <h1 className="text-4xl sm:text-5xl font-bold font-heading tracking-tight text-primary">
          Donor Recognition Wall
        </h1>
        <p className="mx-auto mt-5 max-w-3xl text-base sm:text-lg text-secondary">
          We are deeply grateful to these individuals and organizations whose generosity makes our mission possible.
          Together, we&apos;re building a stronger tech community in Nepal.
        </p>
      </div>
    </section>
  )
}
