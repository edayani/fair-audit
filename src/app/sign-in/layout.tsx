import { ClerkProvider } from "@clerk/nextjs";

export default function SignInLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      proxyUrl={process.env.NEXT_PUBLIC_CLERK_PROXY_URL ?? "/__clerk"}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/dashboard"
    >
      {children}
    </ClerkProvider>
  );
}
