"use client";

import { useEffect, useState } from "react";
import type { ComponentType, ReactNode } from "react";
import { ToasterProvider } from "@/components/providers/toaster-provider";

type ThemeProviderProps = {
  attribute: string;
  defaultTheme: string;
  enableSystem: boolean;
  disableTransitionOnChange: boolean;
  children: ReactNode;
};

export function AppProviders({ children }: { children: ReactNode }) {
  const [themeProviderState, setThemeProviderState] = useState<{ Component: ComponentType<ThemeProviderProps> } | null>(null);

  useEffect(() => {
    void import("@/components/providers/theme-provider").then((mod) => {
      setThemeProviderState({
        Component: mod.ThemeProvider as ComponentType<ThemeProviderProps>,
      });
    });
  }, []);

  if (!themeProviderState) {
    return (
      <>
        {children}
        <ToasterProvider />
      </>
    );
  }

  const ThemeProviderComponent = themeProviderState.Component;

  return (
    <ThemeProviderComponent attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
      <ToasterProvider />
    </ThemeProviderComponent>
  );
}
