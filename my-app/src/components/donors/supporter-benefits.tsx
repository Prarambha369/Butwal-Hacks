import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function SupporterBenefits() {
  return (
    <div className="mt-16">
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-2xl font-heading">Benefits for Our Supporters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <h3 className="mb-2 font-semibold text-primary">Recognition</h3>
              <ul className="space-y-1 text-sm text-secondary">
                <li>• Featured on our website</li>
                <li>• Social media acknowledgment</li>
                <li>• Annual impact reports</li>
              </ul>
            </div>
            <div>
              <h3 className="mb-2 font-semibold text-primary">For Corporate Sponsors</h3>
              <ul className="space-y-1 text-sm text-secondary">
                <li>• Logo placement at events</li>
                <li>• Recruitment opportunities</li>
                <li>• Brand visibility</li>
              </ul>
            </div>
            <div>
              <h3 className="mb-2 font-semibold text-primary">Community Impact</h3>
              <ul className="space-y-1 text-sm text-secondary">
                <li>• Direct program support</li>
                <li>• Quarterly updates</li>
                <li>• Invitation to events</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
