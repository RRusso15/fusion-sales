import { CSSProperties } from "react";

export const capabilityStyles: Record<string, CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  header: {
    borderRadius: 16,
  },
  actions: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    marginTop: 12,
  },
  cardsRow: {
    width: "100%",
  },
};
