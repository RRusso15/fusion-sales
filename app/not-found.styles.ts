import { CSSProperties } from "react";

export const notFoundStyles: Record<string, CSSProperties> = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    background:
      "linear-gradient(160deg, rgba(252,252,252,1) 0%, rgba(234,244,255,1) 100%)",
  },
  card: {
    width: "100%",
    maxWidth: 520,
    textAlign: "center",
    borderRadius: 16,
  },
};
