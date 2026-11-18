import axios, { isAxiosError } from "axios";
import type { ApiErrorBody } from "./api-types";

export const api = axios.create({ baseURL: "/api", timeout: 15_000 });

// The server computes "today" in the user's time zone.
api.interceptors.request.use((config) => {
  config.headers.set("x-timezone", Intl.DateTimeFormat().resolvedOptions().timeZone);
  return config;
});

export type ApiError = { status: number; code: string; message: string; count?: number; limit?: number };

export function toApiError(error: unknown): ApiError {
  if (isAxiosError<ApiErrorBody>(error)) {
    const body = error.response?.data?.error;
    return {
      status: error.response?.status ?? 0,
      code: body?.code ?? (error.response ? "internal" : "network"),
      message: body?.message ?? (error.response ? "Something broke." : "You're offline. Or the internet is."),
      count: body?.count,
      limit: body?.limit,
    };
  }
  return { status: 0, code: "unknown", message: "Something broke." };
}
