import { CSSProperties } from "react";

export const adminStyles: Record<string, CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  hero: {
    borderRadius: 16,
  },
  tags: {
    display: "flex",
    gap: 8,
    marginTop: 10,
    flexWrap: "wrap",
  },
  actions: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    marginTop: 12,
  },
  section: {
    borderRadius: 16,
  },
};
