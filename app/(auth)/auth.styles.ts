import { CSSProperties } from "react";

export const authStyles: Record<string, CSSProperties> = {
  layout: {
    minHeight: "100vh",
    background: "url('/images/background.jpg')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },

  container: {
    width: '70%',
    height: '90vh',
    backgroundColor: "#ffffff",
    borderRadius: 24,
    overflow: "hidden",
    display: "flex",
  },

  formContainer: {
    maxWidth: 400,
    width: "100%",
    },

  leftPanel: {
    flex: 0.45,
    backgroundImage: "url('/images/hummingbird.jpg')",
    backgroundSize: "cover",
    backgroundPosition: "center",
  },

  rightPanel: {
    flex: 0.55,
    padding: "60px 50px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "center",
    paddingTop: 40,
    position: "relative",
    overflowY: "auto",
    paddingBottom: 96,
  },

  bottomBar: {
    position: "absolute",
    bottom: 10,
    left: 0,
    width: "100%",
    textAlign: "center",
  },

  logoContainer: {
    textAlign: "center",
    marginBottom: 10,
  },

  logo: {
    width: 180,
    height: "auto",
    objectFit: "contain",
    },

  title: {
    textAlign: "center",
    marginBottom: 1,
  },

  subtitle: {
    textAlign: "center",
    marginBottom: 18,
    color: "#6b7280",
  },

  buttonContainer: {
    textAlign: "center",
    marginTop: 8,
    },

  button: {
    height: 36,
    borderRadius: 30,
    paddingLeft: 32,
    paddingRight: 32,
    },

  footerText: {
    textAlign: "center",
    marginTop: 12,
  },

  formItem: {
    marginBottom: 8,
    },
};
