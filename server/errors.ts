/** Domain errors thrown by services and mapped to HTTP / MCP responses. */

export type AppErrorCode =
  | "not_found"
  | "conflict"
  | "wip_limit"
  | "invalid"
  | "unauthorized"
  | "forbidden"
  | "unavailable"
  | "not_configured";

const STATUS: Record<AppErrorCode, number> = {
  not_found: 404,
  conflict: 409,
  wip_limit: 409,
  invalid: 400,
  unauthorized: 401,
  forbidden: 403,
  unavailable: 503,
  not_configured: 503,
};

export class AppError extends Error {
  constructor(
    public code: AppErrorCode,
    message: string,
    public details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "AppError";
  }

  get status() {
    return STATUS[this.code];
  }
}

export const notFound = (what: string) => new AppError("not_found", `${what} not found`);
