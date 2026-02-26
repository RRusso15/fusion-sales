import { CSSProperties } from "react";

export const unauthorizedStyles: Record<string, CSSProperties> = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    background:
      "linear-gradient(160deg, rgba(250,250,250,1) 0%, rgba(240,244,255,1) 100%)",
  },
  card: {
    width: "100%",
    maxWidth: 520,
    textAlign: "center",
    borderRadius: 16,
  },
};
