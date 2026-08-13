import { EmailSignupForm } from "./EmailSignupForm";
import { siteConfig } from "@/config/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-neutral-200 px-6 py-8 dark:border-neutral-800">
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        <EmailSignupForm />
        <p className="text-xs text-neutral-400">
          {siteConfig.name} — {new Date().getFullYear()}. Questions?{" "}
          <a href={`mailto:${siteConfig.supportEmail}`} className="underline">
            {siteConfig.supportEmail}
          </a>
        </p>
      </div>
    </footer>
  );
}
