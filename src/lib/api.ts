import { NextResponse } from "next/server";

export function jsonError(status: number, message: string) {
  return NextResponse.json({ error: message }, { status });
}

export function handleAuthError(err: unknown) {
  if (err instanceof Error && err.message === "UNAUTHORIZED") {
    return jsonError(401, "É necessário estar logado.");
  }
  if (err instanceof Error && err.message === "FORBIDDEN") {
    return jsonError(403, "Acesso restrito ao admin.");
  }
  if (err instanceof Error && err.message === "DEACTIVATED") {
    return jsonError(403, "Sua conta foi desativada. Fale com a Brenda.");
  }
  return null;
}
