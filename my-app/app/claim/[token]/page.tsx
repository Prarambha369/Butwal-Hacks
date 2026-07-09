import { Github } from "lucide-react"
import { buildPageMetadata } from "@/lib/seo"
import type { Metadata } from "next"

export const generateMetadata = (): Metadata =>
  buildPageMetadata({
    title: "Claim Your BH Hacker ID — Butwal Hacks",
    description: "You have been awarded a Trust Marker. Claim your Butwal Hacks Hacker ID to add it to your profile.",
    path: "/claim",
  })

interface ClaimPageProps {
  params: Promise<{ token: string }>
}

export default async function ClaimPage({ params }: ClaimPageProps) {
  const { token } = await params

  const githubHref = `/api/auth/github?claim_token=${encodeURIComponent(token)}`
  const googleHref = `/api/auth/google?claim_token=${encodeURIComponent(token)}`

  return (
    <main className="min-h-screen flex items-center justify-center px-4" style={{ background: "#1C1C1E" }}>
      <div
        className="bh-glass-surface w-full max-w-sm mx-auto p-8 rounded-[20px]"
        style={{ maxWidth: "24rem" }}
      >
        {/* Badge / Award icon */}
        <div className="text-center mb-6">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-4"
            style={{ background: "rgba(230,57,70,0.15)", border: "1px solid rgba(230,57,70,0.4)" }}
          >
            <span className="text-2xl" role="img" aria-label="Award">
              🏅
            </span>
          </div>
          <h1 className="text-xl font-bold text-white">Trust Marker Awarded!</h1>
          <p className="text-sm text-gray-400 mt-2 leading-relaxed">
            You have been awarded a Trust Marker! Claim your BH Hacker ID to add it to your profile.
          </p>
        </div>

        {/* OAuth Buttons */}
        <div className="flex flex-col gap-3 mt-6">
          <a
            href={githubHref}
            className="bh-capsule flex items-center justify-center gap-3 w-full py-3 px-6 rounded-full font-medium text-sm transition-opacity hover:opacity-80"
            style={{ background: "#24292e", color: "#fff", border: "1px solid #444" }}
          >
            <Github size={18} />
            Claim with GitHub
          </a>

          <a
            href={googleHref}
            className="bh-capsule flex items-center justify-center gap-3 w-full py-3 px-6 rounded-full font-medium text-sm transition-opacity hover:opacity-80"
            style={{ background: "#1a1a2e", color: "#fff", border: "1px solid #444" }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path
                d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
                fill="#4285F4"
              />
              <path
                d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
                fill="#34A853"
              />
              <path
                d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
                fill="#FBBC05"
              />
              <path
                d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
                fill="#EA4335"
              />
            </svg>
            Claim with Google
          </a>
        </div>

        <p className="text-xs text-gray-500 text-center mt-6 leading-relaxed">
          Signing in will link this Trust Marker to your Butwal Hacks profile permanently.
        </p>
      </div>
    </main>
  )
}
