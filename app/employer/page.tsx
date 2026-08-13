import { redirect } from "next/navigation";
import { SignIn } from "@clerk/nextjs";

export const metadata = { title: "Employer sign in" };

// Accounts are optional and only used to edit an existing listing later —
// posting a job never requires signing in (see /post-a-job).
export default function EmployerSignInPage() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    redirect("/post-a-job");
  }

  return (
    <main className="mx-auto flex flex-1 items-center justify-center px-6 py-12">
      <SignIn forceRedirectUrl="/employer/listings" />
    </main>
  );
}
