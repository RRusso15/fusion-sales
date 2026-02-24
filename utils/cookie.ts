export const setAuthCookie = (token: string) => {
  document.cookie = `auth_token=${token}; path=/;`;
};

export const removeAuthCookie = () => {
  document.cookie =
    "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
};

export const getAuthCookie = () => {
  if (typeof document === "undefined") return null;

  const match = document.cookie.match(
    new RegExp("(^| )auth_token=([^;]+)")
  );
  return match ? match[2] : null;
};