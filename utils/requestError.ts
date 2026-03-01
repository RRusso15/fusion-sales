export const getErrorMessage = (
  error: unknown,
  fallback: string = "Request failed"
) => {
  const status = (error as { response?: { status?: number } })?.response?.status;
  if (status === 400) return "Validation error. Check your input.";
  if (status === 403) return "Access denied.";
  if (status === 404) return "Resource not found.";
  return fallback;
};
