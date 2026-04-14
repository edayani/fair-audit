import { ClerkProvider, SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <ClerkProvider
      dynamic
      proxyUrl={process.env.NEXT_PUBLIC_CLERK_PROXY_URL ?? "/__clerk"}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/dashboard"
    >
      <div className="flex min-h-screen items-center justify-center">
        <SignIn
          path="/sign-in"
          routing="path"
          signUpUrl="/sign-up"
          fallbackRedirectUrl="/dashboard"
          oauthFlow="redirect"
          appearance={{
            elements: {
              socialButtonsBlockButton: "hidden",
              dividerRow: "hidden",
            },
          }}
        />
      </div>
    </ClerkProvider>
  );
}
