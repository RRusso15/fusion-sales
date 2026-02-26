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
    paddingTop: 46,
    position: "relative",
    overflowY: "auto",
    paddingBottom: 96,
  },

  bottomBar: {
    position: "absolute",
    bottom: 20,
    left: 0,
    width: "100%",
    textAlign: "center",
  },

  logoContainer: {
    textAlign: "center",
    marginBottom: 26,
  },

  logo: {
    width: 200,
    height: "auto",
    objectFit: "contain",
    },

  title: {
    textAlign: "center",
    marginBottom: 6,
  },

  subtitle: {
    textAlign: "center",
    marginBottom: 24,
    color: "#6b7280",
  },

  buttonContainer: {
    textAlign: "center",
    marginTop: 10,
    },

  button: {
    height: 44,
    borderRadius: 30,
    paddingLeft: 32,
    paddingRight: 32,
    },

  footerText: {
    textAlign: "center",
    marginTop: 15,
  },

  formItem: {
    marginBottom: 10,
    },
};
