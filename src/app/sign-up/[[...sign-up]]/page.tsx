import { ClerkProvider, SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <ClerkProvider
      dynamic
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/dashboard"
    >
      <div className="flex min-h-screen items-center justify-center">
        <SignUp
          path="/sign-up"
          routing="path"
          signInUrl="/sign-in"
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
