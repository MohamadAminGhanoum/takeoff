import { NextResponse } from "next/server";

export type ErrorCode = "INVALID_ACTION" | "NOT_FOUND" | "UNAUTHORIZED" | "VALIDATION_ERROR" | "INTERNAL_ERROR";

export class SidekickError extends Error {
  constructor(public status: number, public code: ErrorCode, message: string) {
    super(message);
  }
}

export const notFound = (msg: string) => new SidekickError(404, "NOT_FOUND", msg);
export const badInput = (msg: string) => new SidekickError(400, "VALIDATION_ERROR", msg);

export function errorResponse(e: SidekickError) {
  return NextResponse.json({ error: e.code, message: e.message }, { status: e.status });
}