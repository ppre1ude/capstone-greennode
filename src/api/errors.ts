export const createApiError = (status: number, data: unknown) => {
  const error = new Error(
    `Request failed with status code ${status}`,
  ) as Error & {
    response?: { status: number; data: unknown };
  };
  error.response = { status, data };
  return error;
};
