import { CSSProperties } from "react";

export const appShellStyles: Record<string, CSSProperties> = {
  root: {
    minHeight: "100vh",
    background: "#f3f6f7",
  },
  header: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 200,
    background: "#ffffff",
    borderBottom: "1px solid #edf2f4",
    padding: "0 16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  mobileMenuButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },
  headerBrand: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  headerBrandText: {
    color: "#18343c",
    fontWeight: 700,
    fontSize: 18,
  },
  userButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
  },
  sider: {
    position: "fixed",
    left: 0,
    bottom: 0,
    background: "#0f4d4f",
    display: "flex",
    flexDirection: "column",
    zIndex: 150,
  },
  menu: {
    flex: 1,
    background: "#0f4d4f",
    borderInlineEnd: "none",
    paddingTop: 8,
  },
  mobileMenu: {
    borderInlineEnd: "none",
  },
  siderFooter: {
    padding: 12,
    borderTop: "1px solid rgba(255,255,255,0.12)",
  },
  main: {
    minHeight: "100vh",
    padding: 20,
    background: "#f3f6f7",
    position: "relative",
  },
  routeLoadingOverlay: {
    position: "fixed",
    right: 0,
    bottom: 0,
    background: "rgba(243,246,247,0.70)",
    backdropFilter: "blur(1px)",
    zIndex: 70,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  headingWrap: {
    display: "flex",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    marginBottom: 18,
  },
  headingTextWrap: {
    display: "flex",
    flexDirection: "column",
  },
  headingTitle: {
    margin: 0,
    fontSize: 28,
    lineHeight: "36px",
    color: "#18343c",
    fontWeight: 700,
  },
  headingSubTitle: {
    marginTop: 4,
    color: "#6a7f86",
    fontSize: 15,
    lineHeight: "22px",
  },
};
