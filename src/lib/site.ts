// Canonical site metadata shared by the marketing site, metadata routes, and emails.
export const SITE = {
  name: "FairAudit",
  url: process.env.NEXT_PUBLIC_APP_URL?.startsWith("https://") ? process.env.NEXT_PUBLIC_APP_URL : "https://fairaudit.site",
  tagline: "Fair housing compliance for affordable & supportive housing",
  description:
    "FairAudit is AI-assisted compliance infrastructure for affordable, supportive, and homeless housing operators — making every tenant-screening decision lawful, explainable, reviewable, and defensible under the Fair Housing Act, FCRA, and HUD guidance.",
} as const;
