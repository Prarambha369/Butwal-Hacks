import type { Metadata } from "next"
import Breadcrumbs from "@/components/breadcrumbs"
import Footer from "@/components/footer"
import SiteHeader from "@/components/site-header"
import { ImageSlider } from "@/components/image-slider"
import { Parallax } from "@/components/parallax"
import { buildPageMetadata } from "@/lib/seo"

export const metadata: Metadata = buildPageMetadata({
  title: "Features Showcase",
  description: "Explore advanced web features like image slider, parallax effects, and smooth scroll.",
  path: "/showcase",
})

// Sample images for slider
const showcaseImages = [
  {
    url: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=600&fit=crop",
    title: "Hackathon 2024",
    description: "Innovation and collaboration at its finest",
  },
  {
    url: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&h=600&fit=crop",
    title: "Community Meetup",
    description: "Building connections through technology",
  },
  {
    url: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=600&fit=crop",
    title: "Tech Workshop",
    description: "Learning and growing together",
  },
  {
    url: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=600&fit=crop",
    title: "Mentorship Sessions",
    description: "Guiding the next generation",
  },
]

export default function ShowcasePage() {
  return (
    <main className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero Section with Parallax */}
      <section className="relative h-screen w-full overflow-hidden flex items-center justify-center">
        <Parallax speed={0.5}>
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1552664730-d307ca884978?w=1400&h=800&fit=crop')",
            }}
          />
        </Parallax>

        <div className="relative z-10 text-center text-white">
          <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black mb-6 drop-shadow-lg">
            Features Showcase
          </h1>
          <p className="text-xl sm:text-2xl drop-shadow-lg max-w-2xl mx-auto">
            Explore modern web features with smooth scroll, parallax effects, and advanced animations
          </p>
        </div>

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/50 z-[5]" />
      </section>

      {/* Breadcrumbs & Title */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Showcase" },
          ]}
        />
      </section>

      {/* Image Slider Section */}
      <section className="mx-auto max-w-6xl px-4 py-20 border-b border-border">
        <div className="mb-12">
          <h2 className="text-5xl font-black text-foreground mb-4">Image Slider</h2>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Professional carousel with autoplay, fade transitions, and custom navigation.
          </p>
        </div>

        <ImageSlider images={showcaseImages} autoplay interval={5000} height="h-[600px]" />

        <div className="mt-8 p-6 bg-muted rounded-lg">
          <h3 className="font-semibold text-foreground mb-2">Features:</h3>
          <ul className="space-y-2 text-muted-foreground">
            <li>✅ Autoplay with customizable interval</li>
            <li>✅ Smooth fade transitions</li>
            <li>✅ Custom arrow navigation</li>
            <li>✅ Dynamic pagination bullets</li>
            <li>✅ Touch-friendly on mobile</li>
            <li>✅ Fully responsive</li>
          </ul>
        </div>
      </section>

      {/* Parallax Section 1 */}
      <section className="relative py-32 overflow-hidden">
        <Parallax speed={0.3} className="absolute inset-0 z-0">
          <div
            className="w-full h-full bg-cover bg-center"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1552664730-d307ca884978?w=1400&h=800&fit=crop')",
            }}
          />
        </Parallax>

        <div className="absolute inset-0 bg-black/40 z-[1]" />

        <div className="relative z-10 mx-auto max-w-4xl px-4 text-center text-white">
          <h2 className="text-5xl font-black mb-6">Parallax Scrolling</h2>
          <p className="text-xl leading-relaxed max-w-2xl mx-auto">
            Create depth and dimension as you scroll. The parallax effect makes foreground elements
            appear to move faster than the background, creating a 3D illusion.
          </p>
        </div>
      </section>

      {/* Smooth Scroll Demo Section */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <h2 className="text-5xl font-black text-foreground mb-4">Smooth Scroll Experience</h2>
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl">
          Powered by Lenis, the page scrolls smoothly with easing. Try scrolling to see the difference!
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div
              key={item}
              className="p-8 border-2 border-border rounded-xl hover:shadow-lg transition-shadow"
            >
              <h3 className="text-2xl font-bold text-foreground mb-4">Card {item}</h3>
              <p className="text-muted-foreground">
                Scroll smoothly through multiple sections with animated transitions and parallax
                effects.
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Animation Demo */}
      <section className="mx-auto max-w-6xl px-4 py-20 border-t border-b border-border">
        <h2 className="text-5xl font-black text-foreground mb-12 text-center">Animate.css Integration</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-8 bg-red-950/20 rounded-xl border border-red-600/50">
            <h3 className="text-2xl font-bold text-foreground mb-4">Success Animation</h3>
            <div className="animate__animated animate__bounce p-6 bg-green-600/20 rounded text-green-600 font-semibold text-center">
              ✓ Success Message
            </div>
          </div>

          <div className="p-8 bg-red-950/20 rounded-xl border border-red-600/50">
            <h3 className="text-2xl font-bold text-foreground mb-4">Fade In Animation</h3>
            <div className="animate__animated animate__fadeInUp p-6 bg-blue-600/20 rounded text-blue-600 font-semibold text-center">
              ✨ Fade In Effect
            </div>
          </div>
        </div>
      </section>

      {/* 3D Particles Demo */}
      <section className="relative mx-auto max-w-6xl px-4 py-20">
        <h2 className="text-5xl font-black text-foreground mb-4 text-center">Three.js Particles</h2>
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto text-center">
          Background particle animation using Three.js. View in the enhanced hero section above.
        </p>

        <div className="p-8 bg-muted rounded-xl border-2 border-border text-center">
          <p className="text-muted-foreground mb-4">Features:</p>
          <ul className="space-y-2 text-muted-foreground inline-block text-left">
            <li>✅ 500+ animated particles</li>
            <li>✅ Real-time physics</li>
            <li>✅ WebGL optimized</li>
            <li>✅ Responsive canvas</li>
            <li>✅ Smooth rotations</li>
            <li>✅ Low memory footprint</li>
          </ul>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="mx-auto max-w-6xl px-4 py-20 text-center">
        <h2 className="text-5xl font-black text-foreground mb-6">Ready to Explore?</h2>
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          Check out the contact page to see the enhanced contact form in action.
        </p>
        <a
          href="/contact"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-500 px-10 py-4 text-base font-bold text-white shadow-xl shadow-red-950/50 hover:from-red-500 hover:to-red-400 transition-all"
        >
          View Contact Form
        </a>
      </section>

      <Footer />
    </main>
  )
}

