import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FairAudit - Fair Housing AI Auditor",
  description: "Compliance and risk-control layer for fair housing screening workflows",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">{children}</body>
    </html>
  );
}
