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
    <section className="py-14 sm:py-16 px-4" aria-labelledby="trusted-by-heading">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-8">
          <h2 id="trusted-by-heading" className="text-3xl sm:text-4xl font-bold text-white mb-3">Trusted By</h2>
          <p className="text-slate-300 text-sm sm:text-base px-2">Organizations and communities that support our long-term mission</p>
        </header>

        <Card className="border-border/70 bg-card/90">
          <CardHeader>
            <CardTitle className="text-white text-base sm:text-lg">Institutional and Community Partners</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {organizations.map((org) => (
                <li key={org.name}>
                  <article className="border border-border/70 rounded-md p-3 bg-slate-900/50 hover:bg-slate-900 transition-colors">
                    <Image
                      src={org.logo || "/placeholder.svg"}
                      alt={org.name}
                      width={160}
                      height={160}
                      unoptimized
                      className="w-full aspect-square rounded object-cover mb-2"
                    />
                    <h3 className="text-xs sm:text-sm text-slate-200 font-medium leading-snug">{org.name}</h3>
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
