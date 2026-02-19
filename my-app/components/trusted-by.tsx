import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"

interface Organization {
  name: string
  logo: string
  colorLogo: string
}

const organizations: Organization[] = [
  {
    name: "The Hack Foundation",
    logo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%23333' width='100' height='100' rx='8'/%3E%3Cpath d='M25 30 L50 20 L75 30 L75 70 L50 80 L25 70 Z' fill='none' stroke='%23fff' strokeWidth='2'/%3E%3Ctext x='50' y='55' fontSize='14' fontWeight='bold' fill='%23fff' textAnchor='middle'%3ETHF%3C/text%3E%3C/svg%3E",
    colorLogo:
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%231E40AF' width='100' height='100' rx='8'/%3E%3Cpath d='M25 30 L50 20 L75 30 L75 70 L50 80 L25 70 Z' fill='none' stroke='%23fff' strokeWidth='2'/%3E%3Ctext x='50' y='55' fontSize='14' fontWeight='bold' fill='%23fff' textAnchor='middle'%3ETHF%3C/text%3E%3C/svg%3E",
  },
  {
    name: "Jukebox",
    logo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%23333' width='100' height='100' rx='8'/%3E%3Ccircle cx='50' cy='50' r='25' fill='none' stroke='%23fff' strokeWidth='2'/%3E%3Ccircle cx='50' cy='50' r='8' fill='%23fff'/%3E%3Ctext x='50' y='90' fontSize='12' fontWeight='bold' fill='%23fff' textAnchor='middle'%3EJUKEBOX%3C/text%3E%3C/svg%3E",
    colorLogo:
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%238B5CF6' width='100' height='100' rx='8'/%3E%3Ccircle cx='50' cy='50' r='25' fill='none' stroke='%23fff' strokeWidth='2'/%3E%3Ccircle cx='50' cy='50' r='8' fill='%23fff'/%3E%3Ctext x='50' y='90' fontSize='12' fontWeight='bold' fill='%23fff' textAnchor='middle'%3EJUKEBOX%3C/text%3E%3C/svg%3E",
  },
  {
    name: "Arambha Resort",
    logo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%23333' width='100' height='100' rx='8'/%3E%3Cpath d='M50 20 L80 50 L65 50 L65 80 L35 80 L35 50 L20 50 Z' fill='none' stroke='%23fff' strokeWidth='2'/%3E%3Ctext x='50' y='95' fontSize='10' fontWeight='bold' fill='%23fff' textAnchor='middle'%3EARAMBHA%3C/text%3E%3C/svg%3E",
    colorLogo:
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%2316A34A' width='100' height='100' rx='8'/%3E%3Cpath d='M50 20 L80 50 L65 50 L65 80 L35 80 L35 50 L20 50 Z' fill='none' stroke='%23fff' strokeWidth='2'/%3E%3Ctext x='50' y='95' fontSize='10' fontWeight='bold' fill='%23fff' textAnchor='middle'%3EARAMBHA%3C/text%3E%3C/svg%3E",
  },
  {
    name: "GitHub Education",
    logo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%23333' width='100' height='100' rx='8'/%3E%3Cpath d='M50 15 C30 15 15 30 15 50 C15 66 26 79 41 83 C43 83.4 44 82 44 81 L44 75 C32 77 29 70 29 70 C27 66 24 65 24 65 C20 62 24 62 24 62 C29 62 31 67 31 67 C35 73 42 71 44 70 C44 67 45 65 47 64 C37 63 26 59 26 47 C26 43 28 40 31 37 C30 36 28 32 31 27 C31 27 35 26 44 31 C47 30 51 30 54 30 C57 30 61 30 64 31 C73 26 77 27 77 27 C80 32 78 36 77 37 C80 40 82 43 82 47 C82 59 71 63 61 64 C63 66 64 69 64 73 L64 81 C64 82 65 83.4 67 83 C82 79 93 66 93 50 C93 30 78 15 50 15 Z' fill='%23fff'/%3E%3C/svg%3E",
    colorLogo:
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%23181717' width='100' height='100' rx='8'/%3E%3Cpath d='M50 15 C30 15 15 30 15 50 C15 66 26 79 41 83 C43 83.4 44 82 44 81 L44 75 C32 77 29 70 29 70 C27 66 24 65 24 65 C20 62 24 62 24 62 C29 62 31 67 31 67 C35 73 42 71 44 70 C44 67 45 65 47 64 C37 63 26 59 26 47 C26 43 28 40 31 37 C30 36 28 32 31 27 C31 27 35 26 44 31 C47 30 51 30 54 30 C57 30 61 30 64 31 C73 26 77 27 77 27 C80 32 78 36 77 37 C80 40 82 43 82 47 C82 59 71 63 61 64 C63 66 64 69 64 73 L64 81 C64 82 65 83.4 67 83 C82 79 93 66 93 50 C93 30 78 15 50 15 Z' fill='%23fff'/%3E%3C/svg%3E",
  },
  {
    name: "Google Gemini",
    logo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%23333' width='100' height='100' rx='8'/%3E%3Ccircle cx='35' cy='50' r='15' fill='none' stroke='%23fff' strokeWidth='2'/%3E%3Ccircle cx='65' cy='50' r='15' fill='none' stroke='%23fff' strokeWidth='2'/%3E%3Cpath d='M50 35 L50 65' stroke='%23fff' strokeWidth='2'/%3E%3C/svg%3E",
    colorLogo:
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%234285F4' width='100' height='100' rx='8'/%3E%3Ccircle cx='35' cy='50' r='15' fill='none' stroke='%23fff' strokeWidth='2'/%3E%3Ccircle cx='65' cy='50' r='15' fill='none' stroke='%23fff' strokeWidth='2'/%3E%3Cpath d='M50 35 L50 65' stroke='%23fff' strokeWidth='2'/%3E%3C/svg%3E",
  },
  {
    name: "MLH",
    logo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%23333' width='100' height='100' rx='8'/%3E%3Cpolygon points='50,15 85,35 85,75 50,95 15,75 15,35' fill='none' stroke='%23fff' strokeWidth='2'/%3E%3Ctext x='50' y='60' fontSize='18' fontWeight='bold' fill='%23fff' textAnchor='middle'%3EMLH%3C/text%3E%3C/svg%3E",
    colorLogo:
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%23265A8F' width='100' height='100' rx='8'/%3E%3Cpolygon points='50,15 85,35 85,75 50,95 15,75 15,35' fill='none' stroke='%23fff' strokeWidth='2'/%3E%3Ctext x='50' y='60' fontSize='18' fontWeight='bold' fill='%23fff' textAnchor='middle'%3EMLH%3C/text%3E%3C/svg%3E",
  },
  {
    name: "GNOME Nepal",
    logo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%23333' width='100' height='100' rx='8'/%3E%3Ccircle cx='50' cy='40' r='20' fill='none' stroke='%23fff' strokeWidth='2'/%3E%3Cellipse cx='50' cy='75' rx='25' ry='10' fill='none' stroke='%23fff' strokeWidth='2'/%3E%3Ctext x='50' y='45' fontSize='10' fontWeight='bold' fill='%23fff' textAnchor='middle'%3EGNOME%3C/text%3E%3C/svg%3E",
    colorLogo:
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%234A86CF' width='100' height='100' rx='8'/%3E%3Ccircle cx='50' cy='40' r='20' fill='none' stroke='%23fff' strokeWidth='2'/%3E%3Cellipse cx='50' cy='75' rx='25' ry='10' fill='none' stroke='%23fff' strokeWidth='2'/%3E%3Ctext x='50' y='45' fontSize='10' fontWeight='bold' fill='%23fff' textAnchor='middle'%3EGNOME%3C/text%3E%3C/svg%3E",
  },
  {
    name: "Nextera Development",
    logo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%23333' width='100' height='100' rx='8'/%3E%3Cpath d='M25 75 L25 25 L50 50 L75 25 L75 75' fill='none' stroke='%23fff' strokeWidth='3'/%3E%3Ctext x='50' y='95' fontSize='9' fontWeight='bold' fill='%23fff' textAnchor='middle'%3ENEXTERA%3C/text%3E%3C/svg%3E",
    colorLogo:
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%230EA5E9' width='100' height='100' rx='8'/%3E%3Cpath d='M25 75 L25 25 L50 50 L75 25 L75 75' fill='none' stroke='%23fff' strokeWidth='3'/%3E%3Ctext x='50' y='95' fontSize='9' fontWeight='bold' fill='%23fff' textAnchor='middle'%3ENEXTERA%3C/text%3E%3C/svg%3E",
  },
  {
    name: "Cyberutsav",
    logo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%23333' width='100' height='100' rx='8'/%3E%3Ccircle cx='50' cy='50' r='30' fill='none' stroke='%23fff' strokeWidth='2'/%3E%3Cpath d='M35 40 L50 55 L65 40' fill='none' stroke='%23fff' strokeWidth='2'/%3E%3Cpath d='M35 55 L50 70 L65 55' fill='none' stroke='%23fff' strokeWidth='2'/%3E%3C/svg%3E",
    colorLogo:
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%23DC2626' width='100' height='100' rx='8'/%3E%3Ccircle cx='50' cy='50' r='30' fill='none' stroke='%23fff' strokeWidth='2'/%3E%3Cpath d='M35 40 L50 55 L65 40' fill='none' stroke='%23fff' strokeWidth='2'/%3E%3Cpath d='M35 55 L50 70 L65 55' fill='none' stroke='%23fff' strokeWidth='2'/%3E%3C/svg%3E",
  },
  {
    name: "Teckgutkha",
    logo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%23333' width='100' height='100' rx='8'/%3E%3Cpath d='M30 30 L70 30 L70 45 L55 45 L55 75 L45 75 L45 45 L30 45 Z' fill='%23fff'/%3E%3Ctext x='50' y='92' fontSize='8' fontWeight='bold' fill='%23fff' textAnchor='middle'%3ETECKGUTKHA%3C/text%3E%3C/svg%3E",
    colorLogo:
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%23F59E0B' width='100' height='100' rx='8'/%3E%3Cpath d='M30 30 L70 30 L70 45 L55 45 L55 75 L45 75 L45 45 L30 45 Z' fill='%23fff'/%3E%3Ctext x='50' y='92' fontSize='8' fontWeight='bold' fill='%23fff' textAnchor='middle'%3ETECKGUTKHA%3C/text%3E%3C/svg%3E",
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
                      src={org.colorLogo || "/placeholder.svg"}
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
