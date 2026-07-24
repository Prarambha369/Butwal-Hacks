"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, Loader2, Building2, User, MapPin, Hash, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { dedicateSchool } from "@/lib/actions/admin";

/* ── Lumbini Province: districts → cities ─────────────────────── */
const LUMBINI_CITIES: Record<string, string[]> = {
  "Arghakhanchi": ["Sandhikharka", "Bhumikasthan", "Chhatradev", "Sitganga", "Malarani", "Pandini"],
  "Banke": ["Nepalgunj", "Kohalpur", "Khajura", "Janaki", "Naubasta", "Rapti-Sonari", "Baijanath", "Duduwa"],
  "Bardiya": ["Gulariya", "Barbardiya", "Rajapur", "Thakurbaba", "Geruwa", "Madhuwan", "Bansgadhi", "Badhaiyatal"],
  "Dang": ["Ghorahi", "Tulsipur", "Lamahi", "Bangla Chuli", "Shantinagar", "Rapti", "Gadhawa", "Rajpur"],
  "Eastern Rukum": ["Rukumkot", "Sisne", "Bhume", "Putha Uttarganga"],
  "Gulmi": ["Resunga (Tamghas)", "Musikot", "Isma", "Malika", "Chandrakot", "Satyawati", "Kali Mela"],
  "Kapilvastu": ["Taulihawa", "Kapilvastu", "Krishnanagar", "Banganga", "Buddhabhumi", "Shivaraj", "Mayadevi", "Sudharan"],
  "Palpa": ["Tansen", "Rampur", "Rampur City", "Madhav Pokhara", "Tinau", "Ribdikot", "Bagnaskali", "Purbakhola"],
  "Parasi (Nawalparasi West)": ["Ramgram", "Bardaghat", "Susta", "Sarawal", "Pratappur", "Sunwal", "Palhinandan"],
  "Pyuthan": ["Pyuthan Khalanga", "Swargadwari", "Gaumukhi", "Naubahini", "Jhimruk", "Mallarani", "Ayirawati", "Sarumarani"],
  "Rolpa": ["Liwang", "Rolpa", "Sunil", "Sunchhahari", "Madi", "Thawang", "Gangadev", "Runtigadhi"],
  "Rupandehi": ["Butwal", "Siddharthanagar", "Tillotama", "Sainamaina", "Devdaha", "Lumbini Sanskritik", "Suddhodhan", "Siyari", "Rohini", "Kotahimai"],
};

/* Sorted for display */
const DISTRICTS = Object.keys(LUMBINI_CITIES).sort();

/* ── Page ──────────────────────────────────────────────────────── */
export default function DedicateSchoolPage() {
  const router = useRouter();

  const [schoolName, setSchoolName] = useState("");
  const [leadName, setLeadName] = useState("");
  const [leadBhId, setLeadBhId] = useState("");
  const [district, setDistrict] = useState("");
  const [city, setCity] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  /* Filter cities based on selected district */
  const availableCities = useMemo(
    () => (district ? LUMBINI_CITIES[district] ?? [] : []),
    [district],
  );

  /* When district changes, reset city */
  const handleDistrictChange = (value: string) => {
    setDistrict(value);
    setCity("");
  };

  /* ── Submit ─────────────────────────────────────────────────── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!schoolName.trim()) {
      setError("School name is required.");
      return;
    }
    if (!leadName.trim()) {
      setError("Student lead name is required.");
      return;
    }
    if (!district) {
      setError("Please select a district.");
      return;
    }
    if (!city) {
      setError("Please select a city.");
      return;
    }

    setSubmitting(true);

    try {
      const result = await dedicateSchool({
        schoolName: schoolName.trim(),
        leadName: leadName.trim(),
        leadBhId: leadBhId.trim() || undefined,
        city,
        district,
      });

      if (result.success) {
        toast.success("School chapter created!", {
          description: `${schoolName.trim()} is now an active chapter in ${city}, ${district}, led by ${leadName.trim()}.`,
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
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-primary">
          Dedicate a School Chapter
        </h1>
        <p className="text-sm text-muted-foreground">
          Create a new school-based chapter in Lumbini Province. Select the district and city from the
          dropdowns below — these follow the official administrative divisions.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-xl space-y-5">
        {/* School Name */}
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

        {/* Lead Name */}
        <div>
          <label htmlFor="leadName" className="mb-1.5 block text-sm font-medium text-primary">
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

        {/* Lead BH-ID */}
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
            placeholder="e.g. BH-26-F2ECCEFC"
            className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-primary placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary-red/30 transition-all"
          />
        </div>

        {/* District + City — side by side */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* District Select */}
          <div>
            <label htmlFor="district" className="mb-1.5 block text-sm font-medium text-primary">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                District
              </span>
            </label>
            <div className="relative">
              <select
                id="district"
                value={district}
                onChange={(e) => handleDistrictChange(e.target.value)}
                className="w-full appearance-none rounded-lg border border-border bg-surface px-4 py-2.5 pr-10 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-primary-red/30 transition-all"
              >
                <option value="">Select district…</option>
                {DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            </div>
          </div>

          {/* City Select */}
          <div>
            <label htmlFor="city" className="mb-1.5 block text-sm font-medium text-primary">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                City / Municipality
              </span>
            </label>
            <div className="relative">
              <select
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                disabled={!district}
                className="w-full appearance-none rounded-lg border border-border bg-surface px-4 py-2.5 pr-10 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-primary-red/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <option value="">
                  {district ? "Select city…" : "Select district first"}
                </option>
                {availableCities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            </div>
          </div>
        </div>

        {/* Preview badge */}
        {city && district && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-surface px-3 py-2 rounded-lg border border-border">
            <MapPin className="w-3 h-3 text-primary-red" />
            <span>
              <strong className="text-primary">{city}</strong>,{" "}
              {district} &middot; Lumbini Province
            </span>
          </div>
        )}

        {/* Error message */}
        {error && (
          <p className="text-sm text-primary-red bg-primary-red/5 rounded-lg px-3 py-2 border border-primary-red/20">
            {error}
          </p>
        )}

        {/* Actions */}
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
            {submitting ? "Dedicating…" : "Dedicate School"}
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
