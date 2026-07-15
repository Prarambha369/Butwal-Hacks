"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, Loader2, Building2, User, MapPin, Hash } from "lucide-react";
import { toast } from "sonner";
import { dedicateSchool } from "@/lib/actions/admin";

export default function DedicateSchoolPage() {
  const router = useRouter();
  const [schoolName, setSchoolName] = useState("");
  const [leadName, setLeadName] = useState("");
  const [leadBhId, setLeadBhId] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!schoolName.trim() || !leadName.trim() || !city.trim()) {
      setError("School name, lead name, and city are required.");
      return;
    }

    setSubmitting(true);

    try {
      const result = await dedicateSchool({
        schoolName: schoolName.trim(),
        leadName: leadName.trim(),
        leadBhId: leadBhId.trim() || undefined,
        city: city.trim(),
        district: district.trim() || undefined,
      });

      if (result.success) {
        toast.success("School chapter created!", {
          description: `${schoolName.trim()} is now live as an active chapter led by ${leadName.trim()}.`,
        });
        router.push("/dashboard/maintainer");
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to dedicate school.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-primary">
          Dedicate a School Chapter
        </h1>
        <p className="text-sm text-muted-foreground">
          Create a new school-based chapter with an assigned student lead. The chapter will appear on
          the public chapters page immediately.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-xl space-y-5">
        <div>
          <label htmlFor="schoolName" className="mb-1.5 block text-sm font-medium text-primary">
            <span className="inline-flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              School Name
            </span>
          </label>
          <input
            id="schoolName"
            type="text"
            value={schoolName}
            onChange={(e) => setSchoolName(e.target.value)}
            placeholder="e.g. Bhawani Secondary School"
            className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-primary placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary-red/30 transition-all"
            autoFocus
          />
        </div>

        <div>            <label htmlFor="leadName" className="mb-1.5 block text-sm font-medium text-primary">
              <span className="inline-flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                Student Lead Name
              </span>
            </label>
            <input
              id="leadName"
              type="text"
              value={leadName}
              onChange={(e) => setLeadName(e.target.value)}
              placeholder="e.g. Sushant Acharya"
              className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-primary placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary-red/30 transition-all"
            />
          </div>

          <div>
            <label htmlFor="leadBhId" className="mb-1.5 block text-sm font-medium text-primary">
              <span className="inline-flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5" />
                Lead BH-ID <span className="text-muted-foreground/50">(optional)</span>
              </span>
            </label>
            <input
              id="leadBhId"
              type="text"
              value={leadBhId}
              onChange={(e) => setLeadBhId(e.target.value)}
              placeholder="e.g. BH-24-042"
              className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-primary placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary-red/30 transition-all"
            />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="city" className="mb-1.5 block text-sm font-medium text-primary">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                City
              </span>
            </label>
            <input
              id="city"
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Butwal"
              className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-primary placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary-red/30 transition-all"
            />
          </div>
          <div>
            <label htmlFor="district" className="mb-1.5 block text-sm font-medium text-primary">
              District <span className="text-muted-foreground/50">(optional)</span>
            </label>
            <input
              id="district"
              type="text"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              placeholder="e.g. Rupandehi"
              className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-primary placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary-red/30 transition-all"
            />
          </div>
        </div>

        {error && (
          <p className="text-sm text-primary-red bg-primary-red/5 rounded-lg px-3 py-2 border border-primary-red/20">
            {error}
          </p>
        )}

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-full bg-primary-red px-6 py-2.5 text-sm font-bold text-white hover:bg-deep-red transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <GraduationCap className="w-4 h-4" />
            )}
            {submitting ? "Dedicating..." : "Dedicate School"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/dashboard/maintainer")}
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>

      {/* Info card */}
      <div className="rounded-xl border border-border bg-surface p-6 max-w-xl space-y-3">
        <h3 className="text-sm font-bold text-primary flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-primary-red" />
          What happens when you dedicate a school?
        </h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-red" />
            A new chapter page is created under the school name with an auto-generated slug
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-red" />
            The assigned student lead is publicly listed as the chapter lead
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-red" />
            The chapter appears on the public /chapters page immediately
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-red" />
            The lead can be reassigned later from the maintainer dashboard
          </li>
        </ul>
      </div>
    </div>
  );
}
