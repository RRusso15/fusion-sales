"use client";

export const motionConfig = {
  durationFast: 120,
  durationMed: 180,
  durationSlow: 240,
  easing: "cubic-bezier(0.2, 0, 0, 1)",
} as const;

export function shouldReduceMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

