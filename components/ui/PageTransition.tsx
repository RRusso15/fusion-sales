"use client";

import { useEffect, useState } from "react";
import { shouldReduceMotion } from "@/utils/motion";

export function PageTransition({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const [entered, setEntered] = useState(shouldReduceMotion());

  useEffect(() => {
    if (shouldReduceMotion()) {
      setEntered(true);
      return;
    }
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const transitionClass = `page-transition${entered ? " page-transition-entered" : ""}`;
  return <div className={`${transitionClass} ${className}`.trim()}>{children}</div>;
}

