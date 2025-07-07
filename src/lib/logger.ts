let silent =
  process.env.NODE_ENV === "test" || process.env.LOG_SILENT === "true";

export function setSilent(value: boolean) {
  silent = value;
}

export function log(...args: unknown[]): void {
  if (!silent) console.log(...args);
}

export function error(...args: unknown[]): void {
  if (!silent) console.error(...args);
}
