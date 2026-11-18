"use client";

import { useState } from "react";
import Link from "next/link";
import { ShieldCheck, X } from "lucide-react";

import { RoseSpinner } from "@/components/ui/rose-loader";

export interface RegistrationConsent {
  code_of_conduct: boolean;
  rules: boolean;
  privacy: boolean;
  marketing: boolean;
}

interface Props {
  onClose: () => void;
  onConfirm: (consent: RegistrationConsent) => void;
  submitting?: boolean;
  error?: string | null;
}

/**
 * The consent step of event registration.
 *
 * Three acceptances are required — the Code of Conduct, the Hackathon Rules
 * and the Privacy Policy — and one opt-in is optional and off by default. The
 * wording matches `policies/REGISTRATION_NOTICES.md`; if one side changes,
 * change the other.
 */
export default function RegistrationConsentModal({
  onClose,
  onConfirm,
  submitting = false,
  error = null,
}: Props) {
  const [codeOfConduct, setCodeOfConduct] = useState(false);
  const [rules, setRules] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [marketing, setMarketing] = useState(false);

  const ready = codeOfConduct && rules && privacy;

  const checkboxClass =
    "mt-0.5 h-4 w-4 shrink-0 rounded border-border accent-primary-red";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="registration-consent-title"
        className="bg-background border border-border rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-lg bg-primary-red/10 text-primary-red">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <div>
              <h3 id="registration-consent-title" className="text-xl font-bold text-primary">
                Before you register
              </h3>
              <p className="text-xs text-muted-foreground">
                Three quick agreements, then you&apos;re in.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-surface-hover transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <label className="flex gap-3 items-start cursor-pointer">
            <input
              type="checkbox"
              checked={codeOfConduct}
              onChange={(e) => setCodeOfConduct(e.target.checked)}
              className={checkboxClass}
            />
            <span className="text-sm text-secondary leading-relaxed">
              I have read and agree to the{" "}
              <Link href="/policies/code-of-conduct" className="text-primary-red hover:underline">
                Code of Conduct
              </Link>
              .
            </span>
          </label>

          <label className="flex gap-3 items-start cursor-pointer">
            <input
              type="checkbox"
              checked={rules}
              onChange={(e) => setRules(e.target.checked)}
              className={checkboxClass}
            />
            <span className="text-sm text-secondary leading-relaxed">
              I agree to the{" "}
              <Link href="/policies/hackathon-rules" className="text-primary-red hover:underline">
                Hackathon Rules
              </Link>{" "}
              and I authorize Butwal Hacks to share my registration information with this
              event&apos;s organizers, judges and mentors so the event can run.
            </span>
          </label>

          <label className="flex gap-3 items-start cursor-pointer">
            <input
              type="checkbox"
              checked={privacy}
              onChange={(e) => setPrivacy(e.target.checked)}
              className={checkboxClass}
            />
            <span className="text-sm text-secondary leading-relaxed">
              I have read the{" "}
              <Link href="/policies/privacy" className="text-primary-red hover:underline">
                Privacy Policy
              </Link>
              , and I understand what is recorded against my registration — see the{" "}
              <Link href="/policies/registration-notices" className="text-primary-red hover:underline">
                registration notices
              </Link>
              .
            </span>
          </label>

          <div className="border-t border-border pt-4">
            <label className="flex gap-3 items-start cursor-pointer">
              <input
                type="checkbox"
                checked={marketing}
                onChange={(e) => setMarketing(e.target.checked)}
                className={checkboxClass}
              />
              <span className="text-sm text-secondary leading-relaxed">
                <span className="text-muted-foreground">(Optional)</span> Send me occasional
                emails about events, learning opportunities and community announcements. You
                can unsubscribe any time.
              </span>
            </label>
          </div>
        </div>

        {error && (
          <p role="alert" className="text-xs text-primary-red">
            {error}
          </p>
        )}

        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-lg bg-surface-hover border border-border hover:border-primary-red/40 transition-all text-sm font-bold text-secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!ready || submitting}
            onClick={() => onConfirm({ code_of_conduct: codeOfConduct, rules, privacy, marketing })}
            className="flex-1 px-4 py-3 rounded-lg bg-bh-red-action hover:bg-primary-red text-white transition-all text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <RoseSpinner size="sm" />
                Registering...
              </>
            ) : (
              "Confirm registration"
            )}
          </button>
        </div>

        {!ready && (
          <p className="text-xs text-muted-foreground">
            The first three boxes are required. If you are under 18, your guardian also has to
            sign the consent form the organizer sends you.
          </p>
        )}
      </div>
    </div>
  );
}
