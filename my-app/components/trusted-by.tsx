import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"

interface Organization {
  name: string
  logo: string
}

const organizations: Organization[] = [
  {
    name: "The Hack Foundation",
    logo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%232d2d2d' width='100' height='100' rx='8' stroke='%23dc2626' strokeWidth='2'/%3E%3Ctext x='50' y='50' fontSize='12' fontWeight='bold' fill='%23ffffff' textAnchor='middle' dominantBaseline='middle'%3ELOGO%3C/text%3E%3C/svg%3E",
  },
  {
    name: "Jukebox",
    logo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%232d2d2d' width='100' height='100' rx='8' stroke='%23dc2626' strokeWidth='2'/%3E%3Ctext x='50' y='50' fontSize='12' fontWeight='bold' fill='%23ffffff' textAnchor='middle' dominantBaseline='middle'%3ELOGO%3C/text%3E%3C/svg%3E",
  },
  {
    name: "Arambha Resort",
    logo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%232d2d2d' width='100' height='100' rx='8' stroke='%23dc2626' strokeWidth='2'/%3E%3Ctext x='50' y='50' fontSize='12' fontWeight='bold' fill='%23ffffff' textAnchor='middle' dominantBaseline='middle'%3ELOGO%3C/text%3E%3C/svg%3E",
  },
  {
    name: "GitHub Education",
    logo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%232d2d2d' width='100' height='100' rx='8' stroke='%23dc2626' strokeWidth='2'/%3E%3Ctext x='50' y='50' fontSize='12' fontWeight='bold' fill='%23ffffff' textAnchor='middle' dominantBaseline='middle'%3ELOGO%3C/text%3E%3C/svg%3E",
  },
  {
    name: "Google Gemini",
    logo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%232d2d2d' width='100' height='100' rx='8' stroke='%23dc2626' strokeWidth='2'/%3E%3Ctext x='50' y='50' fontSize='12' fontWeight='bold' fill='%23ffffff' textAnchor='middle' dominantBaseline='middle'%3ELOGO%3C/text%3E%3C/svg%3E",
  },
  {
    name: "MLH",
    logo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%232d2d2d' width='100' height='100' rx='8' stroke='%23dc2626' strokeWidth='2'/%3E%3Ctext x='50' y='50' fontSize='12' fontWeight='bold' fill='%23ffffff' textAnchor='middle' dominantBaseline='middle'%3ELOGO%3C/text%3E%3C/svg%3E",
  },
  {
    name: "GNOME Nepal",
    logo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%232d2d2d' width='100' height='100' rx='8' stroke='%23dc2626' strokeWidth='2'/%3E%3Ctext x='50' y='50' fontSize='12' fontWeight='bold' fill='%23ffffff' textAnchor='middle' dominantBaseline='middle'%3ELOGO%3C/text%3E%3C/svg%3E",
  },
  {
    name: "Nextera Development",
    logo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%232d2d2d' width='100' height='100' rx='8' stroke='%23dc2626' strokeWidth='2'/%3E%3Ctext x='50' y='50' fontSize='12' fontWeight='bold' fill='%23ffffff' textAnchor='middle' dominantBaseline='middle'%3ELOGO%3C/text%3E%3C/svg%3E",
  },
  {
    name: "Cyberutsav",
    logo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%232d2d2d' width='100' height='100' rx='8' stroke='%23dc2626' strokeWidth='2'/%3E%3Ctext x='50' y='50' fontSize='12' fontWeight='bold' fill='%23ffffff' textAnchor='middle' dominantBaseline='middle'%3ELOGO%3C/text%3E%3C/svg%3E",
  },
  {
    name: "Teckgutkha",
    logo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%232d2d2d' width='100' height='100' rx='8' stroke='%23dc2626' strokeWidth='2'/%3E%3Ctext x='50' y='50' fontSize='12' fontWeight='bold' fill='%23ffffff' textAnchor='middle' dominantBaseline='middle'%3ELOGO%3C/text%3E%3C/svg%3E",
  },
]

export default function TrustedBy() {
  return (
    <section className="py-10" aria-labelledby="trusted-by-heading">
      <div className="h-full">
        <header className="mb-6">
          <h2 id="trusted-by-heading" className="text-3xl sm:text-4xl font-bold font-heading text-foreground mb-2">Trusted By</h2>
          <p className="text-muted-foreground text-sm sm:text-base">Institutional and Community Partners</p>
        </header>

        <Card className="border-border card-cream h-full">
          <CardHeader>
            <CardTitle className="text-foreground text-base sm:text-lg">Organizations Supporting Our Mission</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3" aria-label="Partner organizations">
              {organizations.map((org) => (
                <li key={org.name}>
                  <article className="h-full border border-border rounded-md p-3 bg-card hover:bg-muted transition-colors">
                    <Image
                      src={org.logo || "/placeholder.svg"}
                      alt={org.name}
                      width={120}
                      height={120}
                      unoptimized
                      className="w-full aspect-[4/3] rounded object-contain mb-2"
                    />
                    <h3 className="text-xs sm:text-sm text-foreground font-medium leading-snug text-center">{org.name}</h3>
                  </article>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
