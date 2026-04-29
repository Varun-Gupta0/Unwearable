import { supabaseAdmin } from "./supabaseAdmin";

type LogSeverity = "info" | "warn" | "error" | "critical";

interface LogOptions {
  severity?: LogSeverity;
  payload?: Record<string, unknown>;
  order_id?: string;
  user_id?: string;
}

/**
 * Writes a structured log entry to the error_logs table.
 * Fails silently — logging should never crash the main flow.
 */
export async function log(
  context: string,
  message: string,
  options: LogOptions = {}
): Promise<void> {
  try {
    await supabaseAdmin.from("error_logs").insert({
      context,
      message,
      severity: options.severity ?? "error",
      payload: options.payload ?? null,
      order_id: options.order_id ?? null,
      user_id: options.user_id ?? null,
    });
  } catch {
    // Intentionally silent — never let logging crash the app
    console.error(`[logger] Failed to write log: ${context} — ${message}`);
  }
}
