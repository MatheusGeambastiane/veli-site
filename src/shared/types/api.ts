export type ApiResponse<T> = {
  success: boolean;
  data: T;
};

export type ApiError = {
  message: string;
  status: number;
  details?: unknown;
};

export type AuthTokenProvider = () => Promise<string | null> | string | null;
