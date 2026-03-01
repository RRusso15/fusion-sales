"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export const useRouteLoading = () => {
  const [isRouteLoading, setIsRouteLoading] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startRouteLoading = useCallback(() => {
    setIsRouteLoading(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setIsRouteLoading(false), 10000);
  }, []);

  const stopRouteLoading = useCallback(() => {
    setIsRouteLoading(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    []
  );

  return { isRouteLoading, startRouteLoading, stopRouteLoading };
};

