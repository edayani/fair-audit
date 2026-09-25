import type { Metadata } from "next";
import { ClerkProvider, SignUp } from "@clerk/nextjs";
import { AuthShell } from "@/components/marketing/auth-shell";
import { clerkAuthAppearance } from "@/lib/clerk-appearance";

export const metadata: Metadata = {
  title: "Create your workspace",
  description: "Create a FairAudit workspace and explore fair-housing compliance with a sample affordable-housing portfolio.",
};

export default function SignUpPage() {
  return (
    <ClerkProvider
      dynamic
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/dashboard"
    >
      <AuthShell mode="sign-up">
        <SignUp
          path="/sign-up"
          routing="path"
          signInUrl="/sign-in"
          fallbackRedirectUrl="/dashboard"
          oauthFlow="redirect"
          appearance={clerkAuthAppearance}
        />
      </AuthShell>
    </ClerkProvider>
  );
}
