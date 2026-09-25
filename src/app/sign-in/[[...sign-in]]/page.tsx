import type { Metadata } from "next";
import { ClerkProvider, SignIn } from "@clerk/nextjs";
import { AuthShell } from "@/components/marketing/auth-shell";
import { clerkAuthAppearance } from "@/lib/clerk-appearance";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your FairAudit compliance workspace.",
};

export default function SignInPage() {
  return (
    <ClerkProvider
      dynamic
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/dashboard"
    >
      <AuthShell mode="sign-in">
        <SignIn
          path="/sign-in"
          routing="path"
          signUpUrl="/sign-up"
          fallbackRedirectUrl="/dashboard"
          oauthFlow="redirect"
          appearance={clerkAuthAppearance}
        />
      </AuthShell>
    </ClerkProvider>
  );
}
