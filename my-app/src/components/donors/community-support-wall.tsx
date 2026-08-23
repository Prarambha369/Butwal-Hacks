import { Card, CardContent } from "@/components/ui/card"

const communitySupport = [
  { name: "Ramesh K.", message: "Keep up the amazing work!", amount: "NPR 2,500" },
  { name: "Anjali D.", message: "So proud of this initiative!", amount: "NPR 5,000" },
  { name: "Tech Enthusiasts Club", message: "Building the future together.", amount: "NPR 7,500" },
  { name: "Bishal M.", message: "Education is the key to progress.", amount: "NPR 3,000" },
  { name: "Maya S.", message: "Thank you for supporting our youth!", amount: "NPR 4,000" },
  { name: "CodeCrafters Nepal", message: "Excited to see Nepal's tech scene grow.", amount: "NPR 8,000" },
]

export function CommunitySupportWall() {
  return (
    <div className="mt-16">
      <h2 className="text-center text-3xl font-bold font-heading text-primary">Community Support Wall</h2>
      <p className="mx-auto mt-2 max-w-2xl text-center text-sm text-secondary">
        Every contribution matters. Thank you to all our community supporters!
      </p>
      <div className="mt-8 columns-1 gap-4 sm:columns-2 lg:columns-3">
        {communitySupport.map((supporter, idx) => (
          <Card key={idx} className="mb-4 break-inside-avoid border-border">
            <CardContent className="p-4">
              <div className="mb-2 flex items-start justify-between">
                <div className="font-semibold text-primary">{supporter.name}</div>
                <div className="text-xs font-medium text-primary">{supporter.amount}</div>
              </div>
              <p className="text-sm text-secondary">{supporter.message}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
