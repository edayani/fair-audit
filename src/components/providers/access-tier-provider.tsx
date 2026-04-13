"use client";

import { createContext, useContext, type ReactNode } from "react";

type AccessTier = "PREVIEW" | "FULL";

const AccessTierContext = createContext<AccessTier>("PREVIEW");

export function AccessTierProvider({
  accessTier,
  children,
}: {
  accessTier: AccessTier;
  children: ReactNode;
}) {
  return (
    <AccessTierContext.Provider value={accessTier}>
      {children}
    </AccessTierContext.Provider>
  );
}

export function useAccessTier(): AccessTier {
  return useContext(AccessTierContext);
}
