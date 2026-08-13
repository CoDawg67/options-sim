"use client";

import { useState } from "react";
import { siteConfig } from "@/config/site";

export function PostAJobForm() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const salaryMin = form.get("salaryMin");
    const salaryMax = form.get("salaryMax");

    const payload = {
      companyName: String(form.get("companyName") ?? ""),
      companyWebsite: String(form.get("companyWebsite") ?? ""),
      title: String(form.get("title") ?? ""),
      city: String(form.get("city") ?? ""),
      remoteType: String(form.get("remoteType") ?? "onsite"),
      salaryMin: salaryMin ? Number(salaryMin) : undefined,
      salaryMax: salaryMax ? Number(salaryMax) : undefined,
      employmentType: String(form.get("employmentType") ?? ""),
      descriptionSnippet: String(form.get("descriptionSnippet") ?? ""),
      applyUrl: String(form.get("applyUrl") ?? ""),
      contactEmail: String(form.get("contactEmail") ?? ""),
      featured: form.get("featured") === "on",
    };

    try {
      const res = await fetch("/api/employer/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.checkoutUrl) {
        setError(data.error ?? "Something went wrong.");
        setSubmitting(false);
        return;
      }
      window.location.href = data.checkoutUrl;
    } catch {
      setError("Something went wrong — try again.");
      setSubmitting(false);
    }
  }

  const inputClass = "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          Company name
          <input name="companyName" required className={inputClass} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Company website
          <input name="companyWebsite" type="url" placeholder="https://" className={inputClass} />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        Job title
        <input name="title" required className={inputClass} />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          City (leave blank if fully remote)
          <input name="city" className={inputClass} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Work type
          <select name="remoteType" className={inputClass} defaultValue="remote">
            <option value="remote">Remote</option>
            <option value="hybrid">Hybrid</option>
            <option value="onsite">Onsite</option>
          </select>
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          Salary min (USD/year, optional)
          <input name="salaryMin" type="number" min={0} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Salary max (USD/year, optional)
          <input name="salaryMax" type="number" min={0} className={inputClass} />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        Employment type (optional)
        <input name="employmentType" placeholder="Full-time" className={inputClass} />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Short description (max 300 characters — link out for the full posting)
        <textarea name="descriptionSnippet" required maxLength={300} rows={4} className={inputClass} />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Where should applicants apply?
        <input name="applyUrl" type="url" required placeholder="https://" className={inputClass} />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Your email (receipt + listing link)
        <input name="contactEmail" type="email" required className={inputClass} />
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="featured" />
        Pin to top for 30 days — +${(siteConfig.featuredPriceCents / 100).toFixed(0)}
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="mt-2 rounded-md bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-neutral-900"
      >
        {submitting ? "Redirecting to checkout…" : "Continue to payment"}
      </button>
    </form>
  );
}
