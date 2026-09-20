"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { t } from "@/lib/i18n";
import SectionEyebrow from "@/components/section-eyebrow";

const faqs = [
  { id: "free", qKey: "home.faq.items.free.q", aKey: "home.faq.items.free.a" },
  { id: "who-can-join", qKey: "home.faq.items.who-can-join.q", aKey: "home.faq.items.who-can-join.a" },
  { id: "donations", qKey: "home.faq.items.donations.q", aKey: "home.faq.items.donations.a" },
  { id: "volunteer", qKey: "home.faq.items.volunteer.q", aKey: "home.faq.items.volunteer.a" },
  { id: "events", qKey: "home.faq.items.events.q", aKey: "home.faq.items.events.a" },
  { id: "nonprofit-status", qKey: "home.faq.items.nonprofit-status.q", aKey: "home.faq.items.nonprofit-status.a" },
];

export default function NonProfitFAQ() {
  const [openId, setOpenId] = useState<string | null>(null);
  const { locale } = useLanguage();

  const toggle = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <section aria-labelledby="faq-heading" className="py-16 md:py-24 bg-background border-b border-border">
      <div className="mx-auto max-w-3xl px-4">
        <div className="text-center mb-12">
          <div className="mb-4">
            <SectionEyebrow text={t('home.faq.badge', locale)} />
          </div>
          <h2 id="faq-heading" className="text-3xl md:text-5xl font-bold text-primary tracking-tight leading-[1.05] text-balance">
            {t('home.faq.title', locale)}
          </h2>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto text-sm">
            {t('home.faq.subtitle', locale)}
          </p>
        </div>

        <div className="border border-border rounded-xl divide-y divide-border bg-background">
          {faqs.map((faq) => {
            const isOpen = openId === faq.id;
            return (
              <div key={faq.id}>
                <h3>
                  <button
                    onClick={() => toggle(faq.id)}
                    className="flex items-center justify-between w-full px-5 py-4 text-left transition-colors hover:bg-surface-hover"
                    aria-expanded={isOpen}
                    aria-controls={`faq-panel-${faq.id}`}
                    id={`faq-trigger-${faq.id}`}
                  >
                    <span className="text-sm font-semibold text-primary pr-4">
                      {t(faq.qKey, locale)}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                      aria-hidden="true"
                    />
                  </button>
                </h3>
                <div
                  id={`faq-panel-${faq.id}`}
                  role="region"
                  aria-labelledby={`faq-trigger-${faq.id}`}
                  aria-hidden={!isOpen}
                  className={`overflow-hidden transition-all duration-200 ease-in-out ${
                    isOpen ? "max-h-96 opacity-100 pb-4" : "max-h-0 opacity-0"
                  }`}
                >
                  <p className="px-5 text-sm text-muted-foreground leading-relaxed">
                    {t(faq.aKey, locale)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
