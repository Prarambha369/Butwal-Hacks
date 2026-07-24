"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  User,
  ShieldCheck,
  CalendarDays,
  Building2,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Lock,
  Loader2,
  Mail,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { selectRole, requestRoleUpgrade } from "@/lib/actions/role-selection";

interface RoleOption {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  dot: string;
  bg: string;
  border: string;
  access: "open" | "restricted" | "request";
  eligibilityLabel?: string;
  eligibilityMet?: boolean;
}

interface RoleSelectorProps {
  email: string;
  emailVerified: boolean;
}

export const ROLE_SELECTED_KEY = "bh:role-selected";

export function RoleSelector({ email, emailVerified }: RoleSelectorProps) {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRequestForm, setShowRequestForm] = useState<string | null>(null);
  const [requestMessage, setRequestMessage] = useState("");
  const [requestSent, setRequestSent] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [requestSubmitting, setRequestSubmitting] = useState(false);

  const isButwalEmail = email.endsWith("@butwalhacks.com");

  const roles: RoleOption[] = [
    {
      id: "hacker",
      title: "Hacker",
      description: "Participate in hackathons, submit projects, earn trust markers, and build your reputation.",
      icon: <User className="w-6 h-6" />,
      color: "text-status-green",
      dot: "bg-status-green",
      bg: "bg-status-green/10",
      border: "border-status-green/20",
      access: "open",
      eligibilityLabel: "Everyone",
      eligibilityMet: true,
    },
    {
      id: "maintainer",
      title: "Maintainer",
      description: "Manage users, review access requests, oversee trust markers, and configure the platform.",
      icon: <ShieldCheck className="w-6 h-6" />,
      color: "text-primary-red",
      dot: "bg-primary-red",
      bg: "bg-primary-red/10",
      border: "border-primary-red/20",
      access: isButwalEmail && emailVerified ? "open" : "restricted",
      eligibilityLabel: isButwalEmail
        ? emailVerified
          ? "Verified · @butwalhacks.com"
          : "Verify your email first"
        : "Requires @butwalhacks.com",
      eligibilityMet: isButwalEmail && emailVerified,
    },
    {
      id: "organizer",
      title: "Organizer",
      description: "Create and manage hackathon events, issue trust markers to participants, and manage teams.",
      icon: <CalendarDays className="w-6 h-6" />,
      color: "text-status-yellow",
      dot: "bg-status-yellow",
      bg: "bg-status-yellow/10",
      border: "border-status-yellow/20",
      access: "request",
      eligibilityLabel: "Approved by Maintainer",
      eligibilityMet: false,
    },
    {
      id: "sponsor",
      title: "Sponsor",
      description: "Discover hackers, post bounties, manage your company profile, and recruit talent.",
      icon: <Building2 className="w-6 h-6" />,
      color: "text-status-blue",
      dot: "bg-status-blue",
      bg: "bg-status-blue/10",
      border: "border-status-blue/20",
      access: "request",
      eligibilityLabel: "Approved by Organizer or Maintainer",
      eligibilityMet: false,
    },
  ];

  const handleSelect = useCallback(async (roleId: string) => {
    const role = roles.find((r) => r.id === roleId);
    if (!role) return;

    if (role.access === "request") {
      setShowRequestForm(roleId);
      setSelectedRole(null);
      setError(null);
      return;
    }

    if (role.access === "restricted" && !role.eligibilityMet) {
      setError(role.eligibilityLabel ?? "This role is not available to you.");
      return;
    }

    setSelectedRole(roleId);
    setIsSubmitting(true);
    setError(null);

    // Set localStorage BEFORE the server action redirects us away
    localStorage.setItem(ROLE_SELECTED_KEY, "true");

    const formData = new FormData();
    formData.set("role", roleId);

    const result = await selectRole(formData);
    if (result?.error) {
      setError(result.error);
      toast.error(result.error);
      setIsSubmitting(false);
      setSelectedRole(null);
    }
    // If success, the server action redirects
  }, [roles]);

  const handleSkip = useCallback(() => {
    localStorage.setItem(ROLE_SELECTED_KEY, "true");
    window.location.href = "/dashboard/hacker";
  }, []);

  const handleRequestSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showRequestForm) return;

    setRequestSubmitting(true);
    setRequestError(null);

    const formData = new FormData();
    formData.set("requestedRole", showRequestForm);
    formData.set("message", requestMessage);

    const result = await requestRoleUpgrade(formData);
    if (result.success) {
      setRequestSent(true);
      setRequestMessage("");
    } else {
      setRequestError(result.error ?? "Failed to submit request.");
      toast.error(result.error ?? "Failed to submit request.");
    }
    setRequestSubmitting(false);
  }, [showRequestForm, requestMessage]);

  const handleBackToRoles = useCallback(() => {
    setShowRequestForm(null);
    setRequestSent(false);
    setRequestError(null);
    setRequestMessage("");
  }, []);

  // Show request form for restricted roles
  if (showRequestForm) {
    const role = roles.find((r) => r.id === showRequestForm)!;
    return (
      <div className="bh-card p-6 md:p-8 max-w-lg mx-auto">
        {requestSent ? (
          <div className="text-center space-y-4 py-6">
            <div className="w-16 h-16 rounded-full bg-status-green/20 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-status-green" />
            </div>
            <h2 className="text-xl font-bold text-primary">Request Sent!</h2>
            <p className="text-sm text-muted-foreground">
              Your request for <strong className="text-primary">{role.title}</strong> access has been submitted. A maintainer will review it and reach out to you.
            </p>
            <button
              onClick={handleSkip}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary-red text-white text-sm font-bold hover:bg-deep-red transition-all"
            >
              Proceed as Hacker <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <button onClick={handleBackToRoles} className="p-1.5 rounded-lg hover:bg-surface-hover text-muted-foreground hover:text-primary transition-colors">
                <ArrowRight className="w-4 h-4 rotate-180" />
              </button>
              <div>
                <h2 className="text-lg font-bold text-primary">Request {role.title} Access</h2>
                <p className="text-xs text-muted-foreground">{role.description}</p>
              </div>
            </div>

            <form onSubmit={handleRequestSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-primary flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5" /> Why do you need {role.title} access?
                </label>
                <textarea
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  placeholder="Tell us a bit about your role, organization, and why you need access..."
                  className="bh-textarea min-h-[120px] text-sm"
                  rows={4}
                  required
                  minLength={10}
                  maxLength={1000}
                />
                <p className="text-[10px] text-muted-foreground text-right">{requestMessage.length}/1000</p>
              </div>

              {requestError && (
                <div className="p-3 rounded-lg bg-primary-red/10 border border-primary-red/20 text-xs text-primary-red">
                  {requestError}
                </div>
              )}

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={requestSubmitting || requestMessage.trim().length < 10}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary-red text-white text-xs font-bold hover:bg-deep-red transition-all ${requestSubmitting || requestMessage.trim().length < 10 ? 'bh-btn-disabled' : ''}`}
                >
                  {requestSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Submit Request
                </button>
                <button
                  type="button"
                  onClick={handleSkip}
                  className="text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  Skip, I&apos;ll join as Hacker
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-3 max-w-xl mx-auto">
        <div className="inline-flex p-3 rounded-xl bg-primary-red/10">
          <Sparkles className="w-6 h-6 text-primary-red" />
        </div>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-primary">
          Welcome to Butwal Hacks
        </h1>
        <p className="text-sm text-muted-foreground">
          Select your role to get started. Your role determines what tools and features you can access.
          You can always change it later or request an upgrade.
        </p>
      </div>

      {/* Role cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
        {roles.map((role) => {
          const isSelected = selectedRole === role.id;
          const isDisabled = role.access === "restricted" && !role.eligibilityMet;
          const needsRequest = role.access === "request";

          return (
            <button
              key={role.id}
              onClick={() => handleSelect(role.id)}
              disabled={isSubmitting}
              className={cn(
                "relative bh-card p-5 md:p-6 text-left transition-all duration-200 group",
                "hover:border-primary-red/30 hover:-translate-y-0.5",
                isSelected && "ring-2 ring-primary-red border-primary-red",
                isDisabled && "opacity-50 cursor-not-allowed hover:border-border hover:-translate-y-0",
                needsRequest && "cursor-pointer"
              )}
            >
              {/* Role icon */}
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center mb-4",
                role.bg, role.color
              )}>
                {role.icon}
              </div>

              {/* Title + badge */}
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-bold text-primary">{role.title}</h3>
                {isDisabled && (
                  <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                )}
                {needsRequest && (
                  <span className={cn(
                    "text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full",
                    "bg-status-blue/10 text-status-blue"
                  )}>
                    Request
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                {role.description}
              </p>

              {/* Eligibility / Action */}
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <span className={cn(
                  "text-[10px] font-medium flex items-center gap-1",
                  role.eligibilityMet ? "text-status-green" : "text-muted-foreground"
                )}>
                  {role.eligibilityMet ? (
                    <CheckCircle2 className="w-3 h-3" />
                  ) : (
                    <Lock className="w-3 h-3" />
                  )}
                  {role.eligibilityLabel}
                </span>

                {isSubmitting && isSelected ? (
                  <Loader2 className="w-4 h-4 animate-spin text-primary-red" />
                ) : needsRequest ? (
                  <span className="text-[11px] font-bold text-status-blue group-hover:underline">
                    Request →
                  </span>
                ) : !isDisabled ? (
                  <span className="text-[11px] font-bold text-primary-red opacity-0 group-hover:opacity-100 transition-opacity">
                    Select →
                  </span>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>

      {/* Error message */}
      {error && (
        <div className="max-w-lg mx-auto p-4 rounded-lg bg-primary-red/10 border border-primary-red/20 text-xs text-primary-red text-center">
          <Mail className="w-4 h-4 inline-block mr-1.5" />
          {error}
        </div>
      )}

      {/* Skip + footer */}
      <div className="text-center space-y-3">
        <button
          onClick={handleSkip}
          className="text-xs text-muted-foreground hover:text-primary transition-colors underline underline-offset-2"
        >
          Skip — I&apos;ll join as a Hacker for now
        </button>
        <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground/40">
          <span>Roles can be changed later</span>
          <span className="w-1 h-1 rounded-full bg-border" />
          <span>{email}</span>
        </div>
      </div>
    </div>
  );
}
