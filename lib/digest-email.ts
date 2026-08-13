import { siteConfig } from "@/config/site";
import type { JobWithCompany } from "@/lib/data/jobs";

// Plain, fast-loading HTML — no external stylesheets/webfonts, per the brief.
export function renderDigestEmail(jobs: JobWithCompany[], unsubscribeUrl: string): { subject: string; html: string } {
  const rows = jobs
    .map((job) => {
      const location = job.remote_type === "remote" ? "Remote" : job.city ?? "Location TBD";
      return `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #e5e5e5;">
            <a href="${siteConfig.domain}/jobs/${job.slug}" style="font-size:15px;font-weight:600;color:#111;text-decoration:none;">${job.title}</a>
            <div style="font-size:13px;color:#666;margin-top:2px;">${job.company.name} — ${location}</div>
          </td>
        </tr>`;
    })
    .join("");

  const html = `
    <div style="font-family:-apple-system,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;">
      <h1 style="font-size:18px;">${jobs.length} new ${siteConfig.niche} role${jobs.length === 1 ? "" : "s"} this week</h1>
      <table style="width:100%;border-collapse:collapse;">${rows}</table>
      <p style="font-size:12px;color:#999;margin-top:24px;">
        <a href="${unsubscribeUrl}" style="color:#999;">Unsubscribe</a> from ${siteConfig.name} alerts.
      </p>
    </div>`;

  return { subject: `${jobs.length} new ${siteConfig.niche} role${jobs.length === 1 ? "" : "s"} this week`, html };
}
