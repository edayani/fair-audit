// Shared Clerk component styling so auth and org screens match the FairAudit design system.

/** Theme-neutral settings used inside the app shell (works in light and dark mode). */
export const clerkAppearance = {
  variables: {
    colorPrimary: "#1f3563",
    borderRadius: "0.625rem",
    fontFamily: "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
    fontSize: "0.9rem",
  },
  elements: {
    // Tailwind v4 utilities live in a cascade layer, so they need ! to beat Clerk's unlayered styles
    organizationSwitcherTrigger: "!text-foreground",
    organizationPreviewMainIdentifier: "!text-foreground",
    userButtonTrigger: "focus:shadow-none",
  },
};

/** Full light styling for the standalone sign-in / sign-up / onboarding cards. */
export const clerkAuthAppearance = {
  variables: {
    ...clerkAppearance.variables,
    colorText: "#161d2e",
    colorTextSecondary: "#5b6478",
    colorBackground: "#ffffff",
    colorInputBackground: "#ffffff",
    colorInputText: "#161d2e",
  },
  elements: {
    rootBox: "w-full",
    cardBox: "w-full shadow-none border border-[#e3e7ef] rounded-2xl",
    card: "shadow-none",
    headerTitle: "!font-serif !text-[22px] !tracking-tight",
    formButtonPrimary: "shadow-sm normal-case text-sm font-medium",
    footerActionLink: "font-medium",
    // Email sign-in only (social providers intentionally disabled)
    socialButtons: "!hidden",
    socialButtonsBlockButton: "!hidden",
    dividerRow: "!hidden",
  },
};
