"use client";

import { useEffect, useState } from "react";
import type { ComponentType } from "react";

export function ToasterProvider() {
  const [mounted, setMounted] = useState(false);
  const [ToasterComponent, setToasterComponent] = useState<ComponentType<{ richColors?: boolean; position?: "top-right" }> | null>(null);

  useEffect(() => {
    setMounted(true);
    void import("sonner").then((mod) => {
      setToasterComponent(() => mod.Toaster);
    });
  }, []);

  if (!mounted || !ToasterComponent) return null;

  return <ToasterComponent richColors position="top-right" />;
}
