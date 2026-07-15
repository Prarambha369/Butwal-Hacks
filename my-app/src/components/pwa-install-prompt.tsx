"use client"

import { useEffect, useState } from "react"
import { Download, X, RefreshCw } from "lucide-react"
import { useLanguage } from "@/components/language-provider"
import { t } from "@/lib/i18n"

/**
 * PWAInstallPrompt — handles install banner and service worker update notification.
 * ponytail: one-shot install prompt, no complex state machine.
 */
export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null)
  const [showInstall, setShowInstall] = useState(false)
  const [showUpdate, setShowUpdate] = useState(false)
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null)
  const { locale } = useLanguage()

  useEffect(() => {
    // Skip in dev mode
    if (process.env.NODE_ENV === "development") return

    // Listen for install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstall(true)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstall)

    // Listen for service worker updates
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        window.location.reload()
      })

      navigator.serviceWorker.ready.then((reg) => {
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                setShowUpdate(true)
                setWaitingWorker(newWorker)
              }
            })
          }
        })
      })
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    const prompt = deferredPrompt as unknown as { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }
    await prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === "accepted") {
      setShowInstall(false)
      setDeferredPrompt(null)
    }
  }

  const handleUpdate = () => {
    if (waitingWorker) {
      waitingWorker.postMessage("SKIP_WAITING")
      setShowUpdate(false)
    }
  }

  if (!showInstall && !showUpdate) return null

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-sm w-full px-4">
      {showInstall && (
        <div className="bh-card p-4 flex items-center gap-3 shadow-[0_8px_32px_rgba(0,0,0,0.4)] animate-in slide-in-from-bottom-4 duration-300">
          <div className="p-2 rounded-xl bg-primary-red/10">
            <Download className="w-5 h-5 text-primary-red" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-primary">{t("pwa.install_title", locale)}</p>
            <p className="text-xs text-secondary">{t("pwa.install_desc", locale)}</p>
          </div>
          <button
            onClick={handleInstall}
            className="px-4 py-2 rounded-xl bg-bh-red-500 text-white text-xs font-bold hover:bg-deep-red transition-all shrink-0"
          >
            {t("pwa.install_button", locale)}
          </button>
          <button
            onClick={() => setShowInstall(false)}
            className="p-1 rounded-lg hover:bg-surface/10 text-secondary shrink-0"
            aria-label={t("pwa.dismiss", locale)}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {showUpdate && (
        <div className="bh-card p-4 flex items-center gap-3 shadow-[0_8px_32px_rgba(0,0,0,0.4)] animate-in slide-in-from-bottom-4 duration-300">
          <div className="p-2 rounded-xl bg-status-blue/10">
            <RefreshCw className="w-5 h-5 text-status-blue" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-primary">{t("pwa.update_title", locale)}</p>
            <p className="text-xs text-secondary">{t("pwa.update_desc", locale)}</p>
          </div>
          <button
            onClick={handleUpdate}
            className="px-4 py-2 rounded-xl bg-bh-red-500 text-white text-xs font-bold hover:bg-deep-red transition-all shrink-0"
          >
            {t("pwa.refresh_button", locale)}
          </button>
          <button
            onClick={() => setShowUpdate(false)}
            className="p-1 rounded-lg hover:bg-surface/10 text-secondary shrink-0"
            aria-label={t("pwa.dismiss", locale)}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}
